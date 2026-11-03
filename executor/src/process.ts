// One pass over one proposal. All I/O is injected so the logic can be tested without a network.
import { assemble } from "./signature.js";
import type { Proposal, SigningRecord } from "./types.js";

export type Fees = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; gasLimit: bigint };

export type Deps = {
  mandateAddress(mandateId: number): `0x${string}`;
  getSigning(proposalId: number): Promise<SigningRecord | null>;
  nextNonce(address: `0x${string}`): Promise<number>;
  fees(): Promise<Fees>;
  requestSignature(proposalId: number, nonce: number, fees: Fees): Promise<void>;
  broadcast(raw: `0x${string}`): Promise<void>;
  /** "success" | "reverted" | "pending" after waiting a bounded time. */
  receipt(hash: `0x${string}`): Promise<"success" | "reverted" | "pending">;
  reportExecution(proposalId: number, hash: string): Promise<void>;
  reportFailure(proposalId: number, reason: string): Promise<void>;
  log(msg: string): void;
};

export type Outcome = "skipped" | "requested" | "waiting" | "reported" | "failed" | "error";

export async function processProposal(p: Proposal, d: Deps): Promise<Outcome> {
  if (p.status !== "Signing") return "skipped";
  if (p.chain !== "Base") {
    d.log(`#${p.id}: ${p.chain} signing is not built; leaving it to time out`);
    return "skipped";
  }
  const from = d.mandateAddress(p.mandate_id);
  let rec = await d.getSigning(p.id);

  if (!rec) {
    const [nonce, fees] = await Promise.all([d.nextNonce(from), d.fees()]);
    d.log(`#${p.id}: requesting signature (nonce ${nonce}) for ${from}`);
    await d.requestSignature(p.id, nonce, fees);
    rec = await d.getSigning(p.id);
    if (!rec) {
      d.log(`#${p.id}: the signer did not answer; will retry`);
      return "requested";
    }
  }
  if (rec.state !== "Signed" || rec.r == null || rec.s == null || rec.recovery_id == null) {
    d.log(`#${p.id}: signature still pending`);
    return "waiting";
  }

  let tx;
  try {
    tx = await assemble(rec.unsigned_tx, { r: rec.r, s: rec.s, recovery_id: rec.recovery_id }, from);
  } catch (e) {
    d.log(`#${p.id}: ${(e as Error).message}`);
    return "error"; // never broadcast, never report success; the proposal times out normally
  }
  await d.broadcast(tx.raw);
  d.log(`#${p.id}: broadcast ${tx.hash}`);
  const status = await d.receipt(tx.hash);
  if (status === "success") {
    await d.reportExecution(p.id, tx.hash);
    return "reported";
  }
  if (status === "reverted") {
    await d.reportFailure(p.id, `Base transaction reverted: ${tx.hash}`);
    return "failed";
  }
  d.log(`#${p.id}: no receipt yet; will check again`);
  return "waiting";
}
