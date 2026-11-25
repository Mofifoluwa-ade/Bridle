import assert from "node:assert/strict";
import { derivationPath, mandateAddress, toChecksumAddress } from "../lib/derive.ts";

// Known vector from the README: mandate 2 on bridle.testnet sent USDC on Base Sepolia from this address.
assert.equal(mandateAddress("testnet", "bridle.testnet", 2), "0x2832B357267F8AC932fc07C33a3BB9F4edbca0d5");
assert.equal(derivationPath(7), "bridle-7");
assert.notEqual(mandateAddress("testnet", "bridle.testnet", 1), mandateAddress("testnet", "bridle.testnet", 2));
assert.notEqual(mandateAddress("testnet", "a.testnet", 2), mandateAddress("testnet", "b.testnet", 2));
// EIP-55 reference vector
assert.equal(toChecksumAddress("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"), "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
console.log("derive tests passed");
