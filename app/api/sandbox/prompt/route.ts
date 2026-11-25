import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";
import { api } from "@/lib/near";
import { evaluateMandatePolicy, parseAttemptAmount, simulateAgentUnderAttack } from "@/lib/sandbox/prompt-agent";
import { sandboxLimited, simulatedMandate } from "@/lib/sandbox/shared";
import type { Mandate, Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Prompt-injection demo. A scripted agent (not a language model) always "falls" for the text a
 * visitor writes and proposes a payment from it. When the sandbox is switched on, that proposal
 * goes to the real contract, which decides. Otherwise the same rules run locally and the answer
 * is marked `source: "simulated"`. Like the manual route, this only ever calls `propose_payment`.
 */

const MANDATE = Number(process.env.SANDBOX_MANDATE_ID ?? "");
const AGENT = process.env.SANDBOX_AGENT_ACCOUNT ?? "";
const KEY = process.env.SANDBOX_AGENT_KEY ?? "";
const configured = Number.isInteger(MANDATE) && MANDATE > 0 && !!AGENT && !!KEY && !!CONFIG.contractId;

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const wait = sandboxLimited(ip);
  if (wait) return NextResponse.json({ error: wait }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 3) return NextResponse.json({ error: "Prompt is too short." }, { status: 400 });
  if (prompt.length > 1000) return NextResponse.json({ error: "Prompt is too long (maximum 1,000 characters)." }, { status: 400 });

  let mandate: Mandate | null = null;
  if (configured) {
    try {
      mandate = await api.mandate(MANDATE);
    } catch {
      return NextResponse.json({ error: "Could not read the contract right now." }, { status: 502 });
    }
  }
  const live = configured && mandate !== null;
  const rule = mandate ?? simulatedMandate(1);

  const agent = simulateAgentUnderAttack(prompt, rule);
  const { attempt } = agent;
  // Amounts are in the asset's own smallest unit (NEAR: 24 decimals, USDC: 6).
  const amount = parseAttemptAmount(attempt.amount, attempt.asset) ?? BigInt(0);
  const local = evaluateMandatePolicy(attempt, rule, amount);

  if (live) {
    try {
      const signer = KeyPairSigner.fromSecretKey(KEY as `ed25519:${string}`);
      const account = new Account(AGENT, new JsonRpcProvider({ url: CONFIG.rpc }), signer);
      const proposal = await account.callFunction<Proposal>({
        contractId: CONFIG.contractId,
        methodName: "propose_payment",
        args: {
          mandate_id: MANDATE,
          chain: attempt.chain,
          asset: attempt.asset,
          amount: amount.toString(),
          recipient: attempt.recipient,
        },
        gas: BigInt("30000000000000"),
        deposit: BigInt(0),
      });
      const rejected = proposal.status === "Rejected";
      return NextResponse.json({
        ok: true,
        prompt,
        source: "contract",
        agent,
        proposal,
        verdict: {
          blocked: rejected,
          label: rejected ? "Blocked" : proposal.status === "Waiting" ? "Held for review" : "Allowed",
          reason: proposal.reason || (rejected ? "Refused by the contract." : "Within the rule."),
          invariant: local.invariant,
        },
      });
    } catch {
      return NextResponse.json({ error: "The contract did not answer. Try again." }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, prompt, source: "simulated", agent, proposal: null, verdict: local });
}
