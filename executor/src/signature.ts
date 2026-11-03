// Turn the MPC signature into a broadcastable transaction, and refuse anything that was not
// signed by the key we expect. A transaction is only sent if it recovers to the mandate's own
// derived address.
import { keccak256, parseTransaction, recoverTransactionAddress, serializeTransaction } from "viem";

const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

export type MpcSignature = { r: string; s: string; recovery_id: number };

export type Assembled = { raw: `0x${string}`; hash: `0x${string}`; signer: `0x${string}` };

export async function assemble(
  unsignedTxHex: string,
  sig: MpcSignature,
  expectedSigner: `0x${string}`,
): Promise<Assembled> {
  const unsigned = parseTransaction(`0x${unsignedTxHex}` as `0x${string}`);
  let s = BigInt("0x" + sig.s);
  let parity = sig.recovery_id;
  // EIP-2: nodes reject a high s. Flipping s also flips the recovery parity.
  if (s > N / 2n) {
    s = N - s;
    parity = parity ^ 1;
  }
  const raw = serializeTransaction(unsigned, {
    r: `0x${sig.r.padStart(64, "0")}`,
    s: `0x${s.toString(16).padStart(64, "0")}`,
    yParity: parity,
  });
  const signer = await recoverTransactionAddress({ serializedTransaction: raw as any });
  if (signer.toLowerCase() !== expectedSigner.toLowerCase()) {
    throw new Error(`signature recovers to ${signer}, expected ${expectedSigner}; not broadcasting`);
  }
  return { raw, hash: keccak256(raw), signer };
}
