import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { NextResponse } from "next/server";
import { CHAINS, CONFIG } from "@/lib/config";
import { parseNear } from "@/lib/format";
import { api } from "@/lib/near";
import { evaluateMandatePolicy, parseAttemptAmount } from "@/lib/sandbox/prompt-agent";
import { sandboxLimited, simulatedMandate } from "@/lib/sandbox/shared";
import type { Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The attack sandbox. Visitors play a rogue agent against ONE real testnet mandate.
 *
 * What this route can and cannot do:
 *  - It only ever calls `propose_payment`. The contract records its decision (Rejected, with the
 *    rule that stopped it, or Ready). It never calls `execute`, so no NEAR leaves the mandate
 *    through this page, whatever a visitor sends.
 *  - The key it holds is the sandbox agent's, which has no authority beyond that one mandate.
 *  - When the sandbox is not switched on, answers come from a local copy of the rules and are
 *    marked `simulated: true`. They are never presented as on-chain decisions.
 */

const MANDATE = Number(process.env.SANDBOX_MANDATE_ID ?? "");
const AGENT = process.env.SANDBOX_AGENT_ACCOUNT ?? "";
const KEY = process.env.SANDBOX_AGENT_KEY ?? "";
const configured = Number.isInteger(MANDATE) && MANDATE > 0 && !!AGENT && !!KEY && !!CONFIG.contractId;

export async function GET() {
  if (!configured) {
    return NextResponse.json({
      configured: true,
      simulated: true,
      mandate: simulatedMandate(1),
      balance: "0",
      proposals: [],
    });
  }
  try {
    const [mandate, balance, recent] = await Promise.all([
      api.mandate(MANDATE),
      api.nearBalance(MANDATE).catch(() => "0"),
      api.proposals(MANDATE, 100),
    ]);
    if (!mandate) return NextResponse.json({ configured: false });
    return NextResponse.json({
      configured: true,
      simulated: false,
      mandate,
      balance,
      proposals: recent.slice(-15).reverse(),
    });
  } catch {
    return NextResponse.json({ configured: true, error: "Could not read the contract right now." }, { status: 502 });
  }
}

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
  const chain = String(body.chain ?? "");
  const asset = String(body.asset ?? "").trim();
  const recipient = String(body.recipient ?? "").trim();
  const amountText = String(body.amount ?? "").trim();

  if (!(CHAINS as readonly string[]).includes(chain)) return NextResponse.json({ error: "Unknown chain." }, { status: 400 });
  if (!/^[A-Za-z0-9]{1,12}$/.test(asset)) return NextResponse.json({ error: "Asset must be a short symbol, such as NEAR or USDC." }, { status: 400 });
  if (recipient.length < 1 || recipient.length > 100 || /[\u0000-\u001f\u007f]/.test(recipient)) return NextResponse.json({ error: "That recipient is not valid." }, { status: 400 });

  if (configured) {
    // The live rule is NEAR-denominated, so amounts go to the contract in yoctoNEAR.
    // Zero is allowed on purpose: the contract should refuse it, and that is part of the demo.
    const yocto = parseNear(amountText);
    const amount = amountText === "0" ? BigInt(0) : yocto;
    if (amount === null || amount > BigInt("1000000000000000000000000000000")) return NextResponse.json({ error: "That amount is not valid." }, { status: 400 });
    try {
      const signer = KeyPairSigner.fromSecretKey(KEY as `ed25519:${string}`);
      const account = new Account(AGENT, new JsonRpcProvider({ url: CONFIG.rpc }), signer);
      const proposal = await account.callFunction<Proposal>({
        contractId: CONFIG.contractId,
        methodName: "propose_payment",
        args: { mandate_id: MANDATE, chain, asset, amount: amount.toString(), recipient },
        gas: BigInt("30000000000000"),
        deposit: BigInt(0),
      });
      return NextResponse.json({ proposal, simulated: false });
    } catch {
      return NextResponse.json({ error: "The contract did not answer. Try again." }, { status: 502 });
    }
  }

  // Not switched on: run the same checks locally and say so. No fake proposal is invented.
  const amount = amountText === "0" ? BigInt(0) : parseAttemptAmount(amountText, asset);
  if (amount === null) return NextResponse.json({ error: "That amount is not valid." }, { status: 400 });
  const v = evaluateMandatePolicy({ chain: chain as "Near" | "Base", asset, amount: amountText, recipient }, simulatedMandate(1), amount);
  return NextResponse.json({ proposal: null, simulated: true, verdict: v });
}
