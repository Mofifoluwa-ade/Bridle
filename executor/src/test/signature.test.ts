import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, parseAbi, parseTransaction } from "viem";
import { assemble } from "../signature.js";
import { fakeMpc, unsignedTransfer, USDC } from "./helpers.js";

const TO = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" as const;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

test("a valid MPC signature becomes a transaction from the derived address", async () => {
  const mpc = await fakeMpc();
  const unsigned = unsignedTransfer(TO, 18_500_000n).slice(2);
  const sig = await mpc.sign(unsigned);
  const out = await assemble(unsigned, sig, mpc.address);
  assert.equal(out.signer, mpc.address);
  const tx = parseTransaction(out.raw);
  assert.equal(tx.to?.toLowerCase(), USDC);
  assert.ok(tx.value === undefined || tx.value === 0n, "no native ETH moves");
  const call = decodeFunctionData({ abi: parseAbi(["function transfer(address to, uint256 amount)"]), data: tx.data! });
  assert.equal((call.args![0] as string).toLowerCase(), TO);
  assert.equal(call.args![1], 18_500_000n);
  assert.match(out.hash, /^0x[0-9a-f]{64}$/);
});

test("a high-s signature is normalised and still recovers to the same address", async () => {
  const mpc = await fakeMpc();
  const unsigned = unsignedTransfer(TO, 1_000_000n, 3).slice(2);
  const sig = await mpc.sign(unsigned);
  const s = BigInt("0x" + sig.s);
  // present the equivalent high-s form: (r, N-s) with the opposite parity
  const high = { r: sig.r, s: (N - s).toString(16).padStart(64, "0"), recovery_id: sig.recovery_id ^ 1 };
  const out = await assemble(unsigned, high, mpc.address);
  assert.equal(out.signer, mpc.address);
});

test("a signature from the wrong key is refused", async () => {
  const mpc = await fakeMpc();
  const other = await fakeMpc();
  const unsigned = unsignedTransfer(TO, 1_000_000n).slice(2);
  await assert.rejects(assemble(unsigned, await other.sign(unsigned), mpc.address), /not broadcasting/);
});

test("a transaction altered after signing is refused", async () => {
  const mpc = await fakeMpc();
  const signed = unsignedTransfer(TO, 1_000_000n).slice(2);
  const sig = await mpc.sign(signed);
  const tampered = unsignedTransfer(TO, 9_000_000n).slice(2); // different amount, same signature
  await assert.rejects(assemble(tampered, sig, mpc.address), /not broadcasting/);
});
