import type { Config } from "./config.js";

async function rpcCall(cfg: Config, method: string, params: unknown): Promise<any> {
  const res = await fetch(cfg.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bridle-mcp", method, params }),
  });
  if (!res.ok) throw new Error(`NEAR RPC returned ${res.status}`);
  const body: any = await res.json();
  if (body.error) {
    const msg = body.error.data ?? body.error.message ?? "RPC error";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return body.result;
}

/** Read-only contract call. Needs no key. */
export async function view<T>(cfg: Config, method: string, args: Record<string, unknown> = {}): Promise<T> {
  const result = await rpcCall(cfg, "query", {
    request_type: "call_function",
    finality: "optimistic",
    account_id: cfg.contractId,
    method_name: method,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
  });
  if (result?.error) throw new Error(String(result.error));
  return JSON.parse(Buffer.from(result.result).toString("utf8")) as T;
}

/** The chain's own clock in nanoseconds, so day rollover and expiry match the contract. */
export async function chainTimeNs(cfg: Config): Promise<bigint> {
  const block = await rpcCall(cfg, "block", { finality: "optimistic" });
  return BigInt(block.header.timestamp_nanosec ?? block.header.timestamp);
}
