#!/usr/bin/env node
// Bridle executor. Commands:
//   address <mandateId>   print the Base address the signer controls for a mandate (fund this)
//   doctor <mandateId>    check everything the first run depends on and say what to fix
//   once                  process every proposal that is waiting for a signature, then exit
//   run                   same, forever
// It can only choose a nonce and fees. The contract builds the payment, and a signature is only
// broadcast if it recovers to the mandate's own derived address.
import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import { loadConfig, type Config } from "./config.js";
import { doctor, render, type DoctorIO } from "./doctor.js";
import { mandateAddress } from "./derive.js";
import { call, view } from "./near.js";
import { processProposal, type Deps, type Fees } from "./process.js";
import type { Proposal, SigningRecord } from "./types.js";

const MAX_FEE_PER_GAS = 200_000_000_000n; // the contract's own cap
const GAS_LIMIT = 100_000n; // an ERC-20 transfer uses roughly 50-65k

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (m: string) => console.log(`${new Date().toISOString()} ${m}`);

function makeDeps(cfg: Config): Deps {
  const client = createPublicClient({ chain: baseSepolia, transport: http(cfg.baseRpc) });
  const getSigning = (id: number) => view<SigningRecord | null>(cfg, "get_signing", { proposal_id: id });
  return {
    log,
    mandateAddress: (id) => mandateAddress(cfg.network, cfg.contractId, id),
    getSigning,
    nextNonce: (address) => client.getTransactionCount({ address, blockTag: "pending" }),
    async fees(): Promise<Fees> {
      const est = await client.estimateFeesPerGas();
      let maxFee = est.maxFeePerGas ?? 2_000_000_000n;
      if (maxFee > MAX_FEE_PER_GAS) maxFee = MAX_FEE_PER_GAS;
      let tip = est.maxPriorityFeePerGas ?? 1_000_000n;
      if (tip > maxFee) tip = maxFee;
      return { maxFeePerGas: maxFee, maxPriorityFeePerGas: tip, gasLimit: GAS_LIMIT };
    },
    async requestSignature(id, nonce, f) {
      await call(
        cfg,
        "request_signature",
        {
          proposal_id: id,
          nonce,
          max_fee_per_gas: f.maxFeePerGas.toString(),
          max_priority_fee_per_gas: f.maxPriorityFeePerGas.toString(),
          gas_limit: Number(f.gasLimit),
        },
        300_000_000_000_000n,
      );
      // The MPC answer arrives in a callback; wait for the stored record to leave "Requested".
      for (let i = 0; i < 20; i++) {
        const rec = await getSigning(id);
        if (!rec || rec.state === "Signed") return;
        await sleep(2000);
      }
    },
    async broadcast(raw) {
      try {
        await client.sendRawTransaction({ serializedTransaction: raw });
      } catch (e) {
        const m = String((e as Error).message ?? e).toLowerCase();
        // Re-sending a transaction that is already known or mined is fine; the receipt decides.
        if (m.includes("already known") || m.includes("known transaction") || m.includes("nonce too low")) return;
        throw e;
      }
    },
    async receipt(hash) {
      try {
        const r = await client.waitForTransactionReceipt({ hash, timeout: 45_000 });
        return r.status === "success" ? "success" : "reverted";
      } catch {
        return "pending";
      }
    },
    reportExecution: (id, hash) => call(cfg, "report_execution", { proposal_id: id, tx_hash: hash }).then(() => {}),
    reportFailure: (id, reason) => call(cfg, "report_failure", { proposal_id: id, reason }).then(() => {}),
  };
}

async function signingProposals(cfg: Config): Promise<Proposal[]> {
  const out: Proposal[] = [];
  for (let from = 0; ; from += 100) {
    const page = await view<Proposal[]>(cfg, "list_proposals", { mandate_id: null, from, limit: 100 });
    out.push(...page.filter((p) => p.status === "Signing"));
    if (page.length < 100) return out;
  }
}

async function pass(cfg: Config, deps: Deps) {
  for (const p of await signingProposals(cfg)) {
    try {
      const outcome = await processProposal(p, deps);
      if (outcome !== "skipped") log(`#${p.id}: ${outcome}`);
    } catch (e) {
      log(`#${p.id}: ${(e as Error).message}`);
    }
  }
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  const cfg = loadConfig();
  if (cmd === "address") {
    if (!arg) throw new Error("usage: address <mandateId>");
    console.log(mandateAddress(cfg.network, cfg.contractId, arg));
    return;
  }
  if (cmd === "doctor") {
    if (!arg) throw new Error("usage: doctor <mandateId>");
    const client = createPublicClient({ chain: baseSepolia, transport: http(cfg.baseRpc) });
    const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);
    const io: DoctorIO = {
      view: (m, a) => view(cfg, m, a),
      async nearBalance(id) {
        const res = await fetch(cfg.nearRpc, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: "d", method: "query", params: { request_type: "view_account", finality: "optimistic", account_id: id } }),
        });
        const body: any = await res.json();
        return body.result?.amount ? BigInt(body.result.amount) : null;
      },
      baseChainId: () => client.getChainId(),
      baseEth: (address) => client.getBalance({ address }),
      baseUsdc: (address) =>
        client.readContract({ address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", abi: erc20, functionName: "balanceOf", args: [address] }),
      nowNs: () => BigInt(Date.now()) * 1_000_000n,
    };
    const checks = await doctor(cfg, Number(arg), io);
    console.log(render(checks));
    if (checks.some((c) => c.level === "fail")) process.exit(1);
    return;
  }
  if (cmd === "once") return pass(cfg, makeDeps(cfg));
  if (cmd === "run") {
    const deps = makeDeps(cfg);
    for (;;) {
      await pass(cfg, deps);
      await sleep(cfg.pollMs);
    }
  }
  console.log("usage: bridle-executor address <mandateId> | doctor <mandateId> | once | run");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
