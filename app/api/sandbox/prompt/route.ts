import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { NextResponse } from "next/server";
import { CONFIG } from "@/lib/config";
import { parseNear } from "@/lib/format";
import { api } from "@/lib/near";
import { evaluateMandatePolicy, simulateAgentUnderAttack } from "@/lib/sandbox/prompt-agent";
import type { Mandate, Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

const MANDATE = Number(process.env.SANDBOX_MANDATE_ID ?? "");
const AGENT = process.env.SANDBOX_AGENT_ACCOUNT ?? "";
const KEY = process.env.SANDBOX_AGENT_KEY ?? "";
const configured = Number.isInteger(MANDATE) && MANDATE > 0 && !!AGENT && !!KEY && !!CONFIG.contractId;

// Best-effort IP rate limiting
const PER_IP_PER_MIN = 10;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const mine = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (mine.length >= PER_IP_PER_MIN) return true;
  mine.push(now);
  hits.set(ip, mine);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim();
  if (!prompt || prompt.length < 3) {
    return NextResponse.json({ error: "Prompt is too short." }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return NextResponse.json({ error: "Prompt is too long (maximum 1,000 characters)." }, { status: 400 });
  }

  // Fetch live mandate
  let mandate: Mandate | null = null;
  if (MANDATE > 0) {
    try {
      mandate = await api.mandate(MANDATE);
    } catch {}
  }

  // Fallback mock mandate if not configured or RPC unavailable
  if (!mandate) {
    mandate = {
      id: MANDATE > 0 ? MANDATE : 1,
      owner: "bridle-owner.testnet",
      agent: AGENT || "bridle-agent.testnet",
      chains: ["Near", "Base"],
      assets: ["NEAR", "USDC"],
      per_tx_cap: "10000000000000000000000000", // 10 NEAR
      daily_cap: "50000000000000000000000000", // 50 NEAR
      cooling_threshold: "5000000000000000000000000", // 5 NEAR
      challenge_window_s: 600,
      bond: "1000000000000000000000000",
      bond_posted: "1000000000000000000000000",
      expires_at: "1893456000000000000",
      state: "Active",
      day_index: 20000,
      spent_today: "0",
      created_at: "1700000000000000000",
      allowlist: [
        { chain: "Near", address: "vendor.testnet" },
        { chain: "Base", address: "0x1234567890abcdef1234567890abcdef12345678" },
      ],
      pending_limits: null,
    };
  }

  // Simulate agent falling for prompt injection
  const agentSim = simulateAgentUnderAttack(prompt, mandate);
  const yocto = parseNear(agentSim.attempt.amount) ?? 0n;

  // If live sandbox keys are configured, submit proposal to the smart contract on testnet
  let contractProposal: Proposal | null = null;
  if (configured) {
    try {
      const signer = KeyPairSigner.fromSecretKey(KEY as `ed25519:${string}`);
      const account = new Account(AGENT, new JsonRpcProvider({ url: CONFIG.rpc }), signer);
      contractProposal = await account.callFunction<Proposal>({
        contractId: CONFIG.contractId,
        methodName: "propose_payment",
        args: {
          mandate_id: MANDATE,
          chain: agentSim.attempt.chain,
          asset: agentSim.attempt.asset,
          amount: yocto.toString(),
          recipient: agentSim.attempt.recipient,
        },
        gas: 30_000_000_000_000n,
        deposit: 0n,
      });
    } catch (e) {
      console.warn("[Sandbox Prompt] Contract call failed, falling back to local policy evaluation:", e);
    }
  }

  // Evaluate policy outcome
  const localVerdict = evaluateMandatePolicy(agentSim.attempt, mandate, yocto);

  const verdict = contractProposal
    ? {
        blocked: contractProposal.status === "Rejected",
        label: contractProposal.status === "Rejected" ? "Blocked" : contractProposal.status === "Waiting" ? "Held for review" : "Allowed",
        reason: contractProposal.reason || (contractProposal.status === "Rejected" ? "Refused by the contract." : "Within mandate rules."),
        invariant: localVerdict.invariant,
      }
    : localVerdict;

  return NextResponse.json({
    ok: true,
    prompt,
    agent: agentSim,
    proposal: contractProposal,
    verdict,
  });
}
