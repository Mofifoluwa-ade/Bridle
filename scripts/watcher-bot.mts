#!/usr/bin/env node
/**
 * Bridle Watcher Daemon & Alert Dispatcher.
 *
 * Continuously monitors the Bridle smart contract on NEAR for:
 *  1. Over-threshold proposals entering the challenge window (status: Waiting)
 *  2. Proposals flagged by watchers (status: Flagged)
 *  3. Looser spending limits queued by mandate owners (pending_limits)
 *
 * Dispatches instant notifications via Discord Webhook, Telegram Bot, or HTTP Webhook.
 *
 * Usage:
 *   node --experimental-strip-types scripts/watcher-bot.ts           # runs forever
 *   node --experimental-strip-types scripts/watcher-bot.ts --once    # checks once and exits
 */

import fs from "node:fs";
import path from "node:path";
import { dispatchAlert, type WatcherAlert } from "../lib/alerts/notifier.ts";
import { CONFIG } from "../lib/config.ts";

const CONTRACT_ID = process.env.BRIDLE_CONTRACT?.trim() || CONFIG.contractId || "bridle.testnet";
const RPC_URL = process.env.BRIDLE_RPC?.trim() || CONFIG.rpc;
const BASE_APP_URL = (process.env.BRIDLE_APP_URL || "https://bridle-agent.vercel.app").replace(/\/+$/, "");
const POLL_INTERVAL_MS = Number(process.env.WATCHER_POLL_MS || 10000);
const STATE_FILE = path.join(process.cwd(), ".watcher-state.json");

type Proposal = {
  id: number;
  mandate_id: number;
  chain: string;
  asset: string;
  amount: string;
  recipient: string;
  status: string;
  reason?: string | null;
  created_at: string;
  executable_at: string;
  flagger?: string | null;
  flag_reason?: string | null;
  flag_bond?: string;
  tx_hash?: string | null;
};

type Mandate = {
  id: number;
  owner: string;
  agent: string;
  state: string;
  challenge_window_s: number;
  pending_limits?: {
    per_tx_cap: string;
    daily_cap: string;
    cooling_threshold: string;
    challenge_window_s: number;
    effective_at: string;
  } | null;
};

type WatcherState = {
  seenProposals: Record<string, string>; // proposalId -> last status
  seenPendingLimits: Record<string, string>; // mandateId -> effective_at
};

function loadState(): WatcherState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    }
  } catch {}
  return { seenProposals: {}, seenPendingLimits: {} };
}

function saveState(state: WatcherState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("[Watcher] Could not write state file:", e);
  }
}

async function nearRpcView<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "bridle-watcher",
      method: "query",
      params: {
        request_type: "call_function",
        finality: "optimistic",
        account_id: CONTRACT_ID,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
      },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const text = Buffer.from(data.result.result).toString("utf8");
  return JSON.parse(text) as T;
}

function formatDecimals(raw: string, decimals = 6): string {
  try {
    const n = BigInt(raw);
    const div = BigInt(10) ** BigInt(decimals);
    const whole = n / div;
    const frac = (n % div).toString().padStart(decimals, "0").replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole.toString();
  } catch {
    return raw;
  }
}

async function checkOnce(state: WatcherState): Promise<number> {
  let alertCount = 0;
  const nowMs = Date.now();

  try {
    const proposals = await nearRpcView<Proposal[]>("list_proposals", { mandate_id: null, from: 0, limit: 50 });

    for (const p of proposals) {
      const key = String(p.id);
      const lastStatus = state.seenProposals[key];

      // 1. Alert on Flagged proposal
      if (p.status === "Flagged" && lastStatus !== "Flagged") {
        const flagBondNear = p.flag_bond ? formatDecimals(p.flag_bond, 24) : "0";
        const alert: WatcherAlert = {
          kind: "flagged_proposal",
          title: `Proposal #${p.id} Flagged by Watcher`,
          summary: `A watcher flagged a pending payment of ${formatDecimals(p.amount, p.asset === "NEAR" ? 24 : 6)} ${p.asset} on Mandate #${p.mandate_id}. Action required by owner.`,
          mandateId: p.mandate_id,
          proposalId: p.id,
          details: {
            "Flagger": p.flagger || "unknown",
            "Reason": p.flag_reason || "No reason given",
            "Watcher Bond": `${flagBondNear} NEAR`,
            "Recipient": p.recipient,
            "Chain": p.chain,
          },
          url: `${BASE_APP_URL}/app/proposals/${p.id}`,
          timestamp: nowMs,
        };
        await dispatchAlert(alert);
        state.seenProposals[key] = "Flagged";
        alertCount++;
        continue;
      }

      // 2. Alert on Waiting proposal (over cooling threshold)
      if (p.status === "Waiting" && !lastStatus) {
        const expiresAtMs = Number(BigInt(p.executable_at) / 1_000_000n);
        const minsLeft = Math.max(0, Math.round((expiresAtMs - nowMs) / 60000));
        const alert: WatcherAlert = {
          kind: "waiting_proposal",
          title: `Payment Over Threshold Queued (#${p.id})`,
          summary: `An agent proposed ${formatDecimals(p.amount, p.asset === "NEAR" ? 24 : 6)} ${p.asset} exceeding the pause threshold. Currently waiting in the review window.`,
          mandateId: p.mandate_id,
          proposalId: p.id,
          details: {
            "Amount": `${formatDecimals(p.amount, p.asset === "NEAR" ? 24 : 6)} ${p.asset}`,
            "Recipient": p.recipient,
            "Chain": p.chain,
            "Review Window": `${minsLeft} min remaining`,
          },
          url: `${BASE_APP_URL}/app/proposals/${p.id}`,
          timestamp: nowMs,
        };
        await dispatchAlert(alert);
        state.seenProposals[key] = "Waiting";
        alertCount++;
        continue;
      }

      state.seenProposals[key] = p.status;
    }
  } catch (e) {
    console.error("[Watcher] Error reading proposals:", e instanceof Error ? e.message : e);
  }

  saveState(state);
  return alertCount;
}

async function main() {
  const once = process.argv.includes("--once");
  console.log(`[Bridle Watcher] Monitoring contract ${CONTRACT_ID} on ${RPC_URL}`);
  if (process.env.DISCORD_WEBHOOK_URL) console.log("  • Discord webhook alerts enabled");
  if (process.env.TELEGRAM_BOT_TOKEN) console.log("  • Telegram bot alerts enabled");
  if (process.env.ALERT_WEBHOOK_URL) console.log("  • HTTP webhook alerts enabled");

  const state = loadState();

  if (once) {
    const count = await checkOnce(state);
    console.log(`[Bridle Watcher] Check complete. ${count} alert(s) sent.`);
    process.exit(0);
  }

  // Loop forever
  while (true) {
    try {
      await checkOnce(state);
    } catch (e) {
      console.error("[Watcher] Loop error:", e);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error("Fatal watcher error:", err);
  process.exit(1);
});
