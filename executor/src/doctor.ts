// Pre-flight for the first live run. Checks everything the Base transfer depends on and says
// what to fix. All I/O is injected so the logic is testable without a network.
import type { Config } from "./config.js";
import { mandateAddress } from "./derive.js";

export type Check = { level: "ok" | "warn" | "fail"; label: string; detail: string };

export type DoctorIO = {
  view<T>(method: string, args?: Record<string, unknown>): Promise<T>;
  /** NEAR balance in yoctoNEAR, or null if the account does not exist. */
  nearBalance(accountId: string): Promise<bigint | null>;
  baseChainId(): Promise<number>;
  baseEth(address: `0x${string}`): Promise<bigint>;
  baseUsdc(address: `0x${string}`): Promise<bigint>;
  nowNs(): bigint;
};

const NEAR = 10n ** 24n;
const MIN_ETH = 5n * 10n ** 14n; // 0.0005 ETH covers many ERC-20 transfers on Base Sepolia
const fmt = (v: bigint, decimals: number, dp = 6) => {
  const s = v.toString().padStart(decimals + 1, "0");
  return `${s.slice(0, -decimals)}.${s.slice(-decimals).slice(0, dp)}`;
};

type Mandate = {
  state: string;
  chains: string[];
  allowlist: { chain: string; address: string }[];
  bond: string;
  bond_posted: string;
  expires_at: string;
};

export async function doctor(cfg: Config, mandateId: number, io: DoctorIO): Promise<Check[]> {
  const out: Check[] = [];
  const add = (level: Check["level"], label: string, detail: string) => out.push({ level, label, detail });
  const msg = (e: unknown) => String((e as Error)?.message ?? e);

  // 1. Is the new contract code deployed?
  try {
    const path = await io.view<string>("get_derivation_path", { mandate_id: mandateId });
    add("ok", "Contract has signing support", `derivation path ${path}`);
  } catch (e) {
    add("fail", "Contract has signing support", /not exist|not found|MethodNotFound|no such method/i.test(msg(e))
      ? "the deployed contract is the old version. Deploy the new wasm, then call migrate once (see contract/README.md)"
      : `could not read the contract: ${msg(e)}`);
    return out; // nothing else is meaningful until this passes
  }

  // 2. Is the executor the account we hold a key for?
  try {
    const conf = await io.view<{ executor: string }>("get_config");
    if (!cfg.executorAccount) add("warn", "Executor account", `contract executor is ${conf.executor}; set EXECUTOR_ACCOUNT and EXECUTOR_KEY to send transactions`);
    else if (conf.executor !== cfg.executorAccount) add("fail", "Executor account", `contract executor is ${conf.executor} but EXECUTOR_ACCOUNT is ${cfg.executorAccount}`);
    else add("ok", "Executor account", `${conf.executor} matches`);
    if (!cfg.executorKey) add("warn", "Executor key", "EXECUTOR_KEY is not set");
  } catch (e) {
    add("fail", "Executor account", msg(e));
  }

  // 3. Does the contract hold NEAR for the 1 yocto deposit and storage?
  try {
    const bal = await io.nearBalance(cfg.contractId);
    if (bal === null) add("fail", "Contract NEAR balance", `${cfg.contractId} does not exist`);
    else if (bal < NEAR) add("warn", "Contract NEAR balance", `${fmt(bal, 24, 3)} NEAR; send it at least 1 NEAR (storage and the signer deposit)`);
    else add("ok", "Contract NEAR balance", `${fmt(bal, 24, 3)} NEAR`);
  } catch (e) {
    add("warn", "Contract NEAR balance", msg(e));
  }

  // 4. The mandate
  try {
    const m = await io.view<Mandate | null>("get_mandate", { mandate_id: mandateId });
    if (!m) add("fail", "Mandate", `mandate ${mandateId} does not exist`);
    else {
      const base = m.allowlist.filter((r) => r.chain === "Base");
      const problems: string[] = [];
      if (m.state !== "Active") problems.push(`state is ${m.state}`);
      if (BigInt(m.expires_at) <= io.nowNs()) problems.push("it has expired");
      if (!m.chains.includes("Base")) problems.push("Base is not an allowed chain");
      if (base.length === 0) problems.push("no approved Base recipient");
      if (problems.length) add("fail", "Mandate", problems.join("; "));
      else add("ok", "Mandate", `active, ${base.length} approved Base recipient(s)`);
      if (BigInt(m.bond) > 0n && BigInt(m.bond_posted) < BigInt(m.bond)) add("warn", "Agent bond", "not posted yet; the agent must post it before proposing");
    }
  } catch (e) {
    add("fail", "Mandate", msg(e));
  }

  // 5. Base Sepolia and the derived address
  const addr = mandateAddress(cfg.network, cfg.contractId, mandateId);
  add("ok", "Base address for this mandate", `${addr}  (fund this address)`);
  try {
    const id = await io.baseChainId();
    if (id !== 84532) {
      add("fail", "Base RPC", `chain id ${id}, expected 84532 (Base Sepolia). Check BASE_RPC`);
      return out; // balances from the wrong network would mislead
    }
    add("ok", "Base RPC", "Base Sepolia (84532)");
  } catch (e) {
    add("fail", "Base RPC", `cannot reach it: ${msg(e)}`);
    return out;
  }
  try {
    const eth = await io.baseEth(addr);
    if (eth < MIN_ETH) add("fail", "Base Sepolia ETH for gas", `${fmt(eth, 18)} ETH at ${addr}; needs about 0.0005 ETH from a Base Sepolia faucet`);
    else add("ok", "Base Sepolia ETH for gas", `${fmt(eth, 18)} ETH`);
    const usdc = await io.baseUsdc(addr);
    if (usdc === 0n) add("fail", "Base Sepolia USDC", `0 USDC at ${addr}; Circle's faucet issues Base Sepolia USDC`);
    else add("ok", "Base Sepolia USDC", `${fmt(usdc, 6, 2)} USDC`);
  } catch (e) {
    add("fail", "Base balances", msg(e));
  }
  return out;
}

export function render(checks: Check[]): string {
  const mark = { ok: "✓", warn: "!", fail: "✗" } as const;
  const lines = checks.map((c) => `${mark[c.level]} ${c.label}: ${c.detail}`);
  const fails = checks.filter((c) => c.level === "fail").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  lines.push("", fails ? `${fails} problem(s) to fix before the first run.` : warns ? "Ready, with warnings above." : "Ready. Run: npm run once");
  return lines.join("\n");
}
