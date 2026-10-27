"use client";

import { useEffect, useState } from "react";
import { NeedsContract, NeedsWallet } from "@/components/app/Gate";
import { TxBanner } from "@/components/app/TxBanner";
import { Btn, Card, Field, Label, LinkBtn, Notice, PageHeader, Skeleton, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates } from "@/hooks/useMyData";
import { CONFIG } from "@/lib/config";
import { formatNear, parseUnits, usdc, validAddress } from "@/lib/format";
import type { Chain } from "@/lib/types";

export default function Agent() {
  return (
    <>
      <PageHeader title="Agent console" lead="For whoever builds the agent. Send a test proposal by hand to see exactly how the contract answers, before you wire in a real agent." />
      <NeedsContract>
        <NeedsWallet why="Connect with the agent's account. Only the agent named in a mandate can propose under it.">
          <Body />
        </NeedsWallet>
      </NeedsContract>
    </>
  );
}

function Body() {
  const { accountId, call } = useWallet();
  const mandates = useMyMandates();
  const mine = (mandates.data ?? []).filter((m) => m.agent === accountId && m.state === "Active");
  const [mid, setMid] = useState<number | null>(null);
  const [chain, setChain] = useState<Chain>("Base");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (mid === null && mine.length) setMid(mine[0].id);
  }, [mine, mid]);

  if (mandates.loading) return <Skeleton className="h-72" />;
  if (mandates.error) return <Notice tone="bad" title="Could not read the contract">{mandates.error}</Notice>;
  if (mine.length === 0)
    return (
      <Notice title="No active mandate names this account as the agent">
        Ask the owner to create a mandate with <span className="font-mono text-[14px]">{accountId}</span> as the agent. To try it alone, create one from a second account and set this one as the agent.
        <div className="mt-4"><LinkBtn href="/app/mandates/new" variant="outline" size="sm">New mandate</LinkBtn></div>
      </Notice>
    );

  const m = mine.find((x) => x.id === mid) ?? mine[0];
  const need = BigInt(m.bond) - BigInt(m.bond_posted);
  const amt = parseUnits(amount);
  const addrOk = validAddress(chain, recipient);
  const canSend = amt !== null && amt > BigInt(0) && addrOk && need <= BigInt(0);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
      mandates.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const snippet = `near contract call-function as-transaction ${CONFIG.contractId || "<contract>"} propose_payment \\
  json-args '{"mandate_id":${m.id},"chain":"${chain}","asset":"USDC","amount":"${amt ?? "1000000"}","recipient":"${recipient || "<address>"}"}' \\
  prepaid-gas '100 Tgas' attached-deposit '0 NEAR' \\
  sign-as ${accountId} network-config testnet sign-with-keychain send`;

  return (
    <>
      <TxBanner what="Proposal" />

      {/* Testnet Banner */}
      <div className="mb-6 rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-card/60 p-3 sm:p-3.5 text-xs flex flex-wrap items-center justify-between gap-2.5 text-mute dark:text-dark-mute">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase px-2 py-0.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/25 font-semibold">
            Testnet Console
          </span>
          <span className="text-ink dark:text-white font-medium">Non-real funds environment</span>
          <span className="text-dim dark:text-dark-dim">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            All proposals, USDC dispatches, and bonds run with testnet tokens only. No real funds are at risk.
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {mine.length > 1 && (
            <Card className="p-6">
              <Field label="Mandate">
                <select className={`${monoInputCls}`} value={m.id} onChange={(e) => setMid(Number(e.target.value))}>
                  {mine.map((x) => <option key={x.id} value={x.id}>Mandate {x.id} · owner {x.owner}</option>)}
                </select>
              </Field>
            </Card>
          )}

          {need > BigInt(0) && (
            <Notice tone="warn" title="Post the bond first (testnet NEAR)">
              <p>The mandate needs {formatNear(need)} more in testnet NEAR from you before it accepts proposals.</p>
              <Btn className="mt-3" size="sm" busy={busy === "bond"} onClick={() => run("bond", () => call({ method: "post_bond", args: { mandate_id: m.id }, deposit: need.toString() }))}>
                Post {formatNear(need)} (testnet NEAR)
              </Btn>
            </Notice>
          )}

          <Card className="space-y-6 p-8">
            <Label>propose_payment</Label>
            <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
              <Field label="Chain">
                <select className={monoInputCls} value={chain} onChange={(e) => setChain(e.target.value as Chain)}>
                  {m.chains.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Recipient" hint="Try one that is not on the allowlist to see it blocked." error={recipient && !addrOk ? "Not a valid address for this chain" : null}>
                <input className={monoInputCls} value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} spellCheck={false} list="allow" />
                <datalist id="allow">{m.allowlist.filter((r) => r.chain === chain).map((r) => <option key={r.address} value={r.address} />)}</datalist>
              </Field>
            </div>
            <Field label="Amount (Testnet USDC)" hint={`Cap ${usdc(m.per_tx_cap)} per payment, ${usdc(m.daily_cap)} per day. Pauses above ${usdc(m.cooling_threshold)}.`} error={amount && amt === null ? "Enter a number like 12.5" : null}>
              <input className={monoInputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            {err && <Notice tone="bad" title="That did not go through">{err}</Notice>}
            <div className="flex flex-wrap items-center gap-4">
              <Btn size="lg" disabled={!canSend} busy={busy === "send"} onClick={() => run("send", () => call({ method: "propose_payment", args: { mandate_id: m.id, chain, asset: "USDC", amount: amt!.toString(), recipient } }))}>
                Send proposal (Testnet)
              </Btn>
              <LinkBtn href={`/app/mandates/${m.id}`} variant="outline" size="lg">See the mandate</LinkBtn>
            </div>
            <p className="text-[14px] text-mute">A blocked proposal still goes through as a transaction on NEAR testnet: the contract records it with the rule that stopped it. No real funds are moved.</p>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card dark className="p-6">
            <p className="font-mono text-xs uppercase tracking-label text-dim">The same call from your agent</p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[12.5px] leading-relaxed text-white">{snippet}</pre>
          </Card>
          <Card className="p-6">
            <Label>Tool schema</Label>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">Expose one tool to the model. The contract builds the transaction itself, so the agent never handles keys or raw calldata.</p>
            <pre className="mt-3 overflow-x-auto font-mono text-[12px] leading-relaxed text-ink dark:text-white p-3.5 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">{`propose_payment(
  chain: "Base" | "Solana",
  asset: "USDC",
  amount: string,   // smallest units
  recipient: string
)`}</pre>
          </Card>
        </aside>
      </div>
    </>
  );
}
