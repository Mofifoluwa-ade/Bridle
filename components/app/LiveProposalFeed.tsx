"use client";

import { useState } from "react";
import { Proposal, ProposalState, Mandate } from "@/types/mandate";

type LiveProposalFeedProps = {
  proposals: Proposal[];
  mandate: Mandate;
  onInspect: (proposal: Proposal) => void;
  onOwnerVeto: (id: string) => void;
  onWatcherFlag: (id: string) => void;
  onConfirmSlash: (id: string) => void;
  onDismissFlag: (id: string) => void;
};

const tone: Record<
  ProposalState,
  { bg: string; fg: string; dot: string; label: string }
> = {
  Approved: {
    bg: "bg-accent-tint border border-accent/20",
    fg: "text-accent",
    dot: "bg-accent",
    label: "Approved",
  },
  Blocked: {
    bg: "bg-bad-tint dark:bg-bad-tint/10 border border-bad/20",
    fg: "text-bad",
    dot: "bg-bad",
    label: "Blocked",
  },
  Waiting: {
    bg: "bg-warn-tint dark:bg-warn-tint/10 border border-warn/20",
    fg: "text-warn",
    dot: "bg-warn",
    label: "Waiting",
  },
  Flagged: {
    bg: "bg-paper dark:bg-white/10 border border-line dark:border-white/20",
    fg: "text-ink dark:text-white",
    dot: "bg-ink dark:bg-white",
    label: "Flagged",
  },
  Slashed: {
    bg: "bg-bad text-white",
    fg: "text-white",
    dot: "bg-white",
    label: "Slashed",
  },
  Executed: {
    bg: "bg-accent-tint border border-accent/20",
    fg: "text-accent",
    dot: "bg-accent",
    label: "Executed",
  },
  Cancelled: {
    bg: "bg-paper dark:bg-dark-border border border-line dark:border-dark-border",
    fg: "text-mute dark:text-dark-mute",
    dot: "bg-dim dark:bg-dark-dim",
    label: "Cancelled",
  },
};

function StatusIcon({ state }: { state: ProposalState }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (state === "Approved" || state === "Executed")
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );

  if (state === "Blocked" || state === "Slashed")
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    );

  if (state === "Waiting")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    );

  return (
    <svg {...common}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
    </svg>
  );
}

export function LiveProposalFeed({
  proposals,
  onInspect,
  onOwnerVeto,
  onWatcherFlag,
  onConfirmSlash,
  onDismissFlag,
}: LiveProposalFeedProps) {
  const [filter, setFilter] = useState<string>("All");

  const filtered = proposals.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Approved")
      return p.state === "Approved" || p.state === "Executed";
    if (filter === "Blocked") return p.state === "Blocked";
    if (filter === "Waiting")
      return p.state === "Waiting" || p.state === "Flagged";
    return true;
  });

  return (
    <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-line dark:border-dark-border">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Live Stream
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
            Agent payment feed
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
          {["All", "Approved", "Waiting", "Blocked"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                filter === tab
                  ? "bg-white dark:bg-dark-card text-ink dark:text-white font-semibold shadow-sm border border-line dark:border-dark-border"
                  : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal List */}
      <div className="divide-y divide-line dark:divide-dark-border">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-mute dark:text-dark-mute">
            Waiting for the agent.
          </div>
        ) : (
          filtered.map((item) => {
            const currentTone = tone[item.state] || tone.Approved;
            return (
              <div
                key={item.id}
                className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-paper/70 dark:hover:bg-dark-card-hover/50 -mx-3 px-3 rounded-2xl"
              >
                {/* Left: Status icon & Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full mt-0.5 ${currentTone.bg} ${currentTone.fg}`}
                  >
                    <StatusIcon state={item.state} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink dark:text-white">
                        {item.recipientLabel || "Payment transfer"}
                      </span>
                      <span className="rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border px-2 py-0.5 font-mono text-[10.5px] text-mute dark:text-dark-mute">
                        {item.chain}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${currentTone.bg} ${currentTone.fg}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${currentTone.dot}`}
                        />
                        {currentTone.label}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-mute dark:text-dark-mute leading-relaxed">
                      {item.ruleCited}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-dim dark:text-dark-dim">
                      <span className="truncate max-w-[200px] sm:max-w-[280px]">
                        To: {item.recipient}
                      </span>
                      <span>•</span>
                      <span>{item.createdAt}</span>
                      {item.explorerUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={item.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline hover:opacity-80"
                          >
                            View tx
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5">
                  <div
                    className={`font-mono text-base font-semibold ${
                      item.state === "Blocked"
                        ? "text-dim dark:text-dark-dim line-through"
                        : "text-ink dark:text-white"
                    }`}
                  >
                    ${item.amount.toFixed(2)}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.state === "Waiting" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOwnerVeto(item.id)}
                          className="rounded-full border border-bad/30 bg-bad-tint/50 dark:bg-bad-tint/10 px-2.5 py-1 text-xs font-semibold text-bad hover:bg-bad hover:text-white transition-colors"
                          title="Free owner veto"
                        >
                          Veto
                        </button>
                        <button
                          type="button"
                          onClick={() => onWatcherFlag(item.id)}
                          className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-2.5 py-1 text-xs font-medium text-ink dark:text-white hover:bg-line/40 dark:hover:bg-dark-card-hover transition-colors"
                          title="Post 0.1 NEAR bond to flag as watcher"
                        >
                          Flag
                        </button>
                      </>
                    )}

                    {item.state === "Flagged" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onConfirmSlash(item.id)}
                          className="rounded-full bg-bad px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                          title="Confirm flag and slash agent bond"
                        >
                          Confirm & slash
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissFlag(item.id)}
                          className="rounded-full border border-line dark:border-dark-border px-2.5 py-1 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                          title="Dismiss flag and forfeit watcher bond"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-2.5 py-1 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:border-rule dark:hover:border-dark-mute transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
