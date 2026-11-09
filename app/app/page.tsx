"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  Empty,
  LinkBtn,
  Notice,
  PageHeader,
  Skeleton,
  Label,
  Btn,
} from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates, useProposalsFor } from "@/hooks/useMyData";
import { useNow } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { amountOf, nsToMs, timeAgo, unitOfMandate, usdc } from "@/lib/format";
import { useAccountBalance } from "@/hooks/useNearBalance";
import type { Proposal, Mandate } from "@/lib/types";
import { MandatePolicySummary } from "@/components/app/MandateCard";

export default function Dashboard() {
  const { accountId, signIn, ready } = useWallet();
  const walletBalance = useAccountBalance(accountId);
  const now = useNow(5000);
  const liveMandates = useMyMandates();
  const liveProposals = useProposalsFor(liveMandates.data);

  const [filter, setFilter] = useState<"All" | "Needs review" | "Allowed" | "Stopped">("All");
  const [notification, setNotification] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem("bridle_hide_getting_started") === "true") setShowSetup(false);
    } catch {}
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const isContractConfigured = Boolean(CONFIG.contractId);

  const displayMandates: Mandate[] = liveMandates.data ?? [];
  const displayProposals: Proposal[] = liveProposals.data ?? [];

  // The contract stores current proposal outcomes, not a timestamp for each status change.
  const filteredProposals = displayProposals.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Allowed")
      return p.status === "Ready" || p.status === "Signing" || p.status === "Executed";
    if (filter === "Stopped")
      return p.status === "Rejected" || p.status === "Cancelled" || p.status === "Vetoed" || p.status === "Expired";
    if (filter === "Needs review")
      return p.status === "Waiting" || p.status === "Flagged";
    return true;
  });

  const counts = {
    All: displayProposals.length,
    Allowed: displayProposals.filter(
      (p) => p.status === "Ready" || p.status === "Signing" || p.status === "Executed"
    ).length,
    "Needs review": displayProposals.filter(
      (p) => p.status === "Waiting" || p.status === "Flagged"
    ).length,
    Stopped: displayProposals.filter(
      (p) => p.status === "Rejected" || p.status === "Cancelled" || p.status === "Vetoed" || p.status === "Expired"
    ).length,
  };

  const activityItems = [
    ...(filter === "All"
      ? displayMandates.map((m) => ({
          id: `rule-${m.id}`,
          timestamp: nsToMs(m.created_at),
          href: `/app/mandates/${m.id}`,
          title: "Spending rule created",
          detail: `Rule #${m.id} for ${m.agent}`,
          status: m.state === "Active" ? "Active rule" : "Stopped",
          kind: "rule" as const,
        }))
      : []),
    ...filteredProposals.map((p) => {
      const mandate = displayMandates.find((m) => m.id === p.mandate_id);
      const detail = p.reason || p.flag_reason || proposalStatusDetail(p.status);
      return {
        id: `proposal-${p.id}`,
        timestamp: nsToMs(p.created_at),
        href: `/app/proposals/${p.id}`,
        title: `Payment request · ${amountOf(p)}`,
        detail: `${p.chain} · to ${p.recipient}${mandate ? ` · Rule #${mandate.id}` : ""}${detail ? ` · ${detail}` : ""}`,
        status: p.status,
        kind: "proposal" as const,
      };
    }),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const activeMandates = displayMandates.filter((m) => m.state === "Active");
  const hasAgent = displayMandates.some((m) => Boolean(m.agent));
  const hasLimits = displayMandates.some((m) => BigInt(m.per_tx_cap) > BigInt(0) && BigInt(m.daily_cap) >= BigInt(m.per_tx_cap));
  const needsDepositMandates = activeMandates.filter(
    (m) => BigInt(m.bond_posted) < BigInt(m.bond)
  );
  const readyMandates = activeMandates.filter(
    (m) => BigInt(m.bond_posted) >= BigInt(m.bond)
  );
  const mineToDecide = displayProposals.filter(
    (p) => p.status === "Waiting" || p.status === "Flagged"
  );
  // Dashboard totals are USDC only; a NEAR rule has its own unit.
  const usdcMandates = activeMandates.filter((m) => unitOfMandate(m) === "USDC");
  const spent = usdcMandates.reduce(
    (a, m) => a + BigInt(m.spent_today || "0"),
    BigInt(0)
  );
  const cap = usdcMandates.reduce(
    (a, m) => a + BigInt(m.daily_cap || "0"),
    BigInt(0)
  );

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="animate-fade-in fixed top-16 right-6 z-50 max-w-md">
          <Notice tone="ok" title="Notice">
            {notification}
          </Notice>
        </div>
      )}

      {/* Compact Page Header with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
            Dashboard
          </h1>
          <p className="text-xs text-mute dark:text-dark-mute mt-0.5">
            Set spending rules for your AI agents and watch every payment in real time
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            id="tour-stress-test-btn"
            href="/app/agent"
            className="inline-flex items-center gap-1.5 rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card px-3.5 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover shadow-2xs transition-all"
            title="Try sending a test payment from your agent"
          >
            <span>Test your agent</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            id="tour-new-mandate-btn"
            href="/app/mandates/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 shadow-sm transition-all"
          >
            <span>+</span>
            <span>New rule</span>
          </Link>
        </div>
      </div>

      {!isContractConfigured && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white">
          <strong>Live data not connected:</strong> Contract address is not configured.
        </div>
      )}

      {isContractConfigured && liveMandates.error && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white flex items-center justify-between">
          <div>
            <strong>Could not load spending rules:</strong> {liveMandates.error}
          </div>
          <button type="button" onClick={liveMandates.refresh} className="underline text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {isContractConfigured && liveProposals.error && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white flex items-center justify-between">
          <div>
            <strong>Could not load payments:</strong> {liveProposals.error}
          </div>
          <button type="button" onClick={liveProposals.refresh} className="underline text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {showSetup && (!accountId || displayMandates.length === 0 || !hasAgent || !hasLimits) && (
        <section className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 shadow-sm" aria-labelledby="setup-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent dark:text-[#46D9A4]">Your first run</p>
              <h2 id="setup-title" className="mt-1 text-base font-semibold text-ink dark:text-white">Get an agent ready to pay safely</h2>
              <p className="mt-1 text-xs text-mute dark:text-dark-mute">A short checklist you can return to whenever you need it.</p>
            </div>
            <button type="button" onClick={() => { setShowSetup(false); try { localStorage.setItem("bridle_hide_getting_started", "true"); } catch {} }} className="text-xs text-mute hover:text-ink dark:hover:text-white">Dismiss</button>
          </div>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SetupStep done={Boolean(accountId)} title="Connect wallet" href="#" action={accountId ? "Connected" : "Connect wallet"} onAction={!accountId ? signIn : undefined} />
            <SetupStep done={displayMandates.length > 0} title="Create a mandate" href="/app/mandates/new" action="Create mandate" />
            <SetupStep done={hasAgent} title="Assign your agent" href="/app/mandates/new" action="Choose an agent" />
            <SetupStep done={hasLimits} title="Configure spending limits" href="/app/mandates/new" action="Set limits" />
          </ol>
        </section>
      )}

      {/* Wallet overview */}
      <section className="overflow-hidden rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-mute dark:text-dark-mute">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 10h18M16 15h2" />
                </svg>
              </span>
              Wallet balance
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-mute dark:text-dark-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4]" />
              NEAR {CONFIG.network}
            </span>
          </div>

          {accountId ? (
            <>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-4xl sm:text-5xl font-semibold tracking-[-0.045em] leading-none text-ink dark:text-white tabular-nums">
                    {walletBalance.loading && walletBalance.near === 0 ? "Loading…" : walletBalance.usd}
                  </div>
                  <p className="mt-2 text-xs text-mute dark:text-dark-mute">
                    {walletBalance.isUpdating
                      ? `Updating balance… · ${walletBalance.near} NEAR`
                      : `≈ ${walletBalance.near} NEAR · Testnet tokens have no real monetary value`}
                  </p>
                </div>
                {walletBalance.isUpdating && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent dark:text-[#46D9A4]">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4] animate-pulse" />
                    Updating
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Link href="/app/mandates/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink dark:bg-white px-3 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-opacity">
                  <span aria-hidden="true">＋</span> New mandate
                </Link>
                <Link href="/app/agent" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line dark:border-dark-border px-3 py-2.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors">
                  <span aria-hidden="true">↗</span> Test agent
                </Link>
                <button type="button" onClick={() => setFilter("Needs review")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line dark:border-dark-border px-3 py-2.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors">
                  <span aria-hidden="true">⌁</span> Review proposals
                  {mineToDecide.length > 0 && <span className="rounded-full bg-warn-tint px-1.5 py-0.5 text-[10px] text-warn">{mineToDecide.length}</span>}
                </button>
                <button type="button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(accountId);
                    showNotification("Wallet address copied.");
                  } catch {
                    showNotification("Could not copy the wallet address. Select it from your wallet menu.");
                  }
                }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line dark:border-dark-border px-3 py-2.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors">
                  <span aria-hidden="true">▢</span> Copy address
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-mute dark:text-dark-mute">
                <span>Connected as</span>
                <span className="font-mono text-ink dark:text-white">{accountId}</span>
                <span>·</span>
                <a href={`${CONFIG.explorer}/address/${accountId}`} target="_blank" rel="noreferrer" className="font-medium text-accent dark:text-[#46D9A4] hover:underline">View on explorer ↗</a>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-ink dark:text-white">Connect your wallet</div>
                <p className="mt-2 max-w-lg text-xs leading-relaxed text-mute dark:text-dark-mute">
                  Connect a NEAR testnet wallet to view its balance, manage spending mandates, and review agent payment proposals.
                </p>
              </div>
              <Btn size="sm" onClick={signIn} disabled={!ready} className="shrink-0">
                {ready ? "Connect wallet" : "Loading wallet…"}
              </Btn>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-line dark:border-dark-border bg-paper/50 dark:bg-dark-bg/40">
          <div className="p-4 sm:px-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Active mandates</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-ink dark:text-white tabular-nums">{activeMandates.length}</div>
            <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">
              {accountId ? (needsDepositMandates.length > 0 ? `${needsDepositMandates.length} awaiting agent deposit` : `${displayMandates.length} total created`) : "Connect wallet to view mandates"}
            </p>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-line dark:border-dark-border p-4 sm:px-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Needs your review</div>
            <div className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${mineToDecide.length > 0 ? "text-warn" : "text-ink dark:text-white"}`}>{mineToDecide.length}</div>
            <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">{mineToDecide.length > 0 ? "Proposals waiting for a decision" : "No proposals waiting"}</p>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-line dark:border-dark-border p-4 sm:px-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Spent today</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-ink dark:text-white tabular-nums">{usdc(spent)}</div>
            <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">{cap > BigInt(0) ? `of ${usdc(cap)} combined daily cap` : "No daily cap configured"}</p>
          </div>
        </div>
      </section>

      {/* Review queue summary */}
      {mineToDecide.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-warn">Needs your review:</span>
            <span className="text-ink dark:text-white">
              {mineToDecide.length} payment{mineToDecide.length > 1 ? "s" : ""} paused so you can approve or cancel.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilter("Needs review")}
            className="font-medium text-warn underline text-xs hover:opacity-85"
          >
            Review paused payments →
          </button>
        </div>
      )}

      {/* Side-by-Side 2-Column Split: Mandates (Left) & Payment Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Mandates */}
        <section className="lg:col-span-5 flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 text-ink dark:text-dark-text shadow-sm flex flex-col min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-line dark:border-dark-border">
              <div>
                <h2 className="text-base sm:text-[17px] font-semibold text-ink dark:text-white">
                  Spending rules
                </h2>
                <p className="text-[11.5px] text-mute dark:text-dark-mute">
                  Limits and controls for your AI agents
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/app/mandates"
                  className="text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
                >
                  View all →
                </Link>
                <Link
                  href="/app/mandates/new"
                  className="text-xs font-semibold text-accent dark:text-[#46D9A4] hover:underline"
                >
                  + Add rule
                </Link>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/50 p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Total rules</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-ink dark:text-white">
                  {liveMandates.loading ? "—" : displayMandates.length}
                </p>
                <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">Created for this wallet</p>
              </div>
              <div className="rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/50 p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Active</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-accent dark:text-[#46D9A4]">
                  {liveMandates.loading ? "—" : activeMandates.length}
                </p>
                <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">Currently enabled</p>
              </div>
              <div className="rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/50 p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Needs deposit</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-ink dark:text-white">
                  {liveMandates.loading ? "—" : needsDepositMandates.length}
                </p>
                <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">Awaiting agent bond</p>
              </div>
              <div className="rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/50 p-3.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Daily allowance</p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight tabular-nums text-ink dark:text-white">
                  {usdc(cap)}
                </p>
                <p className="mt-0.5 text-[11px] text-mute dark:text-dark-mute">Combined active limits</p>
              </div>
            </div>
            {displayMandates.slice(0, 2).map((m) => (
              <div key={m.id} className="mt-3 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-3.5">
                <Link href={`/app/mandates/${m.id}`} className="text-xs font-semibold text-ink dark:text-white hover:underline">Rule #{m.id} · {m.agent}</Link>
                <MandatePolicySummary m={m} />
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-mute dark:text-dark-mute">
              <span>
                {liveMandates.loading
                  ? "Updating rule summary…"
                  : liveMandates.error
                    ? "Rule summary may be out of date."
                    : displayMandates.length === 0
                      ? "No spending rules created yet."
                      : `${readyMandates.length} funded · ${needsDepositMandates.length} awaiting deposit`}
              </span>
              <Link href="/app/mandates" className="shrink-0 font-semibold text-accent dark:text-[#46D9A4] hover:underline">
                Manage rules →
              </Link>
            </div>
            <Link href="/mcp" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent-tint/20 dark:bg-accent-tint/10 px-3.5 py-3 group">
              <span>
                <span className="block text-xs font-semibold text-ink dark:text-white">Connect your AI agent with MCP</span>
                <span className="mt-0.5 block text-[11px] text-mute dark:text-dark-mute">Setup steps, client config, and the six available tools</span>
              </span>
              <span className="text-sm text-accent dark:text-[#46D9A4] group-hover:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
            </Link>
            </div>
          </section>

        {/* Right Column: Live Stream Agent Payment Feed */}
        <section className="lg:col-span-7 flex flex-col min-w-0">
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 text-ink dark:text-dark-text shadow-sm flex flex-col min-w-0">
            {/* Feed Header with Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-line dark:border-dark-border">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
                  ACTIVITY TIMELINE
                </span>
                <h2 className="text-base sm:text-[17px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
                  What happened
                </h2>
                <p className="mt-0.5 text-[10.5px] text-mute dark:text-dark-mute">Sorted by request time; each payment shows its current outcome.</p>
              </div>

              {/* Filter Pills with Count Badges */}
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs overflow-x-auto max-w-full">
                {(["All", "Needs review", "Allowed", "Stopped"] as const).map((tab) => {
                  const isActive = filter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`rounded-full px-2.5 py-1 text-xs transition-all duration-150 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-white dark:bg-dark-card text-ink dark:text-white font-semibold shadow-xs border border-line dark:border-dark-border"
                          : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                      }`}
                    >
                      <span>{tab}</span>
                      <span
                        className={`font-mono text-[10px] px-1 rounded-full ${
                          isActive
                            ? "bg-paper dark:bg-dark-bg text-ink dark:text-white"
                            : "text-dim dark:text-dark-dim"
                        }`}
                      >
                        {counts[tab]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chronological rule and payment activity */}
            <div className="max-h-[390px] overflow-y-auto divide-y divide-line dark:divide-dark-border -mx-4 sm:-mx-5 px-4 sm:px-5 scrollbar-thin">
              {activityItems.length === 0 ? (
                <div className="py-14 text-center text-xs text-mute dark:text-dark-mute max-w-sm mx-auto px-4">
                  {!accountId ? (
                    <div className="space-y-1.5">
                      <p className="font-semibold text-ink dark:text-white text-[13px]">
                        Activity will appear here
                      </p>
                      <p className="leading-relaxed">
                        Connect your wallet to see spending rules and payment requests in one chronological view.
                      </p>
                    </div>
                  ) : liveProposals.loading ? (
                    "Loading payments…"
                  ) : liveProposals.error ? (
                    "Payments could not be loaded. See the error above."
                  ) : (
                    filter === "Needs review" ? "No payments need your review." : filter === "Allowed" ? "No allowed payments yet." : filter === "Stopped" ? "No stopped payments." : "No activity yet. Create a spending rule to get started."
                  )}
                </div>
              ) : (
                activityItems.map((item, index) => (
                  <Link key={item.id} href={item.href} style={{ animationDelay: `${index * 30}ms` }} className="group flex gap-3 py-3.5 animate-fade-in">
                    <span className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${item.kind === "rule" ? "bg-accent dark:bg-[#46D9A4]" : item.status === "Waiting" || item.status === "Flagged" ? "bg-amber-500" : item.status === "Rejected" || item.status === "Cancelled" || item.status === "Vetoed" || item.status === "Expired" ? "bg-bad" : "bg-ink/60 dark:bg-white/60"}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="text-xs font-semibold text-ink dark:text-white group-hover:underline">{item.title}</span>
                        <span className="font-mono text-[10px] text-mute dark:text-dark-mute">{timeAgo(item.timestamp, now)}</span>
                      </span>
                      <span className="mt-1 block break-words text-[11px] leading-relaxed text-mute dark:text-dark-mute">{item.detail}</span>
                      <span className="mt-1 inline-flex rounded-full border border-line dark:border-dark-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-mute dark:text-dark-mute">{item.status}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}

function SetupStep({ done, title, href, action, onAction }: { done: boolean; title: string; href: string; action: string; onAction?: () => void }) {
  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-xl border border-line dark:border-dark-border bg-paper/50 dark:bg-dark-bg/40 p-3">
      <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-accent text-white" : "border border-line dark:border-dark-border text-mute dark:text-dark-mute"}`} aria-label={done ? "Complete" : "Not complete"}>{done ? "✓" : ""}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[11px] font-semibold ${done ? "text-mute dark:text-dark-mute line-through" : "text-ink dark:text-white"}`}>{title}</span>
        {done ? <span className="mt-0.5 block text-[10px] text-mute dark:text-dark-mute">Done</span> : onAction ? (
          <button type="button" onClick={onAction} className="mt-0.5 text-[10px] font-semibold text-accent dark:text-[#46D9A4] hover:underline">{action} →</button>
        ) : <Link href={href} className="mt-0.5 inline-block text-[10px] font-semibold text-accent dark:text-[#46D9A4] hover:underline">{action} →</Link>}
      </span>
    </li>
  );
}

function proposalStatusDetail(status: Proposal["status"]): string {
  switch (status) {
    case "Waiting": return "Paused for the owner review window";
    case "Flagged": return "Flagged for community review";
    case "Ready": return "Cleared by the mandate rules";
    case "Signing": return "Execution is in progress";
    case "Executed": return "Execution completed";
    case "Rejected": return "Stopped by a mandate rule";
    case "Cancelled": return "Cancelled";
    case "Vetoed": return "Vetoed by the owner";
    case "Expired": return "Review window expired";
  }
}
