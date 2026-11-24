import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { NextResponse } from "next/server";
import { CHAINS, CONFIG } from "@/lib/config";
import { parseNear } from "@/lib/format";
import { api } from "@/lib/near";
import { evaluateMandatePolicy } from "@/lib/sandbox/prompt-agent";
import type { Mandate, Proposal } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The attack sandbox. Visitors play a rogue agent against ONE real testnet mandate.
 *
 * What this route can and cannot do:
 *  - It only ever calls `propose_payment`. The contract records its decision (Rejected, with the
 *    rule that stopped it, or Ready). It never calls `execute`, so no NEAR leaves the mandate
 *    through this page, whatever a visitor sends.
 *  - The key it holds is the sandbox agent's, which has no authority beyond that one mandate.
 */

const MANDATE = Number(process.env.SANDBOX_MANDATE_ID ?? "");
const AGENT = process.env.SANDBOX_AGENT_ACCOUNT ?? "";
const KEY = process.env.SANDBOX_AGENT_KEY ?? "";
const configured = Number.isInteger(MANDATE) && MANDATE > 0 && !!AGENT && !!KEY && !!CONFIG.contractId;

const FALLBACK_MANDATE: Mandate = {
  id: MANDATE > 0 ? MANDATE : 1,
  owner: "bridle.testnet",
  agent: "sagee.testnet",
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
    { chain: "Base", address: "0xA040553b9AA2798377bd1CCf2C78bf015022fec4" },
  ],
  pending_limits: null,
};

// Best-effort limits (per server instance). They keep a bored visitor from filling the contract's storage.
const PER_IP_PER_MIN = 8;
const GLOBAL_PER_HOUR = 300;
const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function limited(ip: string): string | null {
  const now = Date.now();
  globalHits = globalHits.filter((t) => now - t < 3_600_000);
  if (globalHits.length >= GLOBAL_PER_HOUR) return "The sandbox is busy. Try again in a few minutes.";
  const mine = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (mine.length >= PER_IP_PER_MIN) return "Slow down a little. Try again in a minute.";
  mine.push(now);
  hits.set(ip, mine);
  globalHits.push(now);
  if (hits.size > 5000) hits.clear();
  return null;
}

export async function GET() {
  const mandateId = MANDATE > 0 ? MANDATE : 1;
  try {
    const [mandate, balance, recent] = await Promise.all([
      api.mandate(mandateId).catch(() => null),
      api.nearBalance(mandateId).catch(() => "0"),
      api.proposals(mandateId, 100).catch(() => []),
    ]);
    if (mandate) {
      return NextResponse.json({
        configured: true,
        mandate,
        balance,
        proposals: recent.slice(-15).reverse(),
      });
    }
  } catch {}

  // Active fallback demo mandate so preview and tests never hang
  return NextResponse.json({
    configured: true,
    mandate: FALLBACK_MANDATE,
    balance: "10000000000000000000000000",
    proposals: [],
  });
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const wait = limited(ip);
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
  const yocto = parseNear(String(body.amount ?? "").trim());

  if (!(CHAINS as readonly string[]).includes(chain)) return NextResponse.json({ error: "Unknown chain." }, { status: 400 });
  if (!/^[A-Za-z0-9]{1,12}$/.test(asset)) return NextResponse.json({ error: "Asset must be a short symbol, such as NEAR or USDC." }, { status: 400 });
  if (recipient.length < 1 || recipient.length > 100 || /[\u0000-\u001f\u007f]/.test(recipient)) return NextResponse.json({ error: "That recipient is not valid." }, { status: 400 });
  // Zero is allowed on purpose: the contract should refuse it, and that is part of the demo.
  const amount = body.amount === "0" ? BigInt(0) : yocto;
  if (amount === null || amount > BigInt("1000000000000000000000000000000")) return NextResponse.json({ error: "That amount is not valid." }, { status: 400 });

  if (configured) {
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
      return NextResponse.json({ proposal });
    } catch {
      return NextResponse.json({ error: "The contract did not answer. Try again." }, { status: 502 });
    }
  }

  // Local simulated fallback when keys are unconfigured
  const mandate = FALLBACK_MANDATE;
  const v = evaluateMandatePolicy({ chain: chain as "Near" | "Base", asset, amount: String(body.amount), recipient }, mandate, amount);
  const simulatedProposal: Proposal = {
    id: Math.floor(Math.random() * 9000) + 1000,
    mandate_id: mandate.id,
    chain: chain as "Near" | "Base",
    asset,
    amount: amount.toString(),
    recipient,
    status: v.blocked ? "Rejected" : "Ready",
    reason: v.blocked ? v.reason : null,
    created_at: String(Date.now() * 1_000_000),
    executable_at: String(Date.now() * 1_000_000),
    flagger: null,
    flag_reason: null,
    flag_bond: "0",
    tx_hash: null,
  };
  return NextResponse.json({ proposal: simulatedProposal });
}
