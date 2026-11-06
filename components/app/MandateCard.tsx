"use client";

import Link from "next/link";
import { duration, formatNear, nsToMs, usdc } from "@/lib/format";
import type { Mandate } from "@/lib/types";
import { Card, Label, Pill } from "./ui";

export function MandateStatePill({ m, now }: { m: Mandate; now: number }) {
  if (m.state === "Revoked") return <Pill tone="bad">Stopped</Pill>;
  if (nsToMs(m.expires_at) <= now) return <Pill>Expired</Pill>;
  if (BigInt(m.bond_posted) < BigInt(m.bond))
    return <Pill tone="warn">Needs deposit</Pill>;
  return <Pill tone="ok">Active</Pill>;
}

/** Remaining daily budget, as a bar. */
export function Budget({ m }: { m: Mandate }) {
  const cap = BigInt(m.daily_cap);
  const spent = BigInt(m.spent_today);
  const pct =
    cap === BigInt(0) ? 0 : Number((spent * BigInt(1000)) / cap) / 10;
  return (
    <div>
      <div className="flex items-baseline justify-between text-ink dark:text-white">
        <span className="font-mono text-[15px] font-medium">{usdc(spent)}</span>
        <span className="text-[13px] text-mute dark:text-dark-mute">
          of {usdc(cap)} allowed today
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-paper dark:bg-dark-bg border border-line dark:border-dark-border"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily budget used"
      >
        <div
          className="h-full rounded-full bg-accent dark:bg-[#46D9A4] transition-all duration-300"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/** A plain-language view of the controls that decide whether a payment proceeds. */
export function MandatePolicySummary({ m }: { m: Mandate }) {
  const cap = BigInt(m.daily_cap);
  const spent = BigInt(m.spent_today);
  const remaining = cap > spent ? cap - spent : BigInt(0);
  const pct = cap === BigInt(0) ? 0 : Number((spent * BigInt(1000)) / cap) / 10;

  return (
    <div className="mt-4 rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-mute dark:text-dark-mute">Available today</span>
        <span className="font-mono text-[12px] font-semibold text-ink dark:text-white">{usdc(remaining)}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-dark-card border border-line dark:border-dark-border" role="progressbar" aria-valuenow={Math.min(100, Math.round(pct))} aria-valuemin={0} aria-valuemax={100} aria-label="Daily allowance used">
        <div className="h-full rounded-full bg-accent dark:bg-[#46D9A4]" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <p className="text-mute dark:text-dark-mute">Per payment</p>
          <p className="mt-0.5 font-mono font-medium text-ink dark:text-white">Up to {usdc(m.per_tx_cap)}</p>
        </div>
        <div>
          <p className="text-mute dark:text-dark-mute">Pause above</p>
          <p className="mt-0.5 font-mono font-medium text-ink dark:text-white">Above {usdc(m.cooling_threshold)}</p>
        </div>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-mute dark:text-dark-mute">
        Payments must go to an approved recipient. Requests above the threshold pause for the {duration(m.challenge_window_s)} review window.
      </p>
    </div>
  );
}

export function MandateCard({
  m,
  now,
  viewer,
  compact = false,
}: {
  m: Mandate;
  now: number;
  viewer: string;
  compact?: boolean;
}) {
  return (
    <Link href={`/app/mandates/${m.id}`} className="block group">
      <Card
        className={`${
          compact ? "p-4 sm:p-5 rounded-2xl" : "p-6 sm:p-7"
        } transition-all duration-200 hover:border-rule dark:hover:border-dark-mute hover:shadow-md`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label>Rule #{m.id}</Label>
            <p className="mt-1 font-mono text-[14.5px] sm:text-[15px] font-semibold text-ink dark:text-white truncate max-w-[200px] sm:max-w-[280px]">
              {m.agent}
            </p>
            <p className="text-[12px] text-mute dark:text-dark-mute">
              {viewer === m.owner ? "Your rule" : "Assigned to your agent"}
            </p>
          </div>
          <MandateStatePill m={m} now={now} />
        </div>

        <div className={compact ? "mt-3" : "mt-5"}>
          <MandatePolicySummary m={m} />
        </div>

        <dl
          className={`${
            compact ? "mt-3.5 pt-3 text-[12.5px]" : "mt-6 pt-4 text-[13.5px]"
          } grid grid-cols-3 gap-2 border-t border-line dark:border-dark-border`}
        >
          <div>
            <dt className="text-mute dark:text-dark-mute text-[11px]">Review delay</dt>
            <dd className="mt-0.5 font-mono font-medium text-ink dark:text-white">
              {duration(m.challenge_window_s)}
            </dd>
          </div>
        </dl>

        <p className={`${compact ? "mt-2.5 text-[11.5px]" : "mt-4 text-[12.5px]"} text-mute dark:text-dark-mute truncate`}>
          Deposit: {formatNear(m.bond_posted)} of {formatNear(m.bond)} •{" "}
          {m.chains.join(" + ")}
        </p>
      </Card>
    </Link>
  );
}
