"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NeedsContract, NeedsWallet } from "@/components/app/Gate";
import { StemChart } from "@/components/app/StemChart";
import { Card, Empty, Label, PageHeader, Skeleton, StatusPill } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { usePoll } from "@/hooks/usePoll";
import {
  STUCK_SIGNING_MS,
  bucketDaily,
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
  return (
    <>
      <PageHeader title="Monitor" lead="How Bridle is doing on-chain: activity, money moved, and anything that needs attention." />
      <NeedsContract>
        <NeedsWallet why="Connect the contract account to open the owner monitor.">
          <Gate />
        </NeedsWallet>
      </NeedsContract>
    </>
  );
}

function Gate() {
  const { accountId } = useWallet();
  if (accountId !== CONFIG.contractId) {
    return (
      <Card className="p-5 sm:p-6">
        <Empty title="Owner only">
          This page is for {CONFIG.contractId}. You are signed in as {accountId}. Everything on it is public chain data, but the page is kept to the owner.
        </Empty>
      </Card>
    );
  }
  return <Body />;
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
          chart={<StemChart data={bucketDaily(pay, 30)} format={count} />}
          stats={[
            ["Since launch", String(d.counts.proposals)],
            ["Sent", String(executed)],
          ]}
        />
        <StatCard
          title="Money moved"
          sub="USDC sent, last 30 days"
          change={windowChange(usdc)}
          chart={<StemChart data={bucketDaily(usdc, 30)} format={money} />}
          stats={[
            ["Since launch", money(sum(usdc))],
            ["NEAR sent", `${sum(nearVol).toFixed(2)} Ⓝ`],
          ]}
        />
        <StatCard
          title="Rules"
          sub="Created, last 30 days"
          change={windowChange(rules)}
          chart={<StemChart data={bucketDaily(rules, 30)} format={count} />}
          stats={[
            ["Since launch", String(d.counts.mandates)],
            ["Active now", String(activeRules)],
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
      <div className="mt-6 grid grid-cols-2 gap-4">
        {stats.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">{k}</p>
            <p className="mt-1 truncate text-[26px] font-light tracking-tight text-ink dark:text-white">{v}</p>
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

const VISIT_CARDS: { event: TrackEvent; title: string; sub: string }[] = [
  { event: "site_view", title: "Site visits", sub: "Marketing pages, last 30 days" },
  { event: "app_view", title: "App visits", sub: "Inside /app, last 30 days" },
  { event: "wallet_connect", title: "Wallet connects", sub: "Fresh connections, last 30 days" },
  { event: "authorize_open", title: "Authorize opened", sub: "Agent sign-in pages, last 30 days" },
  { event: "mcp_call", title: "MCP calls", sub: "Agent requests, last 30 days" },
];

const seriesFor = (rows: DailyRow[], event: TrackEvent): DayPoint[] => {
  // The database counts in UTC days; line them up with the same 30 days the chain charts use.
  const end = dayStart(Date.now());
  const start = end - 29 * DAY_MS;
  const out: DayPoint[] = Array.from({ length: 30 }, (_, i) => ({ t: start + i * DAY_MS, v: 0 }));
  for (const r of rows) {
    if (r.event !== event) continue;
    const idx = Math.round((new Date(`${r.day}T12:00:00`).getTime() - start) / DAY_MS);
    if (idx >= 0 && idx < 30) out[idx].v += r.n;
  }
  return out;
};

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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {VISIT_CARDS.map((c) => {
        const series = seriesFor(rows, c.event);
        const total = series.reduce((a, x) => a + x.v, 0);
        const prev = windowTotal(rows, c.event);
        return (
          <StatCard
            key={c.event}
            title={c.title}
            sub={c.sub}
            change={prev}
            chart={<StemChart data={series} format={(v) => String(Math.round(v))} />}
            stats={[
              ["Last 30 days", String(total)],
              ["Today", String(series[series.length - 1].v)],
            ]}
          />
        );
      })}
    </div>
  );
}

/** Change of the last 15 days against the 15 before, since only 30 days are loaded. */
function windowTotal(rows: DailyRow[], event: TrackEvent): number | null {
  const s = seriesFor(rows, event);
  const prev = s.slice(0, 15).reduce((a, x) => a + x.v, 0);
  const cur = s.slice(15).reduce((a, x) => a + x.v, 0);
  return prev === 0 ? null : ((cur - prev) / prev) * 100;
}
