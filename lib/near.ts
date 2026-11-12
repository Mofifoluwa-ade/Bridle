import { CONFIG } from "./config";
import type { Mandate, Proposal } from "./types";

/** Read-only call over JSON-RPC. No wallet needed. */
export async function view<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!CONFIG.contractId) throw new Error("NEXT_PUBLIC_BRIDLE_CONTRACT is not set");
  const res = await fetch(CONFIG.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "bridle",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: CONFIG.contractId,
        method_name: method,
        args_base64: btoa(JSON.stringify(args)),
      },
    }),
  });
  if (!res.ok) throw new Error(`RPC returned ${res.status}`);
  const body = await res.json();
  if (body.error) {
    const msg = body.error.data ?? body.error.message ?? "RPC error";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  const result = body.result;
  if (result?.error) throw new Error(String(result.error));
  const text = new TextDecoder().decode(new Uint8Array(result.result));
  return JSON.parse(text) as T;
}

export const api = {
  mandatesFor: (account: string) =>
    view<Mandate[]>("list_mandates_for", { account_id: account, from: 0, limit: 100 }),
  mandate: (id: number) => view<Mandate | null>("get_mandate", { mandate_id: id }),
  proposal: (id: number) => view<Proposal | null>("get_proposal", { proposal_id: id }),
  proposals: (mandateId: number | null, limit = 50) =>
    view<Proposal[]>("list_proposals", { mandate_id: mandateId, from: 0, limit }),
  counts: async () => ({ mandates: await view<number>("count_mandates"), proposals: await view<number>("count_proposals") }),
  nearBalance: (id: number) => view<string>("get_near_balance", { mandate_id: id }),
  config: () => view<{ executor: string; flag_bond_divisor: number }>("get_config"),
};

/** Turn a wallet or RPC failure into one plain sentence. */
export function explainError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.match(/Smart contract panicked: ([^"\\]+)/);
  if (m) return m[1].trim();
  if (/User rejected|rejected the request|closed the window/i.test(raw)) return "You cancelled the request in your wallet.";
  if (/does not exist while viewing|CodeDoesNotExist|no contract code/i.test(raw))
    return "No contract is deployed at that account. Check NEXT_PUBLIC_BRIDLE_CONTRACT.";
  return raw.length > 220 ? raw.slice(0, 220) + "…" : raw;
}

/**
 * Whether a NEAR account exists. Returns null when the network cannot tell us, so a flaky
 * connection never blocks a payment by itself.
 */
export async function accountExists(accountId: string): Promise<boolean | null> {
  try {
    const res = await fetch(CONFIG.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "bridle",
        method: "query",
        params: { request_type: "view_account", finality: "optimistic", account_id: accountId },
      }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body.result && !body.result.error) return true;
    const text = JSON.stringify(body.error ?? body.result ?? "");
    if (/UnknownAccount|does not exist|doesn't exist/i.test(text)) return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * Did this transaction succeed? Reads its outcome over RPC. "unknown" means the network could not
 * tell us (not found yet, or RPC trouble), so callers should not claim success or failure.
 */
export async function txOutcome(hash: string, signer: string): Promise<"ok" | "failed" | "unknown"> {
  try {
    const res = await fetch(CONFIG.rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "bridle", method: "tx", params: { tx_hash: hash, sender_account_id: signer, wait_until: "EXECUTED_OPTIMISTIC" } }),
    });
    if (!res.ok) return "unknown";
    const body = await res.json();
    if (body.error || !body.result) return "unknown";
    const r = body.result;
    const failed = (s: unknown) => !!s && typeof s === "object" && "Failure" in (s as object);
    if (failed(r.status) || (r.receipts_outcome ?? []).some((o: { outcome?: { status?: unknown } }) => failed(o.outcome?.status))) return "failed";
    return r.status && "SuccessValue" in r.status ? "ok" : "unknown";
  } catch {
    return "unknown";
  }
}
