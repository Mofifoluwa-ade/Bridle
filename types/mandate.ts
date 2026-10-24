export type ChainType = "Base" | "Solana";

export type RecipientItem = {
  id: string;
  chain: ChainType;
  address: string;
  label: string;
};

export type MandateState = "Active" | "Revoked";

export type Mandate = {
  owner: string;
  agent: string;
  chains: ChainType[];
  assets: string[];
  recipients: RecipientItem[];
  per_tx_cap: number; // e.g. 25 ($25 USDC)
  daily_cap: number; // e.g. 50 ($50 USDC)
  daily_spent: number; // e.g. 18 ($18 USDC)
  cooling_threshold: number; // e.g. 20 ($20 USDC)
  challenge_window: number; // in seconds, e.g. 600 (10 minutes)
  bond: number; // in NEAR, e.g. 1
  expiry: string; // ISO date or days
  state: MandateState;
};

export type ProposalState =
  | "Approved"
  | "Blocked"
  | "Waiting"
  | "Flagged"
  | "Slashed"
  | "Executed"
  | "Cancelled";

export type Proposal = {
  id: string;
  createdAt: string;
  chain: ChainType;
  asset: "USDC";
  amount: number; // In dollars (e.g. 18.00)
  amountRaw: string; // In smallest unit (e.g. "18000000" for 6 decimals)
  recipient: string;
  recipientLabel?: string;
  state: ProposalState;
  ruleCited?: string;
  txHash?: string;
  explorerUrl?: string;
  agentBondLocked?: number; // in NEAR
  watcherBondLocked?: number; // in NEAR
  watcherAddress?: string;
  coolingExpiresAt?: string;
  calldataPreview?: {
    to: string;
    method: string;
    derivedSigner: string;
    payloadHex: string;
  };
};

export type ValidationCheck = {
  valid: boolean;
  requiresCooling: boolean;
  status: "Approved" | "Blocked" | "Waiting";
  ruleCited: string;
};

export type SlashBreakdown = {
  total: number;
  watcherShare: number; // 40%
  ownerShare: number; // 30%
  burnShare: number; // 30%
};
