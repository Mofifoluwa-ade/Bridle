"use client";

import { useEffect, useState } from "react";
import { NeedsContract, NeedsWallet } from "@/components/app/Gate";
import { TxBanner } from "@/components/app/TxBanner";
import { Btn, Card, Field, Label, LinkBtn, Notice, PageHeader, Skeleton, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates } from "@/hooks/useMyData";
import { CONFIG } from "@/lib/config";
import { formatNear, formatNearWithUsd, parseUnits, usdc, validAddress } from "@/lib/format";
import type { Chain } from "@/lib/types";

export default function Agent() {
  return (
    <>
      <PageHeader
        title="Test your agent"
        lead="Try sending a test payment to see how the spending rules respond in real time, before connecting your code."
      />
      <NeedsContract>
        <NeedsWallet why="Connect with the agent's account. Only the agent named in a rule can request payments under it.">
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
      <Notice title="No active spending rules assign this account as the agent">
        Ask the rule owner to create a spending rule with <span className="font-mono text-[14px]">{accountId}</span> as the agent. To test it yourself, create a rule from another wallet and put this account as the agent.
        <div className="mt-4"><LinkBtn href="/app/mandates/new" variant="outline" size="sm">New rule</LinkBtn></div>
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
      <TxBanner what="Payment request" />

      {/* Testnet Banner */}
      <div className="mb-6 rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-card/60 p-3 sm:p-3.5 text-xs flex flex-wrap items-center justify-between gap-2.5 text-mute dark:text-dark-mute">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase px-2 py-0.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/25 font-semibold">
            Testnet Console
          </span>
          <span className="text-ink dark:text-white font-medium">Free testnet environment</span>
          <span className="text-dim dark:text-dark-dim">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            All payment requests, USDC transfers, and security deposits use test tokens only. No real money is at risk.
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {mine.length > 1 && (
            <Card className="p-6">
              <Field label="Active spending rule">
                <select className={`${monoInputCls}`} value={m.id} onChange={(e) => setMid(Number(e.target.value))}>
                  {mine.map((x) => <option key={x.id} value={x.id}>Rule #{x.id} · Owner: {x.owner}</option>)}
                </select>
              </Field>
            </Card>
          )}

          {need > BigInt(0) && (
            <Notice tone="warn" title="Deposit security funds first (testnet NEAR)">
              <p>This rule requires {formatNearWithUsd(need)} more in testnet NEAR from you before it accepts payment requests.</p>
              <Btn className="mt-3" size="sm" busy={busy === "bond"} onClick={() => run("bond", () => call({ method: "post_bond", args: { mandate_id: m.id }, deposit: need.toString() }))}>
                Deposit {formatNear(need)} (testnet NEAR)
              </Btn>
            </Notice>
          )}

          <Card className="space-y-6 p-8">
            <Label>Send a test payment</Label>
            <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
              <Field label="Blockchain">
                <select className={monoInputCls} value={chain} onChange={(e) => setChain(e.target.value as Chain)}>
                  {m.chains.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Recipient address" hint="Try entering an address not on your approved list to see it get blocked." error={recipient && !addrOk ? "Not a valid address for this chain" : null}>
                <input className={monoInputCls} value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} spellCheck={false} list="allow" />
                <datalist id="allow">{m.allowlist.filter((r) => r.chain === chain).map((r) => <option key={r.address} value={r.address} />)}</datalist>
              </Field>
            </div>
            <Field label="Amount (Testnet USDC)" hint={`Limits: Up to ${usdc(m.per_tx_cap)} per payment, ${usdc(m.daily_cap)} per day. Pauses above ${usdc(m.cooling_threshold)}.`} error={amount && amt === null ? "Enter a number like 12.5" : null}>
              <input className={monoInputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            {err && <Notice tone="bad" title="That did not go through">{err}</Notice>}
            <div className="flex flex-wrap items-center gap-4">
              <Btn size="lg" disabled={!canSend} busy={busy === "send"} onClick={() => run("send", () => call({ method: "propose_payment", args: { mandate_id: m.id, chain, asset: "USDC", amount: amt!.toString(), recipient } }))}>
                Send test payment
              </Btn>
              <LinkBtn href={`/app/mandates/${m.id}`} variant="outline" size="lg">View rule details</LinkBtn>
            </div>
            <p className="text-[14px] text-mute">If a payment breaks a rule, it is stopped instantly on-chain. The app records it and displays which rule blocked it.</p>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card dark className="p-6">
            <p className="font-mono text-xs uppercase tracking-label text-dim">How your AI agent calls this in code</p>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[12.5px] leading-relaxed text-white">{snippet}</pre>
          </Card>
          <Card className="p-6">
            <Label>Tool for AI models</Label>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">Give your AI agent this simple tool. Bridle handles the security and limits automatically, so your agent never has access to private keys or direct funds.</p>
            <pre className="mt-3 overflow-x-auto font-mono text-[12px] leading-relaxed text-ink dark:text-white p-3.5 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">{`propose_payment(
  chain: "Base" | "Solana",
  asset: "USDC",
  amount: string,   // testnet amount
  recipient: string
)`}</pre>
          </Card>
        </aside>
      </div>
    </>
  );
}
