import { CONFIG } from "./config";

export type BaseBalances = {
  eth: string;
  usdc: string;
  rawEth: bigint;
  rawUsdc: bigint;
};

/** Query Base Sepolia RPC for live ETH and USDC balances */
export async function fetchBaseBalances(address: `0x${string}`): Promise<BaseBalances> {
  const rpc = CONFIG.baseRpc;
  const cleanAddr = address.toLowerCase().replace(/^0x/, "");

  const getBalReq = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  };

  const data = "0x70a08231" + cleanAddr.padStart(64, "0");
  const callReq = {
    jsonrpc: "2.0",
    id: 2,
    method: "eth_call",
    params: [{ to: CONFIG.baseUsdc, data }, "latest"],
  };

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify([getBalReq, callReq]),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Base RPC returned ${res.status}`);
  const results = await res.json();
  const ethHex = results.find((r: { id: number; result?: string }) => r.id === 1)?.result ?? "0x0";
  const usdcHex = results.find((r: { id: number; result?: string }) => r.id === 2)?.result ?? "0x0";

  const rawEth = BigInt(ethHex);
  const rawUsdc = BigInt(usdcHex);

  const ethStr = (Number(rawEth) / 1e18).toFixed(4);
  const usdcStr = (Number(rawUsdc) / 1e6).toFixed(2);

  return {
    eth: ethStr,
    usdc: usdcStr,
    rawEth,
    rawUsdc,
  };
}

