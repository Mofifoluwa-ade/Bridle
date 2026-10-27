"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NeedsContract, NeedsWallet } from "@/components/app/Gate";
import { Btn, Card, Field, Label, Notice, PageHeader, inputCls, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { CHAINS } from "@/lib/config";
import { duration, formatNear, formatNearWithUsd, parseNear, parseUnits, usdc, validAddress, validNearAccount } from "@/lib/format";
import type { Chain } from "@/lib/types";

type Row = { chain: Chain; address: string };

export default function NewMandate() {
  return (
    <>
      <PageHeader title="New mandate" lead="Write the rules once and sign them. The agent can only act inside them." />
      <NeedsContract>
        <NeedsWallet why="You sign the mandate with the wallet that will own it.">
          <Form />
        </NeedsWallet>
      </NeedsContract>
    </>
  );
}

function Form() {
  const { accountId, call } = useWallet();
  const router = useRouter();
  const [agent, setAgent] = useState("");
  const [chains, setChains] = useState<Chain[]>(["Base"]);
  const [rows, setRows] = useState<Row[]>([{ chain: "Base", address: "" }]);
  const [perTx, setPerTx] = useState("25");
  const [daily, setDaily] = useState("50");
  const [threshold, setThreshold] = useState("20");
  const [windowMin, setWindowMin] = useState("10");
  const [bond, setBond] = useState("1");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const v = useMemo(() => {
    const e: Record<string, string> = {};
    if (!validNearAccount(agent)) e.agent = "Enter the agent's NEAR account, like agent.testnet";
    else if (agent === accountId) e.agent = "Use a separate account for the agent, not your own";
    if (chains.length === 0) e.chains = "Choose at least one chain";
    const p = parseUnits(perTx), d = parseUnits(daily), t = parseUnits(threshold);
    if (!p || p === BigInt(0)) e.perTx = "Enter an amount above zero";
    if (!d) e.daily = "Enter an amount";
    else if (p && d < p) e.daily = "Daily cap must be at least the per-payment cap";
    if (t === null) e.threshold = "Enter an amount (0 pauses every payment)";
    else if (p && t > p) e.threshold = "Cannot be higher than the per-payment cap";
    const w = Number(windowMin) * 60;
    if (!Number.isFinite(w) || w < 60 || w > 86400) e.window = "Between 1 and 1,440 minutes";
    const b = parseNear(bond);
    if (b === null || b === BigInt(0)) e.bond = "Enter an amount in NEAR";
    const dy = Number(days);
    if (!Number.isInteger(dy) || dy < 1 || dy > 30) e.days = "Whole days, 1 to 30";
    const filled = rows.filter((r) => r.address.trim());
    if (filled.length === 0) e.rows = "Add at least one recipient. With none, every payment is blocked.";
    filled.forEach((r, i) => {
      if (!chains.includes(r.chain)) e[`row${i}`] = `${r.chain} is not selected above`;
      else if (!validAddress(r.chain, r.address.trim())) e[`row${i}`] = r.chain === "Base" ? "Expected a 0x address with 40 hex characters" : "Expected a base58 Solana address";
    });
    return { e, p, d, t, w, b, dy, filled };
  }, [agent, chains, rows, perTx, daily, threshold, windowMin, bond, days, accountId]);

  const ok = Object.keys(v.e).length === 0;

  const submit = async () => {
    setTouched(true);
    if (!ok) return;
    setBusy(true);
    setErr(null);
    try {
      const hash = await call({
        method: "create_mandate",
        args: {
          agent,
          chains,
          assets: ["USDC"],
          allowlist: v.filled.map((r) => ({ chain: r.chain, address: r.address.trim() })),
          per_tx_cap: v.p!.toString(),
          daily_cap: v.d!.toString(),
          cooling_threshold: v.t!.toString(),
          challenge_window_s: v.w,
          bond: v.b!.toString(),
          expiry_days: v.dy,
        },
      });
      router.push(hash ? "/app?transactionHashes=" + hash : "/app");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const show = (k: string) => (touched ? v.e[k] : undefined);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card className="space-y-6 p-8">
          <Label>01 · Who</Label>
          <Field label="Agent account" hint="The NEAR account your agent signs in with. It can propose payments and nothing else." error={show("agent")}>
            <input className={monoInputCls} value={agent} onChange={(e) => setAgent(e.target.value.trim())} placeholder="your-agent.testnet" autoCapitalize="none" spellCheck={false} />
          </Field>
        </Card>

        <Card className="space-y-6 p-8">
          <Label>02 · Where it can pay</Label>
          <fieldset>
            <legend className="text-[15px] font-semibold">Chains</legend>
            <div className="mt-2 flex gap-3">
              {CHAINS.map((c) => (
                <label
                  key={c}
                  className={`cursor-pointer rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-all ${
                    chains.includes(c)
                      ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
                      : "border-rule dark:border-dark-border bg-white dark:bg-dark-card text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={chains.includes(c)}
                    onChange={() =>
                      setChains((cs) =>
                        cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]
                      )
                    }
                  />
                  {c}
                </label>
              ))}
              <span className="self-center font-mono text-[13px] text-mute dark:text-dark-mute">
                USDC only
              </span>
            </div>
            {show("chains") && (
              <p className="mt-1.5 text-[14px] text-bad">{v.e.chains}</p>
            )}
          </fieldset>

          <div>
            <p className="text-[15px] font-semibold text-ink dark:text-white">Allowed recipients</p>
            <p className="mt-1 text-[14px] text-mute dark:text-dark-mute">
              The agent can only pay addresses on this list.
            </p>
            <div className="mt-3 space-y-3">
              {rows.map((r, i) => (
                <div key={i}>
                  <div className="flex gap-2">
                    <select
                      aria-label="Chain"
                      className="mt-0 rounded-xl border border-rule dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white px-3 py-3 text-[15px] focus:outline-none"
                      value={r.chain}
                      onChange={(e) =>
                        setRows(
                          rows.map((x, j) =>
                            j === i ? { ...x, chain: e.target.value as Chain } : x
                          )
                        )
                      }
                    >
                      {CHAINS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="Recipient address"
                      className={`${monoInputCls} mt-0`}
                      value={r.address}
                      placeholder={r.chain === "Base" ? "0x…" : "Solana address"}
                      onChange={(e) =>
                        setRows(
                          rows.map((x, j) =>
                            j === i ? { ...x, address: e.target.value.trim() } : x
                          )
                        )
                      }
                      spellCheck={false}
                    />
                    {rows.length > 1 && (
                      <Btn
                        variant="outline"
                        size="sm"
                        type="button"
                        aria-label="Remove recipient"
                        onClick={() => setRows(rows.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Btn>
                    )}
                  </div>
                  {show(`row${i}`) && <p className="mt-1.5 text-[14px] text-bad">{v.e[`row${i}`]}</p>}
                </div>
              ))}
            </div>
            {show("rows") && <p className="mt-2 text-[14px] text-bad">{v.e.rows}</p>}
            {rows.length < 20 && (
              <Btn variant="outline" size="sm" type="button" className="mt-3" onClick={() => setRows([...rows, { chain: chains[0] ?? "Base", address: "" }])}>
                Add recipient
              </Btn>
            )}
          </div>
        </Card>

        <Card className="space-y-6 p-8">
          <Label>03 · How much</Label>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Per payment (USDC)" error={show("perTx")}>
              <input className={monoInputCls} inputMode="decimal" value={perTx} onChange={(e) => setPerTx(e.target.value)} />
            </Field>
            <Field label="Per day (USDC)" hint="UTC day" error={show("daily")}>
              <input className={monoInputCls} inputMode="decimal" value={daily} onChange={(e) => setDaily(e.target.value)} />
            </Field>
            <Field label="Pause above (USDC)" hint="Held for your veto" error={show("threshold")}>
              <input className={monoInputCls} inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-6 p-8">
          <Label>04 · Safety</Label>
          <div className="grid gap-6 sm:grid-cols-3">
            <Field label="Challenge window (min)" hint="How long a large payment waits" error={show("window")}>
              <input className={monoInputCls} inputMode="numeric" value={windowMin} onChange={(e) => setWindowMin(e.target.value)} />
            </Field>
            <Field label="Agent bond (NEAR)" hint={v.b ? `Agent stakes ${formatNearWithUsd(v.b)}; slashed if a flag is confirmed` : "The agent stakes this; slashed if a flag is confirmed"} error={show("bond")}>
              <input className={monoInputCls} inputMode="decimal" value={bond} onChange={(e) => setBond(e.target.value)} />
            </Field>
            <Field label="Expires in (days)" hint="Up to 30" error={show("days")}>
              <input className={monoInputCls} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </Field>
          </div>
        </Card>

        {err && <Notice tone="bad" title="The mandate was not created">{err}</Notice>}
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <Card dark className="p-8">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-label text-dim">What you are signing</p>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Testnet
            </span>
          </div>
          <p className="mt-5 text-[19px] leading-[1.6] text-white">
            <b className="font-semibold">{agent || "Your agent"}</b> can pay{" "}
            <b className="font-semibold">USDC</b> on <b className="font-semibold">{chains.join(" and ") || "no chain"}</b>, only to{" "}
            <b className="font-semibold">{v.filled.length}</b> {v.filled.length === 1 ? "address" : "addresses"} you list.
          </p>
          <ul className="mt-6 space-y-3 border-t border-night pt-6 text-[15px] leading-relaxed text-dim">
            <li>Up to <span className="font-mono text-white">{v.p ? usdc(v.p) : "—"}</span> per payment and <span className="font-mono text-white">{v.d ? usdc(v.d) : "—"}</span> per day.</li>
            <li>
              Anything above <span className="font-mono text-white">{v.t !== null ? usdc(v.t) : "—"}</span> waits{" "}
              <span className="font-mono text-white">{Number.isFinite(v.w) ? duration(v.w) : "—"}</span> for your veto.
            </li>
            <li>The agent stakes <span className="font-mono text-white">{v.b ? formatNearWithUsd(v.b) : "—"}</span> before it can propose.</li>
            <li>Expires in <span className="font-mono text-white">{v.dy || "—"}</span> days. You can revoke any time, instantly.</li>
          </ul>

          {/* Testnet Non-Real Funds Notice */}
          <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            <div className="font-semibold text-amber-300">Testnet environment</div>
            <p className="mt-0.5 text-[11.5px] text-dim">
              This mandate will be signed on NEAR Testnet. Caps, thresholds, and bonds use testnet assets with zero real monetary value.
            </p>
          </div>

          <Btn variant="accent" size="lg" className="mt-6 w-full" busy={busy} onClick={submit} disabled={touched && !ok}>
            Sign mandate
          </Btn>
          {touched && !ok && <p className="mt-3 text-[14px] text-dim">Fix the highlighted fields first.</p>}
          <p className="mt-4 text-[13px] text-dim">Signed with {accountId} on NEAR testnet. No real funds are spent.</p>
        </Card>
      </aside>
    </div>
  );
}
