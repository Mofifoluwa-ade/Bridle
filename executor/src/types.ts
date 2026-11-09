export type SigningRecord = {
  state: "Requested" | "Signed";
  nonce: number;
  unsigned_tx: string;
  r: string | null;
  s: string | null;
  recovery_id: number | null;
};

export type Proposal = {
  id: number;
  mandate_id: number;
  chain: "Base" | "Solana" | "Near";
  asset: string;
  amount: string;
  recipient: string;
  status: string;
};
