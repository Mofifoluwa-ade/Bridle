import { KeyPair, KeyType, type KeyPairString } from "@near-js/crypto";
import { Signature, SignedTransaction, actionCreators, createTransaction, encodeTransaction } from "@near-js/transactions";
import { baseDecode } from "@near-js/utils";
import { CONFIG } from "./config";

/**
 * Claim links, built on NEAR's standard linkdrop contract (the root `testnet` account).
 *
 * The sender locks NEAR against a fresh public key with `send`. The matching secret key lives only
 * in the link. Whoever holds the link can claim the money into an existing account or into a brand
 * new one. Bridle's own contract is not involved.
 */
export const LINKDROP_ACCOUNT = "testnet";
/** The linkdrop contract keeps 1 NEAR of every deposit to pay for the claim. */
export const LINKDROP_FEE = BigInt("1000000000000000000000000");
const CLAIM_GAS = BigInt("100000000000000");

export type Drop = { secret: string; publicKey: string };

export function newDrop(): Drop {
  const kp = KeyPair.fromRandom("ed25519");
  return { secret: kp.toString(), publicKey: kp.getPublicKey().toString() };
}

export function publicKeyOf(secret: string): string | null {
  try {
    return KeyPair.fromString(secret as KeyPairString).getPublicKey().toString();
  } catch {
    return null;
  }
}

async function rpc<T = any>(method: string, params: unknown): Promise<T> {
  const res = await fetch(CONFIG.rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "bridle", method, params }),
  });
  if (!res.ok) throw new Error(`RPC returned ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(typeof body.error.data === "string" ? body.error.data : body.error.message ?? "RPC error");
  return body.result as T;
}

/** NEAR still locked against this key, or null if the key is unknown (already claimed, or not a real link). */
export async function keyBalance(publicKey: string): Promise<bigint | null> {
  try {
    const r = await rpc<{ result?: number[]; error?: string }>("query", {
      request_type: "call_function",
      finality: "optimistic",
      account_id: LINKDROP_ACCOUNT,
      method_name: "get_key_balance",
      args_base64: btoa(JSON.stringify({ key: publicKey })),
    });
    if (r.error || !r.result) return null;
    const v = JSON.parse(new TextDecoder().decode(new Uint8Array(r.result)));
    const n = BigInt(String(v));
    return n > BigInt(0) ? n : null;
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Sign a linkdrop call with the link's own key (it is an access key on the linkdrop account) and send it. */
async function claimCall(secret: string, method: string, args: Record<string, unknown>): Promise<string> {
  const kp = KeyPair.fromString(secret as KeyPairString);
  const pk = kp.getPublicKey();
  const ak = await rpc<{ nonce: number | string }>("query", {
    request_type: "view_access_key",
    finality: "optimistic",
    account_id: LINKDROP_ACCOUNT,
    public_key: pk.toString(),
  });
  const block = await rpc<{ header: { hash: string } }>("block", { finality: "final" });
  const tx = createTransaction(
    LINKDROP_ACCOUNT,
    pk,
    LINKDROP_ACCOUNT,
    BigInt(ak.nonce) + BigInt(1),
    [actionCreators.functionCall(method, args, CLAIM_GAS, BigInt(0))],
    baseDecode(block.header.hash),
  );
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encodeTransaction(tx) as BufferSource));
  const signed = new SignedTransaction({
    transaction: tx,
    signature: new Signature({ keyType: KeyType.ED25519, data: kp.sign(digest).signature }),
  });
  const out = await rpc<any>("send_tx", { signed_tx_base64: toBase64(encodeTransaction(signed)), wait_until: "EXECUTED_OPTIMISTIC" });
  const failed = (s: unknown) => !!s && typeof s === "object" && "Failure" in (s as object);
  if (failed(out.status) || (out.receipts_outcome ?? []).some((o: any) => failed(o.outcome?.status))) {
    throw new Error("The claim was rejected. The link may already have been used.");
  }
  return out.transaction.hash as string;
}

/** Claim into an account that already exists. */
export function claimToAccount(secret: string, accountId: string) {
  return claimCall(secret, "claim", { account_id: accountId });
}

/** Create a new account and claim into it. The new account gets its own, separate key. */
export async function claimToNewAccount(secret: string, newAccountId: string) {
  const fresh = KeyPair.fromRandom("ed25519");
  const hash = await claimCall(secret, "create_account_and_claim", {
    new_account_id: newAccountId,
    new_public_key: fresh.getPublicKey().toString(),
  });
  return { hash, recoveryKey: fresh.toString() };
}

/** A valid top-level name under the linkdrop account, such as `maya` for `maya.testnet`. */
export function validNewName(name: string): boolean {
  return /^[a-z0-9]([a-z0-9_-]{0,52}[a-z0-9])?$/.test(name) && name.length >= 2 && !/[-_]{2}/.test(name);
}

// Links the sender has made, kept in this browser so a lost tab does not mean lost money.
const STORE = "bridle.drops";
export type SavedDrop = { secret: string; publicKey: string; amount: string; memo: string; createdAt: number; from: string };

export function loadDrops(): SavedDrop[] {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "[]");
  } catch {
    return [];
  }
}
export function saveDrop(d: SavedDrop) {
  try {
    localStorage.setItem(STORE, JSON.stringify([d, ...loadDrops().filter((x) => x.publicKey !== d.publicKey)].slice(0, 50)));
  } catch {}
}

export function claimLink(origin: string, secret: string, memo: string): string {
  const q = memo ? `?m=${encodeURIComponent(memo)}` : "";
  return `${origin}/claim${q}#${secret}`;
}
