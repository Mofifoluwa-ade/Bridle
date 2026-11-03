// Vectors produced by the official chainsig.js library (cryptography.deriveChildPublicKey plus
// keccak of the key) with the testnet MPC root key. Our implementation must agree exactly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { derivationPath, deriveChildPublicKey, mandateAddress, ROOT_PUBLIC_KEY } from "../derive.js";

const VECTORS = [
  { pred: "bridle.testnet", path: "bridle-1", pk: "04928a3634fdadf62b390a6ff391ccf263a7f942ca5fd3913dc0224cd4a5fc99ca0bd9346104cb138d540bcd606e885d2303517ab88da96f8198b36c1bd9fc28ff", addr: "0x5AA13fc0fdF8b5a8D9FE079bC0943d8596bF34aF" },
  { pred: "bridle.testnet", path: "bridle-2", pk: "04a11efe36b5a776a33960bbfb2a758fc067bf04f8a7313a2ec4131ea9b8af90620eda413ba9180c16410017cfea34c4f06f84c9f0975f2a0733ac38ef1b42a7ee", addr: "0x2832B357267F8AC932fc07C33a3BB9F4edbca0d5" },
  { pred: "bridle.testnet", path: "bridle-4242", pk: "04d048a473a8dab8b02453edfea0f837ffab76c04217192abe21cffc4347e217bf03602f2ba2b83641af6b1eef3d6497d8a94cd7fb8ea94cc0c27dac4253e2c4d0", addr: "0xA79138118b2206E63e37f58F9aadBbD35feCc228" },
  { pred: "other.testnet", path: "bridle-1", pk: "0449b5b84db42c2f54f7ff3aa3f05a3d77308b92eaa39a2ed5faf6ff8d879e5b8aae43f791c7527e265de6fbd624ea2ad205e569323793a9572858d41c985112c6", addr: "0x23F95d77fd483510158d49ea9c508b18B66E175d" },
];

test("derived keys and addresses match chainsig.js", () => {
  for (const v of VECTORS) {
    assert.equal(deriveChildPublicKey(ROOT_PUBLIC_KEY.testnet, v.pred, v.path), v.pk);
  }
  assert.equal(mandateAddress("testnet", "bridle.testnet", 1), VECTORS[0].addr);
  assert.equal(mandateAddress("testnet", "bridle.testnet", 2), VECTORS[1].addr);
  assert.equal(mandateAddress("testnet", "bridle.testnet", "4242"), VECTORS[2].addr);
});

test("each mandate and each contract gets its own address", () => {
  const set = new Set(VECTORS.map((v) => v.addr));
  assert.equal(set.size, VECTORS.length);
});

test("path matches the contract's get_derivation_path", () => {
  assert.equal(derivationPath(7), "bridle-7");
});
