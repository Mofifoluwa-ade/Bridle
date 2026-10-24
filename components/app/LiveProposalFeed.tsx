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

// Status styling matching official brand guide preview (2).webp
const statusStyle: Record<
  ProposalState,
  {
    iconBg: string;
    iconFg: string;
    pillBg: string;
    pillFg: string;
    pillDot: string;
    label: string;
  }
> = {
  Approved: {
    iconBg: "bg-[#E7F2EE] dark:bg-accent-tint",
    iconFg: "text-[#0A7C59] dark:text-[#46D9A4]",
    pillBg: "bg-accent-tint border border-accent/20",
    pillFg: "text-accent dark:text-[#46D9A4]",
    pillDot: "bg-accent dark:bg-[#46D9A4]",
    label: "Approved",
  },
  Executed: {
    iconBg: "bg-[#E7F2EE] dark:bg-accent-tint",
    iconFg: "text-[#0A7C59] dark:text-[#46D9A4]",
    pillBg: "bg-accent-tint border border-accent/20",
    pillFg: "text-accent dark:text-[#46D9A4]",
    pillDot: "bg-accent dark:bg-[#46D9A4]",
    label: "Executed",
  },
  Blocked: {
    iconBg: "bg-[#FDECEA] dark:bg-bad-tint/15",
    iconFg: "text-[#B42318] dark:text-bad",
    pillBg: "bg-bad-tint dark:bg-bad-tint/10 border border-bad/20",
    pillFg: "text-bad",
    pillDot: "bg-bad",
    label: "Blocked",
  },
  Waiting: {
    iconBg: "bg-[#FEF3E2] dark:bg-warn-tint/15",
    iconFg: "text-[#B54708] dark:text-warn",
    pillBg: "bg-warn-tint dark:bg-warn-tint/10 border border-warn/20",
    pillFg: "text-warn",
    pillDot: "bg-warn",
    label: "Waiting",
  },
  Flagged: {
    iconBg: "bg-paper dark:bg-white/10",
    iconFg: "text-ink dark:text-white",
    pillBg: "bg-paper dark:bg-white/10 border border-line dark:border-white/20",
    pillFg: "text-ink dark:text-white",
    pillDot: "bg-ink dark:bg-white",
    label: "Flagged",
  },
  Slashed: {
    iconBg: "bg-bad text-white",
    iconFg: "text-white",
    pillBg: "bg-bad text-white",
    pillFg: "text-white",
    pillDot: "bg-white",
    label: "Slashed",
  },
  Cancelled: {
    iconBg: "bg-[#E3E6EB] dark:bg-white/10",
    iconFg: "text-[#5B6470] dark:text-dark-mute",
    pillBg: "bg-paper dark:bg-dark-border border border-line dark:border-dark-border",
    pillFg: "text-mute dark:text-dark-mute",
    pillDot: "bg-dim dark:bg-dark-dim",
    label: "Vetoed",
  },
};

// Icon components strictly matching preview (2).webp
function DecisionIcon({ state }: { state: ProposalState }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (state === "Approved" || state === "Executed") {
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }

  if (state === "Blocked" || state === "Slashed") {
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    );
  }

  if (state === "Waiting" || state === "Flagged") {
    return (
      <svg {...common}>
        <path d="M9 7v10M15 7v10" />
      </svg>
    );
  }

  // Cancelled / Vetoed
  return (
    <svg {...common}>
      <path d="M7 7l10 10M17 7L7 17" />
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

  const counts = {
    All: proposals.length,
    Approved: proposals.filter(
      (p) => p.state === "Approved" || p.state === "Executed"
    ).length,
    Waiting: proposals.filter(
      (p) => p.state === "Waiting" || p.state === "Flagged"
    ).length,
    Blocked: proposals.filter((p) => p.state === "Blocked").length,
  };

  return (
    <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 text-ink dark:text-dark-text shadow-sm transition-colors">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line dark:border-dark-border">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Live Stream
          </span>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-ink dark:text-white mt-0.5">
            Agent payment feed
          </h2>
        </div>

        {/* Filter Pills with smooth selection */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
          {(["All", "Approved", "Waiting", "Blocked"] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white dark:bg-dark-card text-ink dark:text-white font-semibold shadow-sm border border-line dark:border-dark-border"
                    : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`font-mono text-[10.5px] px-1.5 py-0.2 rounded-full ${
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

      {/* Spacious Proposal Feed List */}
      <div className="divide-y divide-line dark:divide-dark-border">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-mute dark:text-dark-mute">
            No proposals match the current filter.
          </div>
        ) : (
          filtered.map((item, index) => {
            const style = statusStyle[item.state] || statusStyle.Approved;
            return (
              <div
                key={`${filter}-${item.id}`}
                style={{ animationDelay: `${index * 35}ms` }}
                className="animate-fade-in py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-200 hover:bg-paper/50 dark:hover:bg-dark-card-hover/40 -mx-4 px-4 rounded-2xl group"
              >
                {/* Left: Status Icon & Body Details */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Status Circle Icon (Spacious & Soft, matching preview (2).webp) */}
                  <div
                    className={`flex h-11 w-11 sm:h-12 sm:w-12 flex-none items-center justify-center rounded-full mt-0.5 transition-transform group-hover:scale-105 shadow-2xs ${style.iconBg} ${style.iconFg}`}
                  >
                    <DecisionIcon state={item.state} />
                  </div>

                  {/* Text Information */}
                  <div className="min-w-0 flex-1">
                    {/* Title, Chain Badge & Status Pill */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base sm:text-[17px] font-semibold text-ink dark:text-white leading-tight">
                        {item.recipientLabel || "Payment transfer"}
                      </h3>

                      <span className="rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border px-2.5 py-0.5 font-mono text-[11px] text-mute dark:text-dark-mute">
                        {item.chain}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.pillBg} ${style.pillFg}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${style.pillDot}`}
                        />
                        {style.label}
                      </span>
                    </div>

                    {/* Rule Citation Subtitle */}
                    <p className="mt-1.5 text-xs sm:text-[13px] text-mute dark:text-dark-mute leading-relaxed">
                      {item.ruleCited}
                    </p>

                    {/* Telemetry / Destination Metadata */}
                    <div className="mt-2 flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-dim dark:text-dark-dim">
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
                            className="text-accent underline hover:opacity-80 transition-opacity"
                          >
                            View tx
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions (Well-spaced layout) */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 flex-none pl-2 sm:pl-0">
                  {/* Amount Display in JetBrains Mono font */}
                  <div
                    className={`font-mono text-xl sm:text-2xl font-semibold tracking-tight ${
                      item.state === "Blocked"
                        ? "text-dim dark:text-dark-dim line-through"
                        : "text-ink dark:text-white"
                    }`}
                  >
                    ${item.amount.toFixed(2)}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2">
                    {item.state === "Waiting" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOwnerVeto(item.id)}
                          className="rounded-full border border-bad/30 bg-bad-tint/60 dark:bg-bad-tint/15 px-3 py-1 text-xs font-semibold text-bad hover:bg-bad hover:text-white transition-colors shadow-2xs"
                          title="Free owner veto during challenge window"
                        >
                          Veto
                        </button>
                        <button
                          type="button"
                          onClick={() => onWatcherFlag(item.id)}
                          className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-1 text-xs font-medium text-ink dark:text-white hover:bg-line/40 dark:hover:bg-dark-card-hover transition-colors shadow-2xs"
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
                          className="rounded-full bg-bad px-3.5 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm"
                          title="Confirm flag and slash agent bond"
                        >
                          Confirm & slash
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissFlag(item.id)}
                          className="rounded-full border border-line dark:border-dark-border px-3 py-1 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
                          title="Dismiss flag and forfeit watcher bond"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3.5 py-1 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:border-rule dark:hover:border-dark-mute transition-all shadow-2xs"
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
