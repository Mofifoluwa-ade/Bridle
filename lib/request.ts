import { parseNear, validNearAccount } from "./format";

/** A payment request carried in a link. Nothing here is trusted: the payer sees it and decides. */
export type PayRequest = { to: string; amount: string; memo: string };

const MEMO_MAX = 140;

/** Strip control characters and cap the length, so a link cannot smuggle odd text into the page. */
export function cleanMemo(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MEMO_MAX);
}

export function buildRequestLink(origin: string, r: PayRequest): string {
  const q = new URLSearchParams({ to: r.to, amount: r.amount });
  const memo = cleanMemo(r.memo);
  if (memo) q.set("memo", memo);
  return `${origin}/app/pay?${q.toString()}`;
}

export type ParsedRequest =
  | { ok: true; to: string; amount: string; yocto: bigint; memo: string }
  | { ok: false; error: string };

/** Read and validate a request from URL parameters. */
export function parseRequest(get: (k: string) => string | null): ParsedRequest {
  const to = (get("to") ?? "").trim();
  const amount = (get("amount") ?? "").trim();
  if (!to || !amount) return { ok: false, error: "This link is missing the recipient or the amount." };
  if (!validNearAccount(to)) return { ok: false, error: "The recipient in this link is not a valid NEAR account." };
  const yocto = parseNear(amount);
  if (yocto === null || yocto <= BigInt(0)) return { ok: false, error: "The amount in this link is not valid." };
  return { ok: true, to, amount, yocto, memo: cleanMemo(get("memo") ?? "") };
}
