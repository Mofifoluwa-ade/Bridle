"use client";

import Link from "next/link";
import { nsToMs, shortAddr, timeAgo, usdc } from "@/lib/format";
import type { Proposal } from "@/lib/types";
import { STATUS, StatusPill } from "./ui";

const ICON: Record<string, { path: string; cls: string }> = {
  ok: {
    path: "M5 12.5l4.5 4.5L19 7.5",
    cls: "bg-[#E7F2EE] text-[#0A7C59] dark:bg-accent-tint dark:text-[#46D9A4]",
  },
  bad: {
    path: "M7 7l10 10M17 7L7 17",
    cls: "bg-[#FDECEA] text-[#B42318] dark:bg-bad-tint/15 dark:text-bad",
  },
  warn: {
    path: "M9 7v10M15 7v10",
    cls: "bg-[#FEF3E2] text-[#B54708] dark:bg-warn-tint/15 dark:text-warn",
  },
  neutral: {
    path: "M7 7l10 10M17 7L7 17",
    cls: "bg-paper text-mute dark:bg-dark-border dark:text-dark-mute",
  },
};

/** One decision, one row. Clean, readable, with brand status badge and smooth interaction. */
export function ProposalRow({
  p,
  now,
  showMandate = false,
  compact = false,
}: {
  p: Proposal;
  now: number;
  showMandate?: boolean;
  compact?: boolean;
}) {
  const s = STATUS[p.status];
  const icon = ICON[s.tone];
  const detail = p.status === "Rejected" && p.reason ? p.reason : s.line;

  if (compact) {
    return (
      <Link
        href={`/app/proposals/${p.id}`}
        className="group flex items-center justify-between gap-3 border-b border-line dark:border-dark-border px-4 py-3 last:border-b-0 hover:bg-paper/80 dark:hover:bg-dark-card-hover/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Compact circular status badge */}
          <span
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full shadow-2xs transition-transform group-hover:scale-105 ${icon.cls}`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={icon.path} />
            </svg>
          </span>

          {/* Content & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
                {s.label}
              </span>
              <span className="font-mono text-[11px] text-mute dark:text-dark-mute">
                #{p.id}
              </span>
              <span className="rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border px-1.5 py-0.2 font-mono text-[10px] text-mute dark:text-dark-mute">
                {p.chain}
              </span>
            </div>
            <p className="block truncate text-[12.5px] text-mute dark:text-dark-mute">
              {detail} • {shortAddr(p.recipient)}
            </p>
          </div>
        </div>

        {/* Right: Amount Display & Time */}
        <div className="text-right flex-none pl-2">
          <span
            className={`block font-mono text-[15.5px] font-semibold tracking-tight ${
              p.status === "Rejected" || p.status === "Cancelled"
                ? "text-dim dark:text-dark-dim line-through"
                : "text-ink dark:text-white"
            }`}
          >
            {usdc(p.amount)}
          </span>
          <span className="block text-[11px] text-mute dark:text-dark-mute">
            {timeAgo(nsToMs(p.created_at), now)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/app/proposals/${p.id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line dark:border-dark-border px-5 py-4 sm:py-4.5 last:border-b-0 hover:bg-paper/70 dark:hover:bg-dark-card-hover/40 transition-all duration-200"
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Soft, spacious circular status badge */}
        <span
          className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-full mt-0.5 shadow-2xs transition-transform group-hover:scale-105 ${icon.cls}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d={icon.path} />
          </svg>
        </span>

        {/* Content & Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15.5px] sm:text-[16px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
              {s.label}
            </span>
            <span className="font-mono text-[11.5px] text-mute dark:text-dark-mute">
              #{p.id}
              {showMandate && ` • Rule #${p.mandate_id}`}
            </span>
            <span className="rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border px-2 py-0.5 font-mono text-[10.5px] text-mute dark:text-dark-mute sm:hidden">
              {p.chain}
            </span>
          </div>
          <p className="mt-0.5 block truncate text-[13px] sm:text-[13.5px] text-mute dark:text-dark-mute leading-relaxed">
            {detail} • to {shortAddr(p.recipient)}
          </p>
        </div>
      </div>

      {/* Right: Chain chip & Amount Display */}
      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 flex-none pl-14 sm:pl-0">
        <span className="hidden sm:inline-block rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border px-2 py-0.5 font-mono text-[11px] text-mute dark:text-dark-mute">
          {p.chain}
        </span>
        <div className="text-right">
          <span
            className={`block font-mono text-[17px] sm:text-[18px] font-semibold tracking-tight ${
              p.status === "Rejected" || p.status === "Cancelled"
                ? "text-dim dark:text-dark-dim line-through"
                : "text-ink dark:text-white"
            }`}
          >
            {usdc(p.amount)}
          </span>
          <span className="block text-[11.5px] text-mute dark:text-dark-mute">
            {timeAgo(nsToMs(p.created_at), now)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export { StatusPill };
