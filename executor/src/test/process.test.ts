import { test } from "node:test";
import assert from "node:assert/strict";
import { processProposal, type Deps } from "../process.js";
import type { Proposal, SigningRecord } from "../types.js";
import { fakeMpc, unsignedTransfer } from "./helpers.js";

const TO = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" as const;
const prop = (over: Partial<Proposal> = {}): Proposal => ({
  id: 4, mandate_id: 1, chain: "Base", asset: "USDC", amount: "18500000", recipient: TO, status: "Signing", ...over,
});

async function rig(opts: { existing?: SigningRecord | null; receipt?: "success" | "reverted" | "pending"; signWith?: "right" | "wrong" | "none" } = {}) {
  const mpc = await fakeMpc();
  const wrong = await fakeMpc();
  const calls: string[] = [];
  let record: SigningRecord | null = opts.existing ?? null;
  const unsigned = unsignedTransfer(TO, 18_500_000n, 9).slice(2);
  const deps: Deps = {
    log: () => {},
    mandateAddress: () => mpc.address,
    getSigning: async () => record,
    nextNonce: async () => { calls.push("nonce"); return 9; },
    fees: async () => ({ maxFeePerGas: 2_000_000n, maxPriorityFeePerGas: 1_000_000n, gasLimit: 100_000n }),
    async requestSignature(id, nonce) {
      calls.push(`request:${id}:${nonce}`);
      if (opts.signWith === "none") return;
      const sig = await (opts.signWith === "wrong" ? wrong : mpc).sign(unsigned);
      record = { state: "Signed", nonce, unsigned_tx: unsigned, ...sig };
    },
    broadcast: async () => { calls.push("broadcast"); },
    receipt: async () => opts.receipt ?? "success",
    reportExecution: async (id, h) => { calls.push(`report:${id}:${h.slice(0, 4)}`); },
    reportFailure: async (id, r) => { calls.push(`fail:${id}:${r.slice(0, 20)}`); },
  };
  return { deps, calls, mpc, unsigned, setRecord: (r: SigningRecord) => (record = r) };
}

test("happy path: request, assemble, broadcast, receipt, report", async () => {
  const { deps, calls } = await rig();
  assert.equal(await processProposal(prop(), deps), "reported");
  assert.deepEqual(calls.filter((c) => !c.startsWith("report")), ["nonce", "request:4:9", "broadcast"]);
  assert.match(calls[calls.length - 1], /^report:4:0x/);
});

test("a reverted transaction is reported as a failure, never as success", async () => {
  const { deps, calls } = await rig({ receipt: "reverted" });
  assert.equal(await processProposal(prop(), deps), "failed");
  assert.ok(calls.some((c) => c.startsWith("fail:4")));
  assert.ok(!calls.some((c) => c.startsWith("report:")));
});

test("no receipt yet: waits, reports nothing", async () => {
  const { deps, calls } = await rig({ receipt: "pending" });
  assert.equal(await processProposal(prop(), deps), "waiting");
  assert.ok(!calls.some((c) => c.startsWith("report:") || c.startsWith("fail:")));
});

test("a signature from the wrong key is never broadcast or reported", async () => {
  const { deps, calls } = await rig({ signWith: "wrong" });
  assert.equal(await processProposal(prop(), deps), "error");
  assert.ok(!calls.includes("broadcast"));
  assert.ok(!calls.some((c) => c.startsWith("report:")));
});

test("restart safety: an existing signature is reused, not requested again", async () => {
  const r = await rig();
  r.setRecord({ state: "Signed", nonce: 9, unsigned_tx: r.unsigned, ...(await r.mpc.sign(r.unsigned)) });
  assert.equal(await processProposal(prop(), r.deps), "reported");
  assert.ok(!r.calls.some((c) => c.startsWith("request:")), "must not ask for a second signature");
  assert.ok(!r.calls.includes("nonce"), "no new nonce is chosen either");
});

test("a pending request is waited on, not duplicated", async () => {
  const { deps, calls } = await rig({ existing: { state: "Requested", nonce: 9, unsigned_tx: "02", r: null, s: null, recovery_id: null } });
  assert.equal(await processProposal(prop(), deps), "waiting");
  assert.ok(!calls.some((c) => c.startsWith("request:")));
});

test("if the signer never answers, nothing is broadcast", async () => {
  const { deps, calls } = await rig({ signWith: "none" });
  assert.equal(await processProposal(prop(), deps), "requested");
  assert.ok(!calls.includes("broadcast"));
});

test("Solana and non-signing proposals are left alone", async () => {
  const { deps, calls } = await rig();
  assert.equal(await processProposal(prop({ chain: "Solana" }), deps), "skipped");
  assert.equal(await processProposal(prop({ status: "Ready" }), deps), "skipped");
  assert.deepEqual(calls, []);
});
