import type { Mandate } from "../types";

/**
 * Stand-in rule for the break page when the live sandbox is not switched on. Anything decided
 * against it is a local simulation and must be labelled that way.
 */
export const simulatedMandate = (id: number): Mandate => ({
  id,
  owner: "bridle.testnet",
  agent: "agent.testnet",
  chains: ["Near"],
  assets: ["NEAR"],
  per_tx_cap: "10000000000000000000000000", // 10 NEAR
  daily_cap: "50000000000000000000000000", // 50 NEAR
  cooling_threshold: "5000000000000000000000000", // 5 NEAR
  challenge_window_s: 600,
  bond: "0",
  bond_posted: "0",
  expires_at: "1893456000000000000",
  state: "Active",
  day_index: 0,
  spent_today: "0",
  created_at: "1700000000000000000",
  allowlist: [{ chain: "Near", address: "vendor.testnet" }],
  pending_limits: null,
});

// Best-effort limits, per server instance, shared by every sandbox route. They keep a bored
// visitor from filling the contract's storage with proposals.
const PER_IP_PER_MIN = 8;
const GLOBAL_PER_HOUR = 300;
const hits = new Map<string, number[]>();
let globalHits: number[] = [];

/** Returns a message when this request must wait, otherwise records it and returns null. */
export function sandboxLimited(ip: string): string | null {
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
