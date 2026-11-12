"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatNear } from "@/lib/format";
import type { Mandate, Proposal } from "@/lib/types";

type Sandbox =
  | { configured: false }
  | { configured: true; error: string }
  | { configured: true; mandate: Mandate; balance: string; proposals: Proposal[] };

type Attempt = { chain: string; asset: string; amount: string; recipient: string };

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 font-mono text-[14px] outline-none focus:border-ink dark:border-dark-border dark:bg-dark-bg dark:focus:border-white";

function verdict(p: Proposal) {
  return p.status === "Rejected"
    ? { blocked: true, label: "Blocked", text: p.reason ?? "Refused by the rule." }
    : { blocked: false, label: p.status === "Waiting" ? "Held for review" : "Allowed", text: p.status === "Waiting" ? "Within the limits, but over the pause threshold, so it waits for the owner." : "Within every limit. Nothing is sent from this page: only the owner's side can execute." };
}

export function BreakDemo() {
  const [data, setData] = useState<Sandbox | null>(null);
  const [form, setForm] = useState<Attempt>({ chain: "Near", asset: "NEAR", amount: "5", recipient: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<Proposal | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/sandbox", { cache: "no-store" });
      setData(await r.json());
    } catch {
      setData({ configured: true, error: "Could not reach the sandbox." });
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const attack = async (a: Attempt) => {
    setForm(a);
    setBusy(true);
    setErr(null);
    setLast(null);
    try {
      const r = await fetch("/api/sandbox", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(a) });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "That did not go through.");
      else {
        setLast(j.proposal);
        load();
      }
    } catch {
      setErr("Could not reach the sandbox.");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-line dark:border-dark-border" />;
  if (!data.configured)
    return (
      <div className="rounded-2xl border border-line p-6 dark:border-dark-border">
        <p className="font-semibold">The sandbox is not switched on yet.</p>
        <p className="mt-2 text-[15px] text-mute dark:text-dark-mute">Check back soon. It needs a testnet rule to attack.</p>
      </div>
    );
  if ("error" in data)
    return <div className="rounded-2xl border border-line p-6 text-[15px] dark:border-dark-border">{data.error}</div>;

  const m = data.mandate;
  const ok = m.allowlist.find((r) => r.chain === "Near")?.address ?? "";
  const cap = BigInt(m.per_tx_cap);
  const over = formatNear(cap * BigInt(10)).replace(/ NEAR$/, "");
  const nearAmt = (y: bigint) => formatNear(y).replace(/ NEAR$/, "");

  const presets: { title: string; hint: string; a: Attempt }[] = [
    { title: "Pay myself", hint: "Send to an account that is not on the list.", a: { chain: "Near", asset: "NEAR", amount: "1", recipient: "attacker.testnet" } },
    { title: "Go over the cap", hint: "Pay the approved account ten times the limit.", a: { chain: "Near", asset: "NEAR", amount: over, recipient: ok } },
    { title: "Switch chain", hint: "Try to move money out on Base instead.", a: { chain: "Base", asset: "USDC", amount: "5", recipient: "0x000000000000000000000000000000000000dEaD" } },
    { title: "Swap the asset", hint: "Ask for USDC from a NEAR-only rule.", a: { chain: "Near", asset: "USDC", amount: "1", recipient: ok } },
    { title: "Pay zero", hint: "A zero payment, to see if it slips through.", a: { chain: "Near", asset: "NEAR", amount: "0", recipient: ok } },
    { title: "Control: play fair", hint: "A small payment to the approved account.", a: { chain: "Near", asset: "NEAR", amount: nearAmt(cap / BigInt(10) || BigInt(1)), recipient: ok } },
  ];

  const result = last ? verdict(last) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="h-fit rounded-2xl border border-line p-5 dark:border-dark-border">
        <p className="font-mono text-xs uppercase tracking-label text-mute dark:text-dark-mute">The rule you are attacking</p>
        <dl className="mt-4 space-y-3 text-[14.5px]">
          <div className="flex justify-between gap-4"><dt className="text-mute dark:text-dark-mute">Per payment</dt><dd className="font-mono">{formatNear(m.per_tx_cap)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mute dark:text-dark-mute">Per day</dt><dd className="font-mono">{formatNear(m.daily_cap)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mute dark:text-dark-mute">Chains</dt><dd className="font-mono">{m.chains.join(", ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mute dark:text-dark-mute">Assets</dt><dd className="font-mono">{m.assets.join(", ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-mute dark:text-dark-mute">Holds</dt><dd className="font-mono">{formatNear(data.balance)}</dd></div>
          <div>
            <dt className="text-mute dark:text-dark-mute">May pay only</dt>
            {m.allowlist.map((r) => <dd key={r.chain + r.address} className="mt-1 break-all font-mono text-[13px]">{r.address}</dd>)}
          </div>
        </dl>
        <p className="mt-5 text-[13px] leading-relaxed text-mute dark:text-dark-mute">
          Attempts are sent as the rule&rsquo;s agent. This page only asks the contract for a decision. It cannot execute a payment, so no NEAR moves, whatever you send.
        </p>
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {presets.map((p) => (
            <button key={p.title} disabled={busy || !ok} onClick={() => attack(p.a)} className="rounded-xl border border-line p-4 text-left transition-colors hover:border-ink disabled:opacity-50 dark:border-dark-border dark:hover:border-white">
              <span className="block font-semibold">{p.title}</span>
              <span className="mt-1 block text-[13px] text-mute dark:text-dark-mute">{p.hint}</span>
            </button>
          ))}
        </div>

        <details className="rounded-xl border border-line p-4 dark:border-dark-border">
          <summary className="cursor-pointer text-[14.5px] font-semibold">Write your own attack</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-[13px] text-mute dark:text-dark-mute">Chain
              <select className={`${inputCls} mt-1`} value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })}>
                <option>Near</option><option>Base</option><option>Solana</option>
              </select>
            </label>
            <label className="text-[13px] text-mute dark:text-dark-mute">Asset
              <input className={`${inputCls} mt-1`} value={form.asset} maxLength={12} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
            </label>
            <label className="text-[13px] text-mute dark:text-dark-mute">Amount
              <input className={`${inputCls} mt-1`} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </label>
            <label className="text-[13px] text-mute dark:text-dark-mute">Recipient
              <input className={`${inputCls} mt-1`} spellCheck={false} value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value.trim() })} />
            </label>
          </div>
          <button disabled={busy || !form.recipient} onClick={() => attack(form)} className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-ink">
            {busy ? "Asking the contract…" : "Send this attempt"}
          </button>
        </details>

        <div aria-live="polite">
          {busy && <p className="text-[15px] text-mute dark:text-dark-mute">Asking the contract…</p>}
          {err && <p className="rounded-xl border border-line p-4 text-[15px] text-bad dark:border-dark-border">{err}</p>}
          {result && last && (
            <div className={`rounded-xl border p-5 ${result.blocked ? "border-bad/40" : "border-accent/40"}`}>
              <p className={`font-mono text-xs uppercase tracking-label ${result.blocked ? "text-bad" : "text-accent"}`}>{result.label}</p>
              <p className="mt-2 text-[18px] font-semibold leading-snug">{result.text}</p>
              <p className="mt-2 font-mono text-[12.5px] text-mute dark:text-dark-mute">proposal #{last.id} · {last.chain} · {last.asset} · {formatNear(last.amount)}</p>
            </div>
          )}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-label text-mute dark:text-dark-mute">Every attempt, newest first</p>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line dark:divide-dark-border dark:border-dark-border">
            {data.proposals.length === 0 && <li className="p-4 text-[14px] text-mute dark:text-dark-mute">Nobody has tried yet. Be the first.</li>}
            {data.proposals.map((p) => {
              const v = verdict(p);
              return (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4 text-[14px]">
                  <span className="font-mono text-[13px]">#{p.id} · {formatNear(p.amount)} · {p.chain}</span>
                  <span className={v.blocked ? "text-bad" : "text-accent"}>{v.label}: {v.blocked ? v.text : "within the rule"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
