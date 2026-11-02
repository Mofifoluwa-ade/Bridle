export type Config = {
  contractId: string;
  rpc: string;
  explorer: string;
  agentAccount: string | null;
  agentKey: string | null;
};

/** Read settings from the environment. Only the contract is required; the key enables propose_payment. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const contractId = (env.BRIDLE_CONTRACT ?? "").trim();
  if (!contractId) {
    throw new Error("BRIDLE_CONTRACT is not set. Set it to the NEAR account the Bridle contract is deployed to.");
  }
  return {
    contractId,
    rpc: (env.BRIDLE_RPC ?? "https://test.rpc.fastnear.com").trim(),
    explorer: (env.BRIDLE_EXPLORER ?? "https://testnet.nearblocks.io").trim(),
    agentAccount: (env.BRIDLE_AGENT_ACCOUNT ?? "").trim() || null,
    agentKey: (env.BRIDLE_AGENT_KEY ?? "").trim() || null,
  };
}
