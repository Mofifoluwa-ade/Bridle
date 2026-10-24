export type Chain = "Base" | "Solana";
export type MandateState = "Active" | "Revoked";
export type ProposalStatus =
  | "Rejected"
  | "Waiting"
  | "Ready"
  | "Flagged"
  | "Cancelled"
  | "Vetoed"
  | "Expired"
  | "Signing"
  | "Executed";

export type Recipient = { chain: Chain; address: string };

export type PendingLimits = {
  per_tx_cap: string;
  daily_cap: string;
  cooling_threshold: string;
  challenge_window_s: number;
  effective_at: string; // ns
};

export type Mandate = {
  id: number;
  owner: string;
  agent: string;
  chains: Chain[];
  assets: string[];
  allowlist: Recipient[];
  per_tx_cap: string; // smallest units
  daily_cap: string;
  cooling_threshold: string;
  challenge_window_s: number;
  bond: string; // yoctoNEAR
  bond_posted: string;
  expires_at: string; // ns
  state: MandateState;
  day_index: number;
  spent_today: string;
  created_at: string;
  pending_limits: PendingLimits | null;
};

export type Proposal = {
  id: number;
  mandate_id: number;
  chain: Chain;
  asset: string;
  amount: string;
  recipient: string;
  status: ProposalStatus;
  reason: string | null;
  created_at: string;
  executable_at: string;
  flagger: string | null;
  flag_reason: string | null;
  flag_bond: string;
  tx_hash: string | null;
};
