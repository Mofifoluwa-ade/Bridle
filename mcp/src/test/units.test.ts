import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUsdc, parseUsdc } from "../units.js";

test("parseUsdc", () => {
  assert.equal(parseUsdc("18.5"), 18_500_000n);
  assert.equal(parseUsdc("0.000001"), 1n);
  assert.equal(parseUsdc("25"), 25_000_000n);
  assert.equal(parseUsdc("0.0000001"), null);
  assert.equal(parseUsdc("-1"), null);
  assert.equal(parseUsdc("1e3"), null);
  assert.equal(parseUsdc("$5"), null);
  assert.equal(parseUsdc(""), null);
});

test("formatUsdc", () => {
  assert.equal(formatUsdc(18_500_000n), "18.50");
  assert.equal(formatUsdc("240000000"), "240.00");
  assert.equal(formatUsdc(1n), "0.000001");
  assert.equal(formatUsdc(0n), "0.00");
});
