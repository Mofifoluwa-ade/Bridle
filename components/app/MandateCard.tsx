"use client";

import Link from "next/link";
import { duration, formatNear, nsToMs, usdc } from "@/lib/format";
import type { Mandate } from "@/lib/types";
import { Card, Label, Pill } from "./ui";

export function MandateStatePill({ m, now }: { m: Mandate; now: number }) {
  if (m.state === "Revoked") return <Pill tone="bad">Revoked</Pill>;
  if (nsToMs(m.expires_at) <= now) return <Pill>Expired</Pill>;
  if (BigInt(m.bond_posted) < BigInt(m.bond))
    return <Pill tone="warn">Needs bond</Pill>;
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
          of {usdc(cap)} today
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
            <Label>Mandate {m.id}</Label>
            <p className="mt-1 font-mono text-[14.5px] sm:text-[15px] font-semibold text-ink dark:text-white truncate max-w-[200px] sm:max-w-[280px]">
              {m.agent}
            </p>
            <p className="text-[12px] text-mute dark:text-dark-mute">
              {viewer === m.owner ? "You own this" : "You are the agent"}
            </p>
          </div>
          <MandateStatePill m={m} now={now} />
        </div>

        <div className={compact ? "mt-3" : "mt-5"}>
          <Budget m={m} />
        </div>

        <dl
          className={`${
            compact ? "mt-3.5 pt-3 text-[12.5px]" : "mt-6 pt-4 text-[13.5px]"
          } grid grid-cols-3 gap-2 border-t border-line dark:border-dark-border`}
        >
          <div>
            <dt className="text-mute dark:text-dark-mute text-[11px]">Per payment</dt>
            <dd className="mt-0.5 font-mono font-medium text-ink dark:text-white">
              {usdc(m.per_tx_cap)}
            </dd>
          </div>
          <div>
            <dt className="text-mute dark:text-dark-mute text-[11px]">Pause above</dt>
            <dd className="mt-0.5 font-mono font-medium text-ink dark:text-white">
              {usdc(m.cooling_threshold)}
            </dd>
          </div>
          <div>
            <dt className="text-mute dark:text-dark-mute text-[11px]">Window</dt>
            <dd className="mt-0.5 font-mono font-medium text-ink dark:text-white">
              {duration(m.challenge_window_s)}
            </dd>
          </div>
        </dl>

        <p className={`${compact ? "mt-2.5 text-[11.5px]" : "mt-4 text-[12.5px]"} text-mute dark:text-dark-mute truncate`}>
          Bond {formatNear(m.bond_posted)} of {formatNear(m.bond)} •{" "}
          {m.chains.join(" + ")}
        </p>
      </Card>
    </Link>
  );
}
