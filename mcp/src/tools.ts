// Tool logic, kept separate from the MCP wiring so it can be tested without a server.
// Deliberately absent: create, update, revoke, veto, flag and bond-withdraw. Those are owner or
// watcher actions. An agent must not be able to widen its own limits.
import type { Config } from "./config.js";
import { checkPayment, effectiveLimits, remainingToday } from "./policy.js";
import type { Chain, Mandate, Proposal } from "./types.js";
import { decimalsOf, formatAmount, parseAmount } from "./units.js";

export type Deps = {
  cfg: Config;
  view: <T>(method: string, args?: Record<string, unknown>) => Promise<T>;
  now: () => Promise<bigint>;
  /** Sends propose_payment as the agent. Only used when a key is configured. */
  propose: (args: { mandate_id: number; chain: Chain; asset: string; amount: string; recipient: string }) => Promise<Proposal>;
};

export class ToolError extends Error {}

const iso = (ns: bigint | string) => new Date(Number(BigInt(ns) / 1_000_000n)).toISOString();

/** Turn a contract panic or RPC failure into one plain sentence. */
export function explain(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.match(/Smart contract panicked: ([^"\\]+)/);
  if (m) return m[1].trim();
  if (/does not exist while viewing|CodeDoesNotExist|no contract code/i.test(raw))
    return "No contract is deployed at BRIDLE_CONTRACT. Check the account id.";
  return raw.length > 240 ? raw.slice(0, 240) + "…" : raw;
}

async function loadMandate(d: Deps, id: number): Promise<Mandate> {
  const m = await d.view<Mandate | null>("get_mandate", { mandate_id: id });
  if (!m) throw new ToolError(`No mandate with id ${id}.`);
  return m;
}

/** A NEAR mandate is NEAR-only (the contract refuses to mix it with USDC chains). */
const unitOf = (m: Mandate) => (m.chains.includes("Near") ? "NEAR" : "USDC");

function describeMandate(d: Deps, m: Mandate, nowNs: bigint) {
  const unit = unitOf(m);
  const k = unit.toLowerCase();
  const f = (v: bigint | string) => formatAmount(v, decimalsOf(unit));
  const lim = effectiveLimits(m, nowNs);
  const left = remainingToday(m, nowNs);
  const notes: string[] = [];
  if (d.cfg.agentAccount && m.agent !== d.cfg.agentAccount)
    notes.push(`This mandate's agent is ${m.agent}, not ${d.cfg.agentAccount}. propose_payment would be refused.`);
  if (m.state === "Active" && BigInt(m.bond_posted) < BigInt(m.bond))
    notes.push("The agent bond is not fully posted yet, so every proposal will be blocked until it is.");
  if (m.pending_limits) notes.push(`Looser limits are queued and take effect at ${iso(m.pending_limits.effective_at)}.`);
  return {
    summary:
      m.state === "Revoked"
        ? `Mandate ${m.id} is revoked. Nothing can be proposed.`
        : `Mandate ${m.id}: up to ${f(lim.daily)} ${unit} a day, ${f(lim.perTx)} per payment, to ${m.allowlist.length} approved recipient${m.allowlist.length === 1 ? "" : "s"}. Payments over ${f(lim.threshold)} wait ${Number(lim.windowS) / 60} min for the owner. ${f(left)} left today (resets 00:00 UTC).`,
    mandate_id: m.id,
    state: m.state,
    owner: m.owner,
    agent: m.agent,
    chains: m.chains,
    assets: m.assets,
    [`per_payment_cap_${k}`]: f(lim.perTx),
    [`daily_cap_${k}`]: f(lim.daily),
    [`remaining_today_${k}`]: f(left),
    [`review_threshold_${k}`]: f(lim.threshold),
    challenge_window_minutes: Number(lim.windowS) / 60,
    approved_recipients: m.allowlist,
    expires_at: iso(m.expires_at),
    notes,
  };
}

export async function getMandate(d: Deps, a: { mandate_id: number }) {
  const [m, now] = await Promise.all([loadMandate(d, a.mandate_id), d.now()]);
  return describeMandate(d, m, now);
}

export async function listMandates(d: Deps, a: { account_id?: string }) {
  const account = a.account_id ?? d.cfg.agentAccount;
  if (!account) throw new ToolError("Pass account_id, or set BRIDLE_AGENT_ACCOUNT so the server knows which agent you are.");
  const [list, now] = await Promise.all([
    d.view<Mandate[]>("list_mandates_for", { account_id: account, from: 0, limit: 100 }),
    d.now(),
  ]);
  const mine = list.filter((m) => m.agent === account);
  return {
    summary: mine.length ? `${mine.length} mandate${mine.length === 1 ? "" : "s"} name ${account} as the agent.` : `No mandate names ${account} as the agent.`,
    mandates: mine.map((m) => {
      const x = describeMandate(d, m, now);
      return { mandate_id: x.mandate_id, state: x.state, summary: x.summary };
    }),
  };
}

type PaymentArgs = { mandate_id: number; chain: Chain; asset?: string; amount: string; recipient: string };

function normalise(a: PaymentArgs) {
  const asset = (a.asset ?? (a.chain === "Near" ? "NEAR" : "USDC")).toUpperCase();
  const dec = decimalsOf(asset);
  const amount = parseAmount(a.amount, dec);
  if (amount === null)
    throw new ToolError(`Amount "${a.amount}" is not valid. Use a plain decimal in ${asset}, such as ${asset === "NEAR" ? "1.5" : "18.50"} (up to ${dec} decimals).`);
  return { amount, asset, recipient: a.recipient.trim() };
}

export async function checkPaymentTool(d: Deps, a: PaymentArgs) {
  const { amount, asset, recipient } = normalise(a);
  const [m, now] = await Promise.all([loadMandate(d, a.mandate_id), d.now()]);
  const v = checkPayment(m, now, { chain: a.chain, asset, amount, recipient });
  const base = { mandate_id: m.id, chain: a.chain, asset, [`amount_${asset.toLowerCase()}`]: formatAmount(amount, decimalsOf(asset)), recipient, dry_run: true };
  const hint =
    v.outcome === "blocked" && v.rule === "recipient"
      ? " The address must match the approved list exactly, including letter case."
      : "";
  if (v.outcome === "blocked") {
    return { summary: `Would be blocked. ${v.reason}.${hint} Nothing was sent.`, outcome: v.outcome, rule: v.rule, ...base };
  }
  if (v.outcome === "review") {
    return {
      summary: `Would be accepted, then held for review. ${v.reason}. Earliest execution ${iso(v.executableAtNs)}. Nothing was sent.`,
      outcome: v.outcome, executable_at: iso(v.executableAtNs), ...base,
    };
  }
  return { summary: `Would be accepted and cleared. ${v.reason}. Nothing was sent.`, outcome: v.outcome, ...base };
}

function describeProposal(p: Proposal, cfg: Config) {
  let summary: string;
  switch (p.status) {
    case "Rejected": summary = `Blocked. ${p.reason ?? "A rule stopped it"}. The attempt is recorded on-chain and visible to the owner.`; break;
    case "Waiting": summary = `Waiting for the owner's review until ${iso(p.executable_at)}. Do not resend it; the owner can veto it.`; break;
    case "Ready":
      summary = p.chain === "Near"
        ? "Cleared by the mandate. The payment goes out when anyone triggers execute (the owner's dashboard has a button); no funds have moved yet."
        : "Cleared by the mandate. Cross-chain signing is not connected in this version, so no funds have moved.";
      break;
    case "Flagged": summary = "A watcher flagged it. It will not run unless the owner dismisses the flag."; break;
    case "Cancelled": summary = "Cancelled after a confirmed flag."; break;
    case "Vetoed": summary = "The owner vetoed it. Nothing moved."; break;
    case "Expired": summary = "Expired without a decision. Nothing moved."; break;
    case "Signing": summary = "Cleared and waiting for the executor to sign. No funds have moved yet."; break;
    case "Executed": summary = `Executed.${p.tx_hash ? ` Transaction ${p.tx_hash}.` : ""}`; break;
    default: summary = p.status;
  }
  return {
    summary,
    proposal_id: p.id,
    mandate_id: p.mandate_id,
    status: p.status,
    reason: p.reason,
    chain: p.chain,
    asset: p.asset,
    [`amount_${p.asset.toLowerCase()}`]: formatAmount(p.amount, decimalsOf(p.asset)),
    recipient: p.recipient,
    created_at: iso(p.created_at),
    executable_at: p.status === "Waiting" ? iso(p.executable_at) : null,
    tx_hash: p.tx_hash,
    explorer: `${cfg.explorer}/address/${cfg.contractId}`,
  };
}

export async function proposePayment(d: Deps, a: PaymentArgs) {
  if (!d.cfg.agentAccount || !d.cfg.agentKey) {
    throw new ToolError(
      "propose_payment needs the agent's NEAR account and key. Set BRIDLE_AGENT_ACCOUNT and BRIDLE_AGENT_KEY in this server's environment. Use a key limited to propose_payment on the Bridle contract. The read tools and check_payment work without it.",
    );
  }
  const { amount, asset, recipient } = normalise(a);
  try {
    const p = await d.propose({ mandate_id: a.mandate_id, chain: a.chain, asset, amount: amount.toString(), recipient });
    return describeProposal(p, d.cfg);
  } catch (e) {
    throw new ToolError(explain(e));
  }
}

export async function getProposal(d: Deps, a: { proposal_id: number }) {
  const p = await d.view<Proposal | null>("get_proposal", { proposal_id: a.proposal_id });
  if (!p) throw new ToolError(`No proposal with id ${a.proposal_id}.`);
  return describeProposal(p, d.cfg);
}

export async function listProposals(d: Deps, a: { mandate_id: number; limit?: number }) {
  const limit = Math.min(Math.max(a.limit ?? 10, 1), 50);
  const list = await d.view<Proposal[]>("list_proposals", { mandate_id: a.mandate_id, from: 0, limit });
  return {
    summary: list.length ? `${list.length} most recent proposal${list.length === 1 ? "" : "s"} for mandate ${a.mandate_id}, newest first.` : `No proposals yet for mandate ${a.mandate_id}.`,
    proposals: list.map((p) => describeProposal(p, d.cfg)),
  };
}
