import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import type { Config } from "./config.js";

export async function view<T>(cfg: Config, method: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(cfg.nearRpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "bridle-executor",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: cfg.contractId,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
  });
  if (!res.ok) throw new Error(`NEAR RPC returned ${res.status}`);
  const body: any = await res.json();
  if (body.error) throw new Error(typeof body.error.data === "string" ? body.error.data : JSON.stringify(body.error));
  if (body.result?.error) throw new Error(String(body.result.error));
  return JSON.parse(Buffer.from(body.result.result).toString("utf8")) as T;
}

export function executorAccount(cfg: Config): Account {
  if (!cfg.executorAccount || !cfg.executorKey) throw new Error("EXECUTOR_ACCOUNT and EXECUTOR_KEY are required to send transactions");
  const signer = KeyPairSigner.fromSecretKey(cfg.executorKey as `ed25519:${string}`);
  return new Account(cfg.executorAccount, new JsonRpcProvider({ url: cfg.nearRpc }), signer);
}

export async function call(cfg: Config, method: string, args: Record<string, unknown>, gas = 30_000_000_000_000n) {
  return executorAccount(cfg).callFunction({ contractId: cfg.contractId, methodName: method, args, gas, deposit: 0n });
}
