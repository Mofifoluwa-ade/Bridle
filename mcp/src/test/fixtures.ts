import type { Mandate, Proposal } from "../types.js";

export const NOW_S = 1_800_000_000;
export const NOW_NS = BigInt(NOW_S) * 1_000_000_000n;
export const DAY_NS = 86_400n * 1_000_000_000n;
export const BASE_OK = "0x1111111111111111111111111111111111111111";
export const SOL_OK = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export function mandate(over: Partial<Mandate> = {}): Mandate {
  return {
    id: 1,
    owner: "owner.testnet",
    agent: "agent.testnet",
    chains: ["Base", "Solana"],
    assets: ["USDC"],
    allowlist: [{ chain: "Base", address: BASE_OK }, { chain: "Solana", address: SOL_OK }],
    per_tx_cap: "25000000",
    daily_cap: "50000000",
    cooling_threshold: "20000000",
    challenge_window_s: 600,
    bond: "0",
    bond_posted: "0",
    expires_at: String(NOW_NS + 7n * DAY_NS),
    state: "Active",
    day_index: Number(NOW_NS / DAY_NS),
    spent_today: "18000000",
    created_at: String(NOW_NS - DAY_NS),
    pending_limits: null,
    ...over,
  };
}

export function proposal(over: Partial<Proposal> = {}): Proposal {
  return {
    id: 7, mandate_id: 1, chain: "Base", asset: "USDC", amount: "18000000", recipient: BASE_OK,
    status: "Ready", reason: null, created_at: String(NOW_NS), executable_at: String(NOW_NS),
    flagger: null, flag_reason: null, flag_bond: "0", tx_hash: null, ...over,
  };
}
