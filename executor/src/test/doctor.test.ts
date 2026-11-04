import { test } from "node:test";
import assert from "node:assert/strict";
import { doctor, render, type DoctorIO } from "../doctor.js";
import { loadConfig } from "../config.js";

const cfg = loadConfig({ BRIDLE_CONTRACT: "bridle.testnet", EXECUTOR_ACCOUNT: "exec.testnet", EXECUTOR_KEY: "ed25519:x" } as any);
const NOW = 1_800_000_000_000_000_000n;
const mandate = {
  state: "Active", chains: ["Base"], allowlist: [{ chain: "Base", address: "0x1111111111111111111111111111111111111111" }],
  bond: "1000000000000000000000000", bond_posted: "1000000000000000000000000", expires_at: (NOW + 86_400_000_000_000n).toString(),
};

function io(over: Partial<DoctorIO> & { views?: Record<string, unknown> } = {}): DoctorIO {
  const views: Record<string, unknown> = {
    get_derivation_path: "bridle-1", get_config: { executor: "exec.testnet" }, get_mandate: mandate, ...(over.views ?? {}),
  };
  return {
    view: async (m: string) => { const v = views[m]; if (v instanceof Error) throw v; return v as any; },
    nearBalance: async () => 5n * 10n ** 24n,
    baseChainId: async () => 84532,
    baseEth: async () => 10n ** 16n,
    baseUsdc: async () => 20_000_000n,
    nowNs: () => NOW,
    ...over,
  };
}
const levels = (cs: { level: string }[]) => cs.map((c) => c.level);

test("a healthy setup passes everything", async () => {
  const cs = await doctor(cfg, 1, io());
  assert.ok(!levels(cs).includes("fail"), render(cs));
  assert.ok(!levels(cs).includes("warn"), render(cs));
  assert.match(render(cs), /Ready\. Run: npm run once/);
  assert.match(cs.find((c) => c.label.startsWith("Base address"))!.detail, /^0x[0-9a-fA-F]{40}/);
});

test("an old contract stops the check with a clear fix", async () => {
  const cs = await doctor(cfg, 1, io({ views: { get_derivation_path: new Error("MethodNotFound: method get_derivation_path") } }));
  assert.equal(cs.length, 1);
  assert.equal(cs[0].level, "fail");
  assert.match(cs[0].detail, /migrate/);
});

test("wrong executor account is a failure", async () => {
  const cs = await doctor(cfg, 1, io({ views: { get_config: { executor: "someone-else.testnet" } } }));
  assert.match(cs.find((c) => c.label === "Executor account")!.detail, /someone-else\.testnet/);
  assert.equal(cs.find((c) => c.label === "Executor account")!.level, "fail");
});

test("no gas or no USDC at the derived address is a failure naming the address", async () => {
  const cs = await doctor(cfg, 1, io({ baseEth: async () => 0n, baseUsdc: async () => 0n }));
  const addr = cs.find((c) => c.label.startsWith("Base address"))!.detail.split(" ")[0];
  for (const label of ["Base Sepolia ETH for gas", "Base Sepolia USDC"]) {
    const c = cs.find((x) => x.label === label)!;
    assert.equal(c.level, "fail");
    assert.ok(c.detail.includes(addr));
  }
});

test("revoked, expired and recipient-less mandates are all reported", async () => {
  const bad = { ...mandate, state: "Revoked", expires_at: "1", allowlist: [] };
  const c = (await doctor(cfg, 1, io({ views: { get_mandate: bad } }))).find((x) => x.label === "Mandate")!;
  assert.equal(c.level, "fail");
  for (const part of [/Revoked/, /expired/, /no approved Base recipient/]) assert.match(c.detail, part);
});

test("an unposted bond and a low contract balance are warnings, not failures", async () => {
  const cs = await doctor(cfg, 1, io({ nearBalance: async () => 10n ** 23n, views: { get_mandate: { ...mandate, bond_posted: "0" } } }));
  assert.ok(!levels(cs).includes("fail"));
  assert.equal(cs.filter((c) => c.level === "warn").length, 2);
});

test("the wrong Base network stops before any balance is read", async () => {
  let read = false;
  const cs = await doctor(cfg, 1, io({ baseChainId: async () => 8453, baseEth: async () => { read = true; return 0n; } }));
  assert.equal(cs.find((c) => c.label === "Base RPC")!.level, "fail");
  assert.equal(read, false);
});

test("an unreachable Base RPC is reported, not thrown", async () => {
  const cs = await doctor(cfg, 1, io({ baseChainId: async () => { throw new Error("fetch failed"); } }));
  assert.match(cs.find((c) => c.label === "Base RPC")!.detail, /fetch failed/);
});
