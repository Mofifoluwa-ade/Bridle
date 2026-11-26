"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AreaChart, ChartNote, Funnel, StackedBars } from "@/components/app/charts";
import { Card, Empty, Label, PageHeader, Skeleton, StatusPill } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { usePoll } from "@/hooks/usePoll";
import {
  STUCK_SIGNING_MS,
  bucketDaily,
  cumulativeDaily,
  outcomeBuckets,
  executableMs,
  paymentEvents,
  proposalMs,
  ruleEvents,
  sum,
  volumeEvents,
  windowChange,
} from "@/lib/adminStats";
import { CONFIG } from "@/lib/config";
import { amountOf, formatNear, shortAddr, timeAgo } from "@/lib/format";
import { api, contractBalance } from "@/lib/near";
import { fetchStats, trackingConfigured, type DailyRow, type TrackEvent } from "@/lib/track";
import { DAY_MS, dayStart, type DayPoint } from "@/lib/adminStats";
import type { Mandate, Proposal, ProposalStatus } from "@/lib/types";

const MAX_PROPOSALS = 1000;
const MAX_MANDATES = 300;

async function loadAll() {
  const counts = await api.counts();
  const proposals: Proposal[] = [];
  for (let from = 0; from < Math.min(counts.proposals, MAX_PROPOSALS); from += 100) {
    const page = await api.proposalsPage(from, 100);
    proposals.push(...page);
    if (page.length < 100) break;
  }
  const ids = Array.from({ length: Math.min(counts.mandates, MAX_MANDATES) }, (_, i) => counts.mandates - i);
  const mandates: Mandate[] = [];
  for (let i = 0; i < ids.length; i += 20) {
    const got = await Promise.all(ids.slice(i, i + 20).map((id) => api.mandate(id).catch(() => null)));
    mandates.push(...got.filter((m): m is Mandate => !!m));
  }
  const [config, balance] = await Promise.all([api.config().catch(() => null), contractBalance().catch(() => null)]);
  return { counts, proposals, mandates, config, balance, truncated: counts.proposals > MAX_PROPOSALS };
}

export default function Admin() {
  const { accountId, ready } = useWallet();
  // Everyone except the contract account gets the ordinary 404, as if the page did not exist.
  // Wait for the wallet to finish restoring first so the owner is not turned away on a slow load.
  if (ready && accountId !== CONFIG.contractId) notFound();
  if (!ready) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[340px]" />
        ))}
      </div>
    );
  }
  return (
    <>
      <PageHeader title="Monitor" lead="How Bridle is doing on-chain: activity, money moved, and anything that needs attention." />
      <Body />
    </>
  );
}

function Body() {
  const live = usePoll("admin", loadAll, 30_000);
  const d = live.data;
  if (!d) {
    return live.error ? (
      <Card className="p-5 sm:p-6">
        <Empty title="Could not load">{live.error}</Empty>
      </Card>
    ) : (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[340px]" />
        ))}
      </div>
    );
  }

  const now = Date.now();
  const pay = paymentEvents(d.proposals);
  const usdc = volumeEvents(d.proposals, "USDC");
  const nearVol = volumeEvents(d.proposals, "NEAR");
  const rules = ruleEvents(d.mandates);
  const activeRules = d.mandates.filter((m) => m.state === "Active" && BigInt(m.expires_at) / 1_000_000n > BigInt(now)).length;
  const executed = d.proposals.filter((p) => p.status === "Executed").length;
  const blocked = d.proposals.filter((p) => p.status === "Rejected").length;
  const revoked = d.mandates.filter((m) => m.state === "Revoked").length;

  const stuck = d.proposals.filter((p) => p.status === "Signing" && now - executableMs(p) > STUCK_SIGNING_MS);
  const waiting = d.proposals.filter((p) => p.status === "Waiting" || p.status === "Ready").length;
  const flagged = d.proposals.filter((p) => p.status === "Flagged").length;

  const money = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(v % 1 ? 2 : 0)}`);
  const count = (v: number) => String(Math.round(v));

  const byStatus = new Map<ProposalStatus, { n: number; last: number }>();
  for (const p of d.proposals) {
    const cur = byStatus.get(p.status) ?? { n: 0, last: 0 };
    byStatus.set(p.status, { n: cur.n + 1, last: Math.max(cur.last, proposalMs(p)) });
  }
  const statusRows = [...byStatus.entries()].sort((a, b) => b[1].n - a[1].n);
  const biggest = Math.max(1, ...statusRows.map(([, v]) => v.n));

  return (
    <div className="space-y-5">
      {d.truncated && (
        <p className="text-xs text-mute dark:text-dark-mute">Showing the newest {MAX_PROPOSALS} of {d.counts.proposals} payments.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          title="Payments"
          sub="Requested, last 30 days"
          change={windowChange(pay)}
          chart={
            <StackedBars
              data={outcomeBuckets(d.proposals, 30)}
              series={[
                { label: "Sent", dot: "bg-accent dark:bg-accent-dark", bar: "bg-accent dark:bg-accent-dark" },
                { label: "Blocked", dot: "bg-bad", bar: "bg-bad" },
                { label: "In progress", dot: "bg-[#E5A93C]", bar: "bg-[#E5A93C]" },
                { label: "Stopped", dot: "bg-dim dark:bg-dark-dim", bar: "bg-dim dark:bg-dark-dim" },
              ]}
            />
          }
          stats={[
            ["Since launch", String(d.counts.proposals)],
            ["Sent", String(executed)],
            ["Blocked by rules", String(blocked)],
            ["Last 30 days", String(sum(bucketDaily(pay, 30)))],
          ]}
        />
        <StatCard
          title="Money moved"
          sub="USDC sent, running total"
          change={windowChange(usdc)}
          chart={
            <AreaChart
              series={[{ label: "Total sent", data: cumulativeDaily(usdc, 30), color: "text-accent dark:text-accent-dark", dot: "bg-accent dark:bg-accent-dark" }]}
              format={money}
              extra={(i) => {
                const day = bucketDaily(usdc, 30)[i].v;
                return day > 0 ? { label: "That day", value: money(day) } : null;
              }}
            />
          }
          stats={[
            ["USDC since launch", money(sum(usdc))],
            ["NEAR sent", `${sum(nearVol).toFixed(2)} Ⓝ`],
            ["Largest payment", money(usdc.reduce((m, x) => Math.max(m, x.v), 0))],
            ["Average payment", usdc.length ? money(sum(usdc) / usdc.length) : "$0"],
          ]}
        />
        <StatCard
          title="Rules"
          sub="Created, running total"
          change={windowChange(rules)}
          chart={
            <AreaChart
              step
              series={[{ label: "Rules created", data: cumulativeDaily(rules, 30), color: "text-ink dark:text-white", dot: "bg-ink dark:bg-white" }]}
              format={count}
              extra={(i) => {
                const day = bucketDaily(rules, 30)[i].v;
                return day > 0 ? { label: "New that day", value: String(day) } : null;
              }}
            />
          }
          stats={[
            ["Since launch", String(d.counts.mandates)],
            ["Active now", String(activeRules)],
            ["Revoked", String(revoked)],
            ["Last 30 days", String(sum(bucketDaily(rules, 30)))],
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-5 sm:p-6">
          <Label>Needs attention</Label>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Tile label="Stuck signing" value={stuck.length} bad={stuck.length > 0} />
            <Tile label="Held for review" value={waiting} />
            <Tile label="Flagged" value={flagged} bad={flagged > 0} />
          </div>
          {stuck.length > 0 ? (
            <ul className="mt-4 divide-y divide-line dark:divide-dark-border">
              {stuck.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                  <Link href={`/app/proposals/${p.id}`} className="font-medium text-ink hover:underline dark:text-white">
                    Payment #{p.id} · {amountOf(p)}
                  </Link>
                  <span className="text-mute dark:text-dark-mute">waiting {timeAgo(executableMs(p), now).replace(" ago", "")} · run the executor</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[14px] text-mute dark:text-dark-mute">Nothing is stuck. Every payment past its review window has been signed.</p>
          )}
        </Card>

        <Card className="lg:col-span-2 p-5 sm:p-6">
          <Label>Contract</Label>
          <dl className="mt-4 space-y-3 text-[14px]">
            <Row k="Account">{CONFIG.contractId}</Row>
            <Row k="Balance">{d.balance ? formatNear(d.balance) : "unavailable"}</Row>
            <Row k="Executor">{d.config ? shortAddr(d.config.executor, 10, 6) : "unavailable"}</Row>
            <Row k="Flag bond">{d.config ? `1/${d.config.flag_bond_divisor} of the cap` : "unavailable"}</Row>
          </dl>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2 p-5 sm:p-6">
          <Label>Payments by outcome</Label>
          <ul className="mt-4 space-y-4">
            {statusRows.map(([status, v]) => (
              <li key={status}>
                <div className="flex items-center justify-between gap-3">
                  <StatusPill status={status} />
                  <span className="font-mono text-[13px] text-mute dark:text-dark-mute">
                    {v.n} · {timeAgo(v.last, now)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-line/70 dark:bg-dark-border">
                  <div className="h-full rounded-full bg-accent dark:bg-accent-dark" style={{ width: `${(v.n / biggest) * 100}%` }} />
                </div>
              </li>
            ))}
            {statusRows.length === 0 && <li className="text-[14px] text-mute dark:text-dark-mute">No payments yet.</li>}
          </ul>
        </Card>

        <Card className="lg:col-span-3 p-5 sm:p-6">
          <Label>Latest payments</Label>
          <ul className="mt-3 divide-y divide-line dark:divide-dark-border">
            {d.proposals.slice(0, 12).map((p) => (
              <li key={p.id}>
                <Link href={`/app/proposals/${p.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <span className="min-w-0">
                    <span className="block text-[14.5px] font-medium text-ink dark:text-white">
                      {amountOf(p)} · Rule #{p.mandate_id}
                    </span>
                    <span className="block truncate font-mono text-[12px] text-mute dark:text-dark-mute">
                      {p.chain} · {shortAddr(p.recipient, 10, 6)} · {timeAgo(proposalMs(p), now)}
                    </span>
                  </span>
                  <span className="flex-none">
                    <StatusPill status={p.status} />
                  </span>
                </Link>
              </li>
            ))}
            {d.proposals.length === 0 && <li className="py-3 text-[14px] text-mute dark:text-dark-mute">No payments yet.</li>}
          </ul>
        </Card>
      </div>

      <Visitors />

      <p className="text-xs text-mute dark:text-dark-mute">
        Refreshes every 30 seconds. Chain numbers come from public contract data. For stuck payments, run the executor (<span className="font-mono">npm run once</span> in <span className="font-mono">executor/</span>).
      </p>
    </div>
  );
}

function StatCard({
  title,
  sub,
  change,
  chart,
  stats,
}: {
  title: string;
  sub: string;
  change: number | null;
  chart: ReactNode;
  stats: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-line bg-gradient-to-b from-accent-tint/70 via-white to-white p-5 shadow-xs dark:border-dark-border dark:from-accent-tint/10 dark:via-dark-card dark:to-dark-card sm:p-6">
      <h2 className="text-[17px] font-semibold text-ink dark:text-white">{title}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-mute dark:text-dark-mute">
        {sub}
        {change !== null && (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[12px] font-semibold ${
              change >= 0 ? "bg-accent-tint text-accent dark:bg-accent-tint/15 dark:text-accent-dark" : "bg-red-50 text-bad dark:bg-red-500/10"
            }`}
          >
            {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-5">{chart}</div>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
        {stats.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">{k}</p>
            <p className="mt-1 truncate text-[24px] font-light tracking-tight text-ink dark:text-white">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3.5 ${bad ? "border-bad/30 bg-red-50 dark:bg-red-500/10" : "border-line bg-paper/60 dark:border-dark-border dark:bg-dark-bg/60"}`}>
      <p className="font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">{label}</p>
      <p className={`mt-1 text-[28px] font-semibold ${bad ? "text-bad" : "text-ink dark:text-white"}`}>{value}</p>
    </div>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex-none text-mute dark:text-dark-mute">{k}</dt>
      <dd className="min-w-0 text-right font-mono text-[13px] text-ink dark:text-white [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

type VisitEvent = TrackEvent;

const seriesFor = (rows: DailyRow[], event: VisitEvent, days: number): DayPoint[] => {
  // The database counts in UTC days; line them up with the local days the chain charts use.
  const end = dayStart(Date.now());
  const start = end - (days - 1) * DAY_MS;
  const out: DayPoint[] = Array.from({ length: days }, (_, i) => ({ t: start + i * DAY_MS, v: 0 }));
  for (const r of rows) {
    if (r.event !== event) continue;
    const idx = Math.round((new Date(`${r.day}T12:00:00`).getTime() - start) / DAY_MS);
    if (idx >= 0 && idx < days) out[idx].v += r.n;
  }
  return out;
};

const totalOf = (s: DayPoint[]) => s.reduce((a, x) => a + x.v, 0);

function Visitors() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState<DailyRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setErr(null);
    try {
      setRows(await fetchStats(t, 30));
      try {
        localStorage.setItem("bridle_admin_pass", t);
      } catch {}
    } catch (e) {
      setRows(null);
      setErr(e instanceof Error ? e.message : "Could not load");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bridle_admin_pass");
      if (saved) {
        setToken(saved);
        void load(saved);
      }
    } catch {}
  }, [load]);

  if (!trackingConfigured) {
    return (
      <Card className="p-5 sm:p-6">
        <Label>Visitors</Label>
        <p className="mt-3 text-[14px] text-mute dark:text-dark-mute">
          Visitor counting is off. Set <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> and <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in Vercel and redeploy.
        </p>
      </Card>
    );
  }

  if (!rows) {
    return (
      <Card className="p-5 sm:p-6">
        <Label>Visitors</Label>
        <p className="mt-3 text-[14px] text-mute dark:text-dark-mute">
          Anonymous daily counts of visits, wallet connects and MCP calls. Enter your owner passphrase to view them.
        </p>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (token) void load(token);
          }}
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Owner passphrase"
            aria-label="Owner passphrase"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink focus:border-ink focus:outline-none dark:border-dark-border dark:bg-dark-card dark:text-white"
          />
          <button type="submit" disabled={!token || busy} className="h-11 rounded-xl bg-ink px-5 text-[14px] font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-ink">
            {busy ? "Checking…" : "Show visitors"}
          </button>
        </form>
        {err && <p className="mt-2 text-[13px] text-bad">{err}</p>}
      </Card>
    );
  }

  // Counting only began on the first day that has a row, so don't draw 30 days of nothing before it.
  const firstDay = rows.length ? rows.reduce((m, r) => (r.day < m ? r.day : m), rows[0].day) : null;
  const sinceDays = firstDay ? Math.round((dayStart(Date.now()) - new Date(`${firstDay}T12:00:00`).getTime()) / DAY_MS) + 1 : 1;
  const days = Math.min(30, Math.max(7, sinceDays));
  const site = seriesFor(rows, "site_view", days);
  const app = seriesFor(rows, "app_view", days);
  const wallet = seriesFor(rows, "wallet_connect", days);
  const authorize = seriesFor(rows, "authorize_open", days);
  const mcp = seriesFor(rows, "mcp_call", days);
  const last7 = (s: DayPoint[]) => totalOf(s.slice(-7));
  const best = site.reduce((m, x) => (x.v > m.v ? x : m), site[0]);
  const siteChange = days >= 14 ? halfChange(site) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-gradient-to-b from-accent-tint/70 via-white to-white p-5 shadow-xs dark:border-dark-border dark:from-accent-tint/10 dark:via-dark-card dark:to-dark-card sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[17px] font-semibold text-ink dark:text-white">Traffic</h2>
              <p className="mt-1 text-[14px] text-mute dark:text-dark-mute">Page loads, last {days} days</p>
            </div>
            {siteChange !== null && (
              <span className={`rounded-full px-2 py-0.5 font-mono text-[12px] font-semibold ${siteChange >= 0 ? "bg-accent-tint text-accent dark:bg-accent-tint/15 dark:text-accent-dark" : "bg-red-50 text-bad dark:bg-red-500/10"}`}>
                {siteChange >= 0 ? "↑" : "↓"} {Math.abs(siteChange).toFixed(1)}% vs earlier half
              </span>
            )}
          </div>
          <div className="mt-5">
            <AreaChart
              height={190}
              format={(v) => String(Math.round(v))}
              series={[
                { label: "Site", data: site, color: "text-ink dark:text-white", dot: "bg-ink dark:bg-white" },
                { label: "App", data: app, color: "text-accent dark:text-accent-dark", dot: "bg-accent dark:bg-accent-dark" },
              ]}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            {(
              [
                ["Site today", String(site[site.length - 1].v)],
                ["App today", String(app[app.length - 1].v)],
                ["Site, 7 days", String(last7(site))],
                ["Best site day", best && best.v > 0 ? `${best.v} · ${new Date(best.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "none yet"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">{k}</p>
                <p className="mt-1 truncate text-[24px] font-light tracking-tight text-ink dark:text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <Label>Visitor journey</Label>
          <p className="mt-2 mb-5 text-[13px] text-mute dark:text-dark-mute">Last {days} days, step by step.</p>
          <Funnel
            steps={[
              { label: "Site visits", n: totalOf(site) },
              { label: "App visits", n: totalOf(app) },
              { label: "Wallets connected", n: totalOf(wallet) },
              { label: "Authorize opened", n: totalOf(authorize) },
              { label: "MCP calls", n: totalOf(mcp) },
            ]}
          />
          <ChartNote>These are page loads and calls, not people. Nothing identifies a visitor, so one person can count more than once.</ChartNote>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["Wallet connects", "Fresh connections", wallet],
            ["Authorize opened", "Agent sign-in pages", authorize],
            ["MCP calls", "Agent requests", mcp],
          ] as [string, string, DayPoint[]][]
        ).map(([title, sub, s]) => (
          <Card key={title} className="p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-ink dark:text-white">{title}</h3>
                <p className="text-[13px] text-mute dark:text-dark-mute">{sub}</p>
              </div>
              <p className="text-[28px] font-light tracking-tight text-ink dark:text-white">{totalOf(s)}</p>
            </div>
            <div className="mt-4">
              <StackedBars
                height={72}
                data={s.map((d) => ({ t: d.t, parts: [d.v] }))}
                series={[{ label: title, dot: "bg-accent dark:bg-accent-dark", bar: "bg-accent dark:bg-accent-dark" }]}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">
              Today {s[s.length - 1].v} · 7 days {last7(s)}
            </p>
          </Card>
        ))}
      </div>

      <p className="text-xs text-mute dark:text-dark-mute">
        Counting began {firstDay ? new Date(`${firstDay}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "today"}, so there is nothing before that day. Each page load or call adds 1 to a daily total.
      </p>
    </div>
  );
}

/** Change of the later half of the window against the earlier half. */
function halfChange(s: DayPoint[]): number | null {
  const mid = Math.floor(s.length / 2);
  const prev = totalOf(s.slice(0, mid));
  const cur = totalOf(s.slice(mid));
  return prev === 0 ? null : ((cur - prev) / prev) * 100;
}
