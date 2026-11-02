import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPayment, effectiveLimits, remainingToday, spentToday } from "../policy.js";
import { BASE_OK, DAY_NS, NOW_NS, SOL_OK, mandate } from "./fixtures.js";

const pay = (amount: bigint, over: object = {}) => ({ chain: "Base" as const, asset: "USDC", amount, recipient: BASE_OK, ...over });
const rule = (v: ReturnType<typeof checkPayment>) => (v.outcome === "blocked" ? v.rule : v.outcome);

test("ready at or below the threshold", () => {
  assert.equal(checkPayment(mandate({ spent_today: "0" }), NOW_NS, pay(20_000_000n)).outcome, "ready");
});

test("review above the threshold, with the window applied", () => {
  const v = checkPayment(mandate({ spent_today: "0" }), NOW_NS, pay(21_000_000n));
  assert.equal(v.outcome, "review");
  if (v.outcome === "review") assert.equal(v.executableAtNs, NOW_NS + 600n * 1_000_000_000n);
});

test("the demo cases", () => {
  const m = mandate();
  assert.equal(rule(checkPayment(m, NOW_NS, pay(240_000_000n, { recipient: "0x9999999999999999999999999999999999999999" }))), "recipient");
  assert.equal(rule(checkPayment(m, NOW_NS, pay(900_000_000n))), "per_tx_cap");
  assert.equal(rule(checkPayment(m, NOW_NS, { chain: "Solana", asset: "USDC", amount: 240_000_000n, recipient: "NotOnTheList" })), "recipient");
  assert.equal(rule(checkPayment(m, NOW_NS, { chain: "Solana", asset: "USDC", amount: 1_000_000n, recipient: SOL_OK })), "ready");
});

test("each rule, in the contract's order", () => {
  assert.equal(rule(checkPayment(mandate({ state: "Revoked" }), NOW_NS, pay(1n))), "revoked");
  assert.equal(rule(checkPayment(mandate({ expires_at: String(NOW_NS) }), NOW_NS, pay(1n))), "expired");
  assert.equal(rule(checkPayment(mandate({ bond: "10", bond_posted: "9" }), NOW_NS, pay(1n))), "bond");
  assert.equal(rule(checkPayment(mandate({ chains: ["Solana"] }), NOW_NS, pay(1n))), "chain");
  assert.equal(rule(checkPayment(mandate(), NOW_NS, pay(1n, { asset: "DAI" }))), "asset");
  assert.equal(rule(checkPayment(mandate(), NOW_NS, pay(0n))), "zero_amount");
  assert.equal(rule(checkPayment(mandate({ spent_today: "40000000" }), NOW_NS, pay(11_000_000n))), "daily_cap");
  // revoked is reported before anything else, even for a bad recipient
  assert.equal(rule(checkPayment(mandate({ state: "Revoked" }), NOW_NS, pay(1n, { recipient: "x" }))), "revoked");
});

test("asset is case-insensitive, recipient is exact", () => {
  assert.equal(rule(checkPayment(mandate({ spent_today: "0" }), NOW_NS, pay(1n, { asset: "usdc" }))), "ready");
  assert.equal(rule(checkPayment(mandate(), NOW_NS, pay(1n, { recipient: BASE_OK.toUpperCase().replace("0X", "0x") }))), "ready"); // digits only, no letters to change
  const mixed = "0xAbCdEfabcdefABCDEFabcdefabcdefABCDEFabcd";
  const m = mandate({ allowlist: [{ chain: "Base", address: mixed }] });
  assert.equal(rule(checkPayment(m, NOW_NS, pay(1n, { recipient: mixed.toLowerCase() }))), "recipient");
  assert.equal(rule(checkPayment(m, NOW_NS, pay(1n, { recipient: mixed }))), "ready");
});

test("daily counter resets at 00:00 UTC", () => {
  const m = mandate({ spent_today: "49000000" });
  assert.equal(spentToday(m, NOW_NS), 49_000_000n);
  assert.equal(rule(checkPayment(m, NOW_NS, pay(5_000_000n))), "daily_cap");
  const tomorrow = (NOW_NS / DAY_NS + 1n) * DAY_NS;
  assert.equal(spentToday(m, tomorrow), 0n);
  assert.equal(rule(checkPayment(m, tomorrow, pay(5_000_000n))), "ready");
  assert.equal(remainingToday(m, NOW_NS), 1_000_000n);
});

test("queued limits only apply once due", () => {
  const pending = { per_tx_cap: "5000000", daily_cap: "50000000", cooling_threshold: "1000000", challenge_window_s: 60, effective_at: String(NOW_NS + 1000n) };
  const m = mandate({ pending_limits: pending, spent_today: "0" });
  assert.equal(effectiveLimits(m, NOW_NS).perTx, 25_000_000n);
  assert.equal(effectiveLimits(m, NOW_NS + 1000n).perTx, 5_000_000n);
  assert.equal(rule(checkPayment(m, NOW_NS + 1000n, pay(10_000_000n))), "per_tx_cap");
});
