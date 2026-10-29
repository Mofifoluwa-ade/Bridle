"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { NeedsContract } from "@/components/app/Gate";
import { Budget, MandateStatePill } from "../../../../components/app/MandateCard";
import { ProposalRow } from "../../../../components/app/ProposalRow";
import { TxBanner } from "@/components/app/TxBanner";
import { Addr, Btn, Card, Empty, Field, Label, LinkBtn, NearAccountLink, Notice, PageHeader, Skeleton, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useNow, usePoll } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { countdown, duration, formatNear, formatNearWithUsd, nsToMs, parseUnits, usdc } from "@/lib/format";
import { api } from "@/lib/near";

export default function MandatePage() {
  const id = Number(useParams<{ id: string }>()?.id);
  return (
    <NeedsContract>
      <Body id={id} />
    </NeedsContract>
  );
}

function Body({ id }: { id: number }) {
  const { accountId, call, signIn } = useWallet();
  const now = useNow();
  const m = usePoll(Number.isInteger(id) ? `m${id}` : null, () => api.mandate(id));
  const props = usePoll(Number.isInteger(id) ? `mp${id}` : null, () => api.proposals(id, 50));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);

  if (m.error) return <Notice tone="bad" title="Could not read the contract">{m.error}</Notice>;
  if (m.loading) return <Skeleton className="h-96" />;
  if (!m.data) return <Card><Empty title="Spending rule not found" action={<LinkBtn href="/app">Back to dashboard</LinkBtn>}>There is no spending rule #{id} on this contract.</Empty></Card>;

  const mandate = m.data;
  const isOwner = accountId === mandate.owner;
  const isAgent = accountId === mandate.agent;
  const expired = nsToMs(mandate.expires_at) <= now;
  const pending = mandate.pending_limits;
  const pendingReady = pending && now >= nsToMs(pending.effective_at);

  const act = async (key: string, method: string, args: Record<string, unknown>, deposit?: string) => {
    setBusy(key);
    setErr(null);
    try {
      await call({ method, args, deposit });
      m.refresh();
      props.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };
  const missing = (BigInt(mandate.bond) - BigInt(mandate.bond_posted)).toString();

  return (
    <>
      <TxBanner what="Transaction" />
      <PageHeader
        title={`Rule #${mandate.id}`}
        lead={`Created by ${mandate.owner} for AI agent ${mandate.agent}.`}
        action={<MandateStatePill m={mandate} now={now} />}
      />
      {err && <div className="mb-6"><Notice tone="bad" title="That did not go through">{err}</Notice></div>}

      {!accountId && <div className="mb-6"><Notice title="You are viewing this rule in view-only mode"><button className="font-semibold text-ink underline" onClick={signIn}>Connect your wallet</button> to make changes.</Notice></div>}

      {mandate.state === "Active" && BigInt(missing) > BigInt(0) && (
        <div className="mb-6">
          {isAgent ? (
            <Notice tone="warn" title="Deposit security funds to start making payments (testnet NEAR)">
              <p>This rule requires {formatNearWithUsd(missing)} more in testnet NEAR from your agent account before any payments can be made (test tokens only).</p>
              <Btn className="mt-3" size="sm" busy={busy === "bond"} onClick={() => act("bond", "post_bond", { mandate_id: id }, missing)}>
                Deposit {formatNear(missing)} (testnet NEAR)
              </Btn>
            </Notice>
          ) : (
            <Notice tone="warn" title={`Awaiting security deposit from agent (${mandate.agent})`}>
              <p>
                This rule requires <strong>{formatNearWithUsd(missing)}</strong> in testnet NEAR collateral before the agent can execute payments.
              </p>
              <div className="mt-2.5 text-xs text-mute dark:text-dark-mute flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-line/60 dark:border-dark-border/60">
                <span>
                  {accountId ? (
                    <>
                      You are signed in as <strong className="font-mono text-ink dark:text-white">{accountId}</strong> ({isOwner ? "Rule Owner" : "Viewer"}). The smart contract requires the deposit to be posted by the agent (<strong className="font-mono text-ink dark:text-white">{mandate.agent}</strong>). To deposit this bond, switch your wallet to <strong className="font-mono text-ink dark:text-white">{mandate.agent}</strong>.
                    </>
                  ) : (
                    <>Sign in with the agent account (<strong className="font-mono">{mandate.agent}</strong>) to deposit this bond.</>
                  )}
                </span>
                <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                  Awaiting {formatNear(missing)}
                </span>
              </div>
            </Notice>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6 min-w-0">
          <Card className="p-5 sm:p-7 md:p-8">
            <Label>Spending rules</Label>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Row k="Max per payment" v={usdc(mandate.per_tx_cap)} />
              <Row k="Max per day" v={usdc(mandate.daily_cap)} />
              <Row k="Pause payments above" v={usdc(mandate.cooling_threshold)} />
              <Row k="Review delay" v={duration(mandate.challenge_window_s)} />
              <Row k="Blockchains" v={mandate.chains.join(", ")} />
              <Row k="Token" v={mandate.assets.join(", ")} />
              <Row k="Security deposit" v={`${formatNear(mandate.bond_posted)} of ${formatNearWithUsd(mandate.bond)}`} />
              <Row k={expired ? "Rule expired" : "Rule expires"} v={new Date(nsToMs(mandate.expires_at)).toLocaleString()} />
            </dl>
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-3 text-[15px] font-semibold">Approved recipients</p>
              {mandate.allowlist.length === 0 ? (
                <p className="text-[15px] text-mute">None added. All payments will be blocked.</p>
              ) : (
                <ul className="space-y-2">
                  {mandate.allowlist.map((r, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-[15px]">
                      <span className="w-16 rounded-full border border-line px-3 py-0.5 text-center font-mono text-[12px] text-mute">{r.chain}</span>
                      <Addr value={r.address} chars={10} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {pending && (
            <Notice tone="warn" title="Higher limits waiting to take effect">
              <p>
                New limits: Max {usdc(pending.per_tx_cap)} per payment, {usdc(pending.daily_cap)} per day, pause above {usdc(pending.cooling_threshold)}, review delay {duration(pending.challenge_window_s)}.{" "}
                {pendingReady ? "The safety wait time has ended." : `Takes effect in ${countdown(nsToMs(pending.effective_at) - now)} (safety delay).`}
              </p>
              {pendingReady && (
                <Btn className="mt-3" size="sm" busy={busy === "apply"} onClick={() => act("apply", "apply_pending_limits", { mandate_id: id })}>
                  Apply now
                </Btn>
              )}
            </Notice>
          )}

          {isOwner && mandate.state === "Active" && (
            <Card className="p-5 sm:p-7 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Change limits</Label>
                  <p className="mt-2 text-xs sm:text-[15px] text-mute">Lowering limits applies immediately. Raising limits waits for the safety delay to protect your funds.</p>
                </div>
                {!edit && <Btn variant="outline" size="sm" onClick={() => setEdit(true)}>Change limits</Btn>}
              </div>
              {edit && <LimitsForm m={mandate} busy={busy === "limits"} onCancel={() => setEdit(false)} onSubmit={async (args) => { await act("limits", "update_limits", { mandate_id: id, ...args }); setEdit(false); }} />}
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-line px-4 sm:px-6 py-4"><Label>Payments requested by agent</Label></div>
            {props.loading ? <div className="p-6"><Skeleton className="h-14" /></div> : (props.data ?? []).length === 0 ? (
              <Empty title="No payments yet">Your agent has not requested any payments under this rule yet.</Empty>
            ) : (
              (props.data ?? []).map((p) => <ProposalRow key={p.id} p={p} now={now} />)
            )}
          </Card>
        </div>

        <aside className="space-y-6 min-w-0">
          <Card className="p-5 sm:p-6">
            <Label>Daily budget</Label>
            <div className="mt-4"><Budget m={mandate} /></div>
          </Card>
          {isOwner && mandate.state === "Active" && (
            <Card className="p-5 sm:p-6">
              <Label>Emergency freeze</Label>
              <p className="mt-2 text-xs sm:text-[15px] leading-relaxed text-mute">Stopping this rule immediately blocks your agent from making any more payments. This cannot be undone.</p>
              <Btn variant="danger" className="mt-4 w-full" busy={busy === "revoke"} onClick={() => { if (window.confirm("Stop this rule? This cannot be undone.")) act("revoke", "revoke", { mandate_id: id }); }}>
                Stop and freeze rule
              </Btn>
            </Card>
          )}
          {isAgent && (mandate.state === "Revoked" || expired) && BigInt(mandate.bond_posted) > BigInt(0) && (
            <Card className="p-6">
              <Label>Security deposit</Label>
              <p className="mt-2 text-[15px] text-mute">You can take your {formatNear(mandate.bond_posted)} deposit back once no payments are in flight.</p>
              <Btn className="mt-4 w-full" variant="outline" busy={busy === "wd"} onClick={() => act("wd", "withdraw_bond", { mandate_id: id })}>Withdraw deposit</Btn>
            </Card>
          )}
          <Card className="p-6">
            <Label>Contract address</Label>
            <p className="mt-3 break-all"><NearAccountLink id={CONFIG.contractId} /></p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[14px] text-mute">{k}</dt>
      <dd className="mt-0.5 font-mono text-[16px]">{v}</dd>
    </div>
  );
}

function LimitsForm({ m, busy, onSubmit, onCancel }: { m: import("@/lib/types").Mandate; busy: boolean; onSubmit: (a: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const toDec = (v: string) => { const n = BigInt(v); const w = n / BigInt(1_000_000); const fr = (n % BigInt(1_000_000)).toString().padStart(6, "0").replace(/0+$/, ""); return fr ? `${w}.${fr}` : `${w}`; };
  const [perTx, setPerTx] = useState(toDec(m.per_tx_cap));
  const [daily, setDaily] = useState(toDec(m.daily_cap));
  const [th, setTh] = useState(toDec(m.cooling_threshold));
  const [win, setWin] = useState(String(m.challenge_window_s / 60));
  const p = parseUnits(perTx), d = parseUnits(daily), t = parseUnits(th), w = Number(win) * 60;
  const error = !p || !d || t === null ? "Enter valid amounts" : d < p ? "Daily limit must be at least the per-payment limit" : t > p ? "Pause threshold cannot exceed the per-payment limit" : !(w >= 60 && w <= 86400) ? "Review time must be 1 to 1,440 minutes" : null;
  const loosens = !error && (p! > BigInt(m.per_tx_cap) || d! > BigInt(m.daily_cap) || t! > BigInt(m.cooling_threshold) || w < m.challenge_window_s);
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-4">
        <Field label="Max per payment"><input className={monoInputCls} value={perTx} onChange={(e) => setPerTx(e.target.value)} /></Field>
        <Field label="Max per day"><input className={monoInputCls} value={daily} onChange={(e) => setDaily(e.target.value)} /></Field>
        <Field label="Pause payments above"><input className={monoInputCls} value={th} onChange={(e) => setTh(e.target.value)} /></Field>
        <Field label="Review delay (min)"><input className={monoInputCls} value={win} onChange={(e) => setWin(e.target.value)} /></Field>
      </div>
      {error ? <p className="text-[14px] text-bad">{error}</p> : <p className="text-[14px] text-mute">{loosens ? `Raising limits takes effect after ${duration(m.challenge_window_s)} for safety.` : "Lowering limits applies immediately."}</p>}
      <div className="flex gap-3">
        <Btn busy={busy} disabled={!!error} onClick={() => onSubmit({ per_tx_cap: p!.toString(), daily_cap: d!.toString(), cooling_threshold: t!.toString(), challenge_window_s: w })}>Save limits</Btn>
        <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}
