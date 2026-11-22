import { formatUnits, unitOfAsset, yoctoToNearNumber } from "./format";
import type { Mandate, Proposal } from "./types";

export const DAY_MS = 86_400_000;
export type DayPoint = { t: number; v: number };

export const dayStart = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Sum values into one bucket per local day for the last `days` days (oldest first). */
export function bucketDaily(items: { ts: number; v: number }[], days: number, now = Date.now()): DayPoint[] {
  const start = dayStart(now) - (days - 1) * DAY_MS;
  const out: DayPoint[] = Array.from({ length: days }, (_, i) => ({ t: start + i * DAY_MS, v: 0 }));
  for (const it of items) {
    const idx = Math.round((dayStart(it.ts) - start) / DAY_MS);
    if (idx >= 0 && idx < days) out[idx].v += it.v;
  }
  return out;
}

/** Percent change of the last `days` against the `days` before them. Null when there is nothing to compare. */
export function windowChange(items: { ts: number; v: number }[], days = 30, now = Date.now()): number | null {
  const end = dayStart(now) + DAY_MS;
  const mid = end - days * DAY_MS;
  const from = mid - days * DAY_MS;
  let cur = 0;
  let prev = 0;
  for (const it of items) {
    if (it.ts >= mid && it.ts < end) cur += it.v;
    else if (it.ts >= from && it.ts < mid) prev += it.v;
  }
  if (prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

const ms = (ns: string) => Number(BigInt(ns) / 1_000_000n);

export const paymentEvents = (ps: Proposal[]) => ps.map((p) => ({ ts: ms(p.created_at), v: 1 }));
export const ruleEvents = (ms_: Mandate[]) => ms_.map((m) => ({ ts: ms(m.created_at), v: 1 }));

/** Money that actually left, by asset. Only payments that reached Executed count. */
export const volumeEvents = (ps: Proposal[], unit: "USDC" | "NEAR") =>
  ps
    .filter((p) => p.status === "Executed" && unitOfAsset(p.asset) === unit)
    .map((p) => ({
      ts: ms(p.created_at),
      v: unit === "NEAR" ? yoctoToNearNumber(p.amount) : Number(formatUnits(p.amount)),
    }));

export const sum = (xs: { v: number }[]) => xs.reduce((a, x) => a + x.v, 0);

export const STUCK_SIGNING_MS = 10 * 60_000;
export const proposalMs = (p: Proposal) => ms(p.created_at);
export const executableMs = (p: Proposal) => ms(p.executable_at);
