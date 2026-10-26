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
import { ProposalDetailModal } from "@/components/app/ProposalDetailModal";
import {
  DEFAULT_MANDATE,
  INITIAL_PROPOSALS,
  generateAdversarialProposal,
} from "@/lib/mandate-engine";
import type { Proposal, Mandate } from "@/lib/types";

export default function Dashboard() {
  const { accountId, signIn, ready } = useWallet();
  const now = useNow(5000);
  const liveMandates = useMyMandates();
  const liveProposals = useProposalsFor(liveMandates.data);

  // Local state for interactive test proposals & stress testing
  // Demo mode is an opt-in developer switch to explore simulated data without contract
  const [demoMode, setDemoMode] = useState(false);
  const [localProposals, setLocalProposals] = useState<any[]>(INITIAL_PROPOSALS);
  const [filter, setFilter] = useState<string>("All");
  const [inspectProposal, setInspectProposal] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    try {
      setDemoMode(window.localStorage.getItem("bridle:developer-demo-mode") === "true");
    } catch {}
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const isContractConfigured = Boolean(CONFIG.contractId);

  // Fallback demo mandate formatted for MandateCard
  const fallbackMandates: Mandate[] = useMemo(() => [
    {
      id: 1,
      owner: accountId || "mofifoluwa.testnet",
      agent: "claude-executor-01.near",
      chains: ["Base", "Solana"],
      assets: ["USDC"],
      allowlist: [
        { chain: "Base", address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" },
        { chain: "Solana", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" },
      ],
      per_tx_cap: "25000000",
      daily_cap: "50000000",
      cooling_threshold: "20000000",
      challenge_window_s: 600,
      bond: "1000000000000000000000000",
      bond_posted: "1000000000000000000000000",
      expires_at: String((Date.now() + 86400000 * 14) * 1_000_000),
      state: "Active",
      day_index: 0,
      spent_today: "18000000",
      created_at: String((Date.now() - 3600000 * 24) * 1_000_000),
      pending_limits: null,
    },
  ], [accountId]);

  // Never silently replace missing/failed live data with sample data
  const displayMandates: Mandate[] = demoMode
    ? fallbackMandates
    : (liveMandates.data ?? []);

  const displayProposals: any[] = useMemo(() => {
    if (!demoMode) return liveProposals.data ?? [];
    // Demo-only: map local engine proposals to match the live Proposal format
    return localProposals.map((lp, idx) => ({
      id: idx + 1,
      mandate_id: 1,
      chain: lp.chain || "Base",
      asset: "USDC",
      amount: String(Math.round((lp.amount || 15) * 1_000_000)),
      recipient: lp.recipient || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      status:
        lp.state === "Approved" || lp.state === "Executed"
          ? "Ready"
          : lp.state === "Blocked"
          ? "Rejected"
          : lp.state === "Waiting"
          ? "Waiting"
          : lp.state === "Flagged"
          ? "Flagged"
          : "Cancelled",
      reason: lp.ruleCited || null,
      created_at: String((Date.now() - 60000 * (idx * 12 + 4)) * 1_000_000),
      executable_at: String((Date.now() + 600000) * 1_000_000),
      flagger: lp.state === "Flagged" ? "watcher-01.near" : null,
      flag_reason: lp.state === "Flagged" ? "Flagged for owner review" : null,
      flag_bond: "100000000000000000000000",
      tx_hash: lp.txHash || null,
      recipientLabel: lp.recipientLabel,
    }));
  }, [demoMode, liveProposals.data, localProposals]);

  // Stress test handler (local simulation)
  const handleStressTest = () => {
    if (!demoMode) {
      setDemoMode(true);
      try {
        localStorage.setItem("bridle:developer-demo-mode", "true");
      } catch {}
    }
    const attack = generateAdversarialProposal(DEFAULT_MANDATE);
    setLocalProposals((prev) => [attack, ...prev]);
    showNotification("Demo simulation: Prompt-injection attack blocked by policy engine!");
  };

  // Filtered proposals with smooth counts
  const filteredProposals = displayProposals.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Approved")
      return p.status === "Ready" || p.status === "Signing" || p.status === "Executed";
    if (filter === "Blocked")
      return p.status === "Rejected" || p.status === "Cancelled";
    if (filter === "Waiting")
      return p.status === "Waiting" || p.status === "Flagged";
    return true;
  });

  const counts = {
    All: displayProposals.length,
    Approved: displayProposals.filter(
      (p) => p.status === "Ready" || p.status === "Signing" || p.status === "Executed"
    ).length,
    Waiting: displayProposals.filter(
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
          <Notice tone="ok" title="Protocol alert">
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
            Active mandates and agent payment stream enforced on-chain
          </p>
        </div>
        <div className="flex items-center gap-2">
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              aria-pressed={demoMode}
              onClick={() => {
                const next = !demoMode;
                setDemoMode(next);
                try {
                  window.localStorage.setItem("bridle:developer-demo-mode", String(next));
                } catch {}
                setFilter("All");
                setLocalProposals(INITIAL_PROPOSALS);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                demoMode
                  ? "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
              }`}
              title="Developer-only switch: toggle between live contract data and simulated demo data"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${demoMode ? "bg-amber-500" : "bg-mute"}`} />
              <span>{demoMode ? "Demo mode: ON" : "Demo mode: OFF"}</span>
            </button>
          )}
          <button
            id="tour-stress-test-btn"
            type="button"
            onClick={handleStressTest}
            className="inline-flex items-center gap-1.5 rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card px-3.5 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover shadow-2xs transition-all"
            title="Simulate prompt-injection defense locally"
          >
            <span>Stress test defense</span>
          </button>
          <Link
            id="tour-new-mandate-btn"
            href="/app/mandates/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 shadow-sm transition-all"
          >
            <span>+</span>
            <span>New mandate</span>
          </Link>
        </div>
      </div>

      {/* Developer Demo & Live State Notices */}
      {process.env.NODE_ENV === "development" && demoMode && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-950 dark:text-amber-100">
          <strong>Developer demo mode:</strong> All sample mandates, proposals, spending figures, and stress-test results are simulated locally. Nothing here confirms on-chain state.
        </div>
      )}

      {!demoMode && !isContractConfigured && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white">
          <strong>Live data unavailable:</strong> No contract ID is configured in .env.local. Demo data is not being substituted automatically. Toggle <strong>Demo mode: ON</strong> above to preview with simulated data.
        </div>
      )}

      {!demoMode && isContractConfigured && liveMandates.error && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white flex items-center justify-between">
          <div>
            <strong>Could not load live mandates:</strong> {liveMandates.error}
          </div>
          <button type="button" onClick={liveMandates.refresh} className="underline text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {!demoMode && isContractConfigured && liveProposals.error && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs text-ink dark:text-white flex items-center justify-between">
          <div>
            <strong>Could not load live proposals:</strong> {liveProposals.error}
          </div>
          <button type="button" onClick={liveProposals.refresh} className="underline text-xs ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Top 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Active mandates"
          value={`${activeMandates.length} active`}
          sub={demoMode ? "Sample data · not on-chain" : `${displayMandates.length} registered on-chain`}
          badge={
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/20">
              {demoMode ? "Simulated" : "Enforced"}
            </span>
          }
        />
        <Stat
          label="Needs decision"
          value={mineToDecide.length}
          tone={mineToDecide.length > 0 ? "warn" : undefined}
          sub={
            mineToDecide.length > 0
              ? `${mineToDecide.length} in challenge window`
              : "Zero pending flags or vetoes"
          }
          badge={
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                mineToDecide.length > 0
                  ? "bg-warn-tint dark:bg-warn-tint/15 text-warn border-warn/20"
                  : "bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border-line dark:border-dark-border"
              }`}
            >
              {mineToDecide.length > 0 ? "Action required" : "Clear"}
            </span>
          }
        />
        <Stat
          label="Spent today (UTC)"
          value={usdc(spent)}
          sub={`of ${usdc(cap)} combined daily limit`}
          badge={
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border border-line dark:border-dark-border">
              Daily cap
            </span>
          }
        />
      </div>

      {/* Optional Slim Alert if any proposals require veto decision */}
      {mineToDecide.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-warn">Pending decision:</span>
            <span className="text-ink dark:text-white">
              {mineToDecide.length} proposal{mineToDecide.length > 1 ? "s" : ""} waiting in challenge window.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilter("Waiting")}
            className="font-medium text-warn underline text-xs hover:opacity-85"
          >
            Review waiting proposals →
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
                  Mandates
                </h2>
                <p className="text-[11.5px] text-mute dark:text-dark-mute">
                  Signing authority bounded by policy
                </p>
              </div>
              <Link
                href="/app/mandates/new"
                className="text-xs font-semibold text-accent dark:text-[#46D9A4] hover:underline"
              >
                + Create new
              </Link>
            </div>

            <div className="mt-3.5 space-y-3">
              {displayMandates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line dark:border-dark-border p-6 text-center text-xs text-mute dark:text-dark-mute">
                  {liveMandates.loading
                    ? "Loading mandates…"
                    : liveMandates.error
                    ? "Mandates could not be loaded. See the error above."
                    : "No mandates found for this wallet yet."}
                  {!liveMandates.loading && !liveMandates.error && isContractConfigured && (
                    <div className="mt-3">
                      <Link className="font-semibold text-accent dark:text-[#46D9A4] hover:underline" href="/app/mandates/new">
                        Create your first mandate →
                      </Link>
                    </div>
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
                  {demoMode ? "SIMULATED FEED" : "Live Stream"}
                </span>
                <h2 className="text-base sm:text-[17px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
                  Agent payment feed
                </h2>
              </div>

              {/* Filter Pills with Count Badges */}
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
                {(["All", "Approved", "Waiting", "Blocked"] as const).map((tab) => {
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
                  {demoMode
                    ? "No demo proposals match this filter."
                    : liveProposals.loading
                    ? "Loading proposals…"
                    : liveProposals.error
                    ? "Proposals could not be loaded. See the error above."
                    : "No proposals found for this mandate yet."}
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

      {/* Inspect Modal */}
      {inspectProposal && (
        <ProposalDetailModal
          proposal={inspectProposal}
          onClose={() => setInspectProposal(null)}
        />
      )}
    </div>
  );
}
