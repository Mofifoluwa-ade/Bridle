export type Config = {
  contractId: string;
  network: "testnet" | "mainnet";
  nearRpc: string;
  baseRpc: string;
  executorAccount?: string;
  executorKey?: string;
  pollMs: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const contractId = env.BRIDLE_CONTRACT?.trim();
  if (!contractId) throw new Error("BRIDLE_CONTRACT is required (the Bridle contract account, e.g. bridle.testnet)");
  const network = env.NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
  return {
    contractId,
    network,
    nearRpc: env.NEAR_RPC?.trim() || "https://test.rpc.fastnear.com",
    baseRpc: env.BASE_RPC?.trim() || "https://sepolia.base.org",
    executorAccount: env.EXECUTOR_ACCOUNT?.trim() || undefined,
    executorKey: env.EXECUTOR_KEY?.trim() || undefined,
    pollMs: Number(env.POLL_MS ?? 15000),
  };
}
