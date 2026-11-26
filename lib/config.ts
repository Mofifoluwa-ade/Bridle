export const CONFIG = {
  network: "testnet" as const,
  contractId: process.env.NEXT_PUBLIC_BRIDLE_CONTRACT ?? "",
  rpc: process.env.NEXT_PUBLIC_NEAR_RPC ?? "https://test.rpc.fastnear.com",
  baseRpc: process.env.NEXT_PUBLIC_BASE_RPC ?? "https://sepolia.base.org",
  baseUsdc: "0x036cbd53842c5426634e7929541ec2318f3dcf7e" as `0x${string}`,
  explorer: process.env.NEXT_PUBLIC_EXPLORER ?? "https://testnet.nearblocks.io",
  /** How often live views refresh, in ms. */
  pollMs: 8000,
};

/** Networks offered in the app. Solana is planned and not offered yet. */
export const CHAINS = ["Base", "Near"] as const;
export const ASSET = { symbol: "USDC", decimals: 6 } as const;

export const CHAIN_EXPLORER: Record<string, (hash: string) => string> = {
  Base: (h) => `https://sepolia.basescan.org/tx/${h}`,
  Solana: (h) => `https://explorer.solana.com/tx/${h}?cluster=devnet`,
};
