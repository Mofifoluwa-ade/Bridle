// A read-only mirror of the checks in contract/src/lib.rs `propose_payment`, in the same order.
// It exists so an agent can ask "would this be allowed?" without creating an on-chain record.
// The contract is the only authority: if this and the contract ever disagree, the contract wins.
import type { Chain, Mandate } from "./types.js";

const DAY_NS = 86_400n * 1_000_000_000n;
const SEC_NS = 1_000_000_000n;

export type Rule =
  | "revoked" | "expired" | "bond" | "chain" | "asset" | "recipient"
  | "zero_amount" | "per_tx_cap" | "daily_cap";

export type Verdict =
  | { outcome: "blocked"; rule: Rule; reason: string }
  | { outcome: "review"; reason: string; executableAtNs: bigint }
  | { outcome: "ready"; reason: string };

/** NEAR account ids: 2-64 chars of a-z 0-9 - _ . with no leading, trailing or doubled separators. */
export function isNearAccount(id: string): boolean {
  return id.length >= 2 && id.length <= 64 && /^([a-z\d]+[-_])*[a-z\d]+(\.([a-z\d]+[-_])*[a-z\d]+)*$/.test(id);
}

export type PaymentInput = { chain: Chain; asset: string; amount: bigint; recipient: string };

/** The limits that apply at `now`: pending limits take over once their time has passed. */
export function effectiveLimits(m: Mandate, nowNs: bigint) {
  const p = m.pending_limits;
  if (p && nowNs >= BigInt(p.effective_at)) {
    return {
      perTx: BigInt(p.per_tx_cap), daily: BigInt(p.daily_cap),
      threshold: BigInt(p.cooling_threshold), windowS: BigInt(p.challenge_window_s),
    };
  }
  return {
    perTx: BigInt(m.per_tx_cap), daily: BigInt(m.daily_cap),
    threshold: BigInt(m.cooling_threshold), windowS: BigInt(m.challenge_window_s),
  };
}

/** Spend counted against today's cap. The counter resets at 00:00 UTC. */
export function spentToday(m: Mandate, nowNs: bigint): bigint {
  return nowNs / DAY_NS === BigInt(m.day_index) ? BigInt(m.spent_today) : 0n;
}

export function remainingToday(m: Mandate, nowNs: bigint): bigint {
  const { daily } = effectiveLimits(m, nowNs);
  const left = daily - spentToday(m, nowNs);
  return left > 0n ? left : 0n;
}

export function checkPayment(m: Mandate, nowNs: bigint, input: PaymentInput): Verdict {
  const { perTx, daily, threshold, windowS } = effectiveLimits(m, nowNs);
  const asset = input.asset.toUpperCase();
  const blocked = (rule: Rule, reason: string): Verdict => ({ outcome: "blocked", rule, reason });

  if (m.state === "Revoked") return blocked("revoked", "The mandate is revoked");
  if (nowNs >= BigInt(m.expires_at)) return blocked("expired", "The mandate has expired");
  if (BigInt(m.bond_posted) < BigInt(m.bond)) return blocked("bond", "The agent bond is not fully posted");
  if (!m.chains.includes(input.chain)) return blocked("chain", "Chain is not allowed by the mandate");
  if (!m.assets.includes(asset)) return blocked("asset", "Asset is not allowed by the mandate");
  if (input.chain === "Near" && asset !== "NEAR") return blocked("asset", "Native NEAR payments use the NEAR asset");
  if (input.chain === "Near" && !isNearAccount(input.recipient)) return blocked("recipient", "Recipient is not a valid NEAR account");
  if (!m.allowlist.some((r) => r.chain === input.chain && r.address === input.recipient))
    return blocked("recipient", "Recipient is not on the allowlist");
  if (input.amount === 0n) return blocked("zero_amount", "Amount must be above zero");
  if (input.amount > perTx) return blocked("per_tx_cap", "Over the per-payment cap");
  if (spentToday(m, nowNs) + input.amount > daily) return blocked("daily_cap", "Over the daily cap");

  if (input.amount > threshold) {
    return {
      outcome: "review",
      reason: "Above the review threshold: it waits out the challenge window, and the owner can veto",
      executableAtNs: nowNs + windowS * SEC_NS,
    };
  }
  return { outcome: "ready", reason: "Within every limit" };
}
