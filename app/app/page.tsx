"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { MandateCard } from "@/components/app/MandateCard";
import { ProposalRow } from "@/components/app/ProposalRow";
import {
  Card,
  Empty,
  LinkBtn,
  Notice,
  PageHeader,
  Skeleton,
  Stat,
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
        <div className="flex items-center gap-2">
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

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {accountId ? (
          <Stat
            label="Wallet balance"
            value={walletBalance.loading ? "Loading…" : walletBalance.usd}
            sub={
              walletBalance.loading
                ? "Checking balance…"
                : walletBalance.near === 0
                ? "0.00 NEAR · Get free test tokens from testnet faucet"
                : `${walletBalance.near} NEAR (test tokens) · $${walletBalance.price.toFixed(2)}/NEAR`
            }
            badge={
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border border-line dark:border-dark-border truncate max-w-[100px]"
                title={accountId}
              >
                {accountId}
              </span>
            }
          />
        ) : (
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
                  Wallet balance
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border border-line dark:border-dark-border">
                  Disconnected
                </span>
              </div>
              <div className="mt-1.5 text-xs text-mute dark:text-dark-mute">
                Connect your NEAR wallet to see your balance and spending rules.
              </div>
            </div>
            <div className="mt-3">
              <Btn size="sm" onClick={signIn} disabled={!ready} className="w-full">
                {ready ? "Connect wallet" : "Loading wallet…"}
              </Btn>
            </div>
          </div>
        )}
        <Stat
          label="Active rules"
          value={`${activeMandates.length} active`}
          sub={accountId ? `${displayMandates.length} rules created` : "Connect wallet to view"}
          badge={
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/20">
              Active
            </span>
          }
        />
        <Stat
          label="Needs review"
          value={mineToDecide.length}
          tone={mineToDecide.length > 0 ? "warn" : undefined}
          sub={
            mineToDecide.length > 0
              ? `${mineToDecide.length} waiting for your review`
              : "No payments waiting for review"
          }
          badge={
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                mineToDecide.length > 0
                  ? "bg-warn-tint dark:bg-warn-tint/15 text-warn border-warn/20"
                  : "bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border-line dark:border-dark-border"
              }`}
            >
              {mineToDecide.length > 0 ? "Review now" : "All clear"}
            </span>
          }
        />
        <Stat
          label="Spent today"
          value={usdc(spent)}
          sub={`of ${usdc(cap)} allowed per day`}
          badge={
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border border-line dark:border-dark-border">
              Daily limit
            </span>
          }
        />
      </div>

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
        <section className="lg:col-span-5 flex flex-col gap-3">
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 text-ink dark:text-dark-text shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-line dark:border-dark-border">
              <div>
                <h2 className="text-base sm:text-[17px] font-semibold text-ink dark:text-white">
                  Spending rules
                </h2>
                <p className="text-[11.5px] text-mute dark:text-dark-mute">
                  Limits and controls for your AI agents
                </p>
              </div>
              <Link
                href="/app/mandates/new"
                className="text-xs font-semibold text-accent dark:text-[#46D9A4] hover:underline"
              >
                + Add rule
              </Link>
            </div>

            <div className="mt-3.5 space-y-3">
              {displayMandates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line dark:border-dark-border p-6 text-center text-xs text-mute dark:text-dark-mute">
                  {!accountId ? (
                    <div className="space-y-3">
                      <p>Connect your NEAR wallet to view and manage your spending rules.</p>
                      <Btn size="sm" onClick={signIn} disabled={!ready}>
                        {ready ? "Connect wallet" : "Loading wallet…"}
                      </Btn>
                    </div>
                  ) : liveMandates.loading ? (
                    "Loading spending rules…"
                  ) : liveMandates.error ? (
                    "Spending rules could not be loaded. See the error above."
                  ) : (
                    <>
                      <p>No spending rules found for {accountId} yet.</p>
                      {isContractConfigured && (
                        <div className="mt-3">
                          <Link className="font-semibold text-accent dark:text-[#46D9A4] hover:underline" href="/app/mandates/new">
                            Create your first spending rule →
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                displayMandates.map((m) => (
                  <MandateCard
                    key={m.id}
                    m={m}
                    now={now}
                    viewer={accountId || m.owner}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Live Stream Agent Payment Feed */}
        <section className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 text-ink dark:text-dark-text shadow-sm flex flex-col">
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
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
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
                <div className="py-12 text-center text-xs text-mute dark:text-dark-mute">
                  {!accountId
                    ? "Connect your wallet to see payments made by your AI agents."
                    : liveProposals.loading
                    ? "Loading payments…"
                    : liveProposals.error
                    ? "Payments could not be loaded. See the error above."
                    : "No payments requested yet."}
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
