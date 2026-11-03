"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ProposalRow } from "@/components/app/ProposalRow";
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
import { timeAgo, usdc } from "@/lib/format";
import { useAccountBalance } from "@/hooks/useNearBalance";
import type { Proposal, Mandate } from "@/lib/types";

export default function Dashboard() {
  const { accountId, signIn, ready } = useWallet();
  const walletBalance = useAccountBalance(accountId);
  const now = useNow(5000);
  const liveMandates = useMyMandates();
  const liveProposals = useProposalsFor(liveMandates.data);

  const [filter, setFilter] = useState<string>("All");
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const isContractConfigured = Boolean(CONFIG.contractId);

  const displayMandates: Mandate[] = liveMandates.data ?? [];
  const displayProposals: Proposal[] = liveProposals.data ?? [];

  // Filtered proposals with smooth counts
  const filteredProposals = displayProposals.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Approved")
      return p.status === "Ready" || p.status === "Signing" || p.status === "Executed";
    if (filter === "Blocked")
      return p.status === "Rejected" || p.status === "Cancelled";
    if (filter === "Paused" || filter === "Waiting")
      return p.status === "Waiting" || p.status === "Flagged";
    return true;
  });

  const counts = {
    All: displayProposals.length,
    Approved: displayProposals.filter(
      (p) => p.status === "Ready" || p.status === "Signing" || p.status === "Executed"
    ).length,
    Paused: displayProposals.filter(
      (p) => p.status === "Waiting" || p.status === "Flagged"
    ).length,
    Blocked: displayProposals.filter(
      (p) => p.status === "Rejected" || p.status === "Cancelled"
    ).length,
  };

  const activeMandates = displayMandates.filter((m) => m.state === "Active");
  const needsDepositMandates = activeMandates.filter(
    (m) => BigInt(m.bond_posted) < BigInt(m.bond)
  );
  const readyMandates = activeMandates.filter(
    (m) => BigInt(m.bond_posted) >= BigInt(m.bond)
  );
  const mineToDecide = displayProposals.filter(
    (p) => p.status === "Waiting" || p.status === "Flagged"
  );
  const spent = activeMandates.reduce(
    (a, m) => a + BigInt(m.spent_today || "0"),
    BigInt(0)
  );
  const cap = activeMandates.reduce(
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
                <button type="button" onClick={() => setFilter("Paused")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line dark:border-dark-border px-3 py-2.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors">
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

      {/* Optional Slim Alert if any proposals require veto decision */}
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
            onClick={() => setFilter("Paused")}
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
            </div>
          </section>

        {/* Right Column: Live Stream Agent Payment Feed */}
        <section className="lg:col-span-7 flex flex-col min-w-0">
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 text-ink dark:text-dark-text shadow-sm flex flex-col min-w-0">
            {/* Feed Header with Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-line dark:border-dark-border">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
                  Live activity
                </span>
                <h2 className="text-base sm:text-[17px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
                  Recent agent payments
                </h2>
              </div>

              {/* Filter Pills with Count Badges */}
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs overflow-x-auto max-w-full">
                {(["All", "Approved", "Paused", "Blocked"] as const).map((tab) => {
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

            {/* Proposals Scrollable List */}
            <div className="max-h-[390px] overflow-y-auto divide-y divide-line dark:divide-dark-border -mx-4 sm:-mx-5 px-4 sm:px-5 scrollbar-thin">
              {filteredProposals.length === 0 ? (
                <div className="py-14 text-center text-xs text-mute dark:text-dark-mute max-w-sm mx-auto px-4">
                  {!accountId ? (
                    <div className="space-y-1.5">
                      <p className="font-semibold text-ink dark:text-white text-[13px]">
                        Live payment feed
                      </p>
                      <p className="leading-relaxed">
                        When your AI agents propose transactions to the contract, they stream here in real time with policy status badges and review actions.
                      </p>
                    </div>
                  ) : liveProposals.loading ? (
                    "Loading payments…"
                  ) : liveProposals.error ? (
                    "Payments could not be loaded. See the error above."
                  ) : (
                    "No payments requested yet."
                  )}
                </div>
              ) : (
                filteredProposals.map((p, index) => (
                  <div
                    key={`${filter}-${p.id}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className="animate-fade-in"
                  >
                    <ProposalRow p={p} now={now} showMandate compact />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
