"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { NeedsContract } from "@/components/app/Gate";
import { Budget, MandateStatePill } from "@/components/app/MandateCard";
import { ProposalRow } from "@/components/app/ProposalRow";
import { TxBanner } from "@/components/app/TxBanner";
import { Addr, Btn, Card, Empty, Field, Label, LinkBtn, NearAccountLink, Notice, PageHeader, Skeleton, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useNow, usePoll } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { countdown, duration, formatNear, nsToMs, parseUnits, usdc } from "@/lib/format";
import { api } from "@/lib/near";

export default function MandatePage() {
  const id = Number(useParams<{ id: string }>().id);
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
  const props = usePoll(`mp${id}`, () => api.proposals(id, 50));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);

  if (m.error) return <Notice tone="bad" title="Could not read the contract">{m.error}</Notice>;
  if (m.loading) return <Skeleton className="h-96" />;
  if (!m.data) return <Card><Empty title="Mandate not found" action={<LinkBtn href="/app">Back to dashboard</LinkBtn>}>There is no mandate {id} on this contract.</Empty></Card>;

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
        title={`Mandate ${mandate.id}`}
        lead={`Owned by ${mandate.owner}. Agent: ${mandate.agent}.`}
        action={<MandateStatePill m={mandate} now={now} />}
      />
      {err && <div className="mb-6"><Notice tone="bad" title="That did not go through">{err}</Notice></div>}

      {!accountId && <div className="mb-6"><Notice title="You are viewing this read-only"><button className="font-semibold text-ink underline" onClick={signIn}>Connect a wallet</button> to act on it.</Notice></div>}

      {isAgent && mandate.state === "Active" && BigInt(missing) > BigInt(0) && (
        <div className="mb-6">
          <Notice tone="warn" title="Post your bond to start proposing (testnet NEAR)">
            <p>This mandate needs {formatNear(missing)} more in testnet NEAR from the agent before any payment is accepted (non-real funds).</p>
            <Btn className="mt-3" size="sm" busy={busy === "bond"} onClick={() => act("bond", "post_bond", { mandate_id: id }, missing)}>
              Post {formatNear(missing)} (testnet NEAR)
            </Btn>
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-8">
            <Label>Rules</Label>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Row k="Per payment" v={usdc(mandate.per_tx_cap)} />
              <Row k="Per day" v={usdc(mandate.daily_cap)} />
              <Row k="Pause above" v={usdc(mandate.cooling_threshold)} />
              <Row k="Challenge window" v={duration(mandate.challenge_window_s)} />
              <Row k="Chains" v={mandate.chains.join(", ")} />
              <Row k="Assets" v={mandate.assets.join(", ")} />
              <Row k="Agent bond" v={`${formatNear(mandate.bond_posted)} of ${formatNear(mandate.bond)}`} />
              <Row k={expired ? "Expired" : "Expires"} v={new Date(nsToMs(mandate.expires_at)).toLocaleString()} />
            </dl>
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-3 text-[15px] font-semibold">Allowed recipients</p>
              {mandate.allowlist.length === 0 ? (
                <p className="text-[15px] text-mute">None. Every payment is blocked.</p>
              ) : (
                <ul className="space-y-2">
                  {mandate.allowlist.map((r, i) => (
                    <li key={i} className="flex items-center gap-3 text-[15px]">
                      <span className="w-16 rounded-full border border-line px-3 py-0.5 text-center font-mono text-[12px] text-mute">{r.chain}</span>
                      <Addr value={r.address} chars={10} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {pending && (
            <Notice tone="warn" title="A loosening is queued">
              <p>
                New caps {usdc(pending.per_tx_cap)} / {usdc(pending.daily_cap)}, pause above {usdc(pending.cooling_threshold)}, window {duration(pending.challenge_window_s)}.{" "}
                {pendingReady ? "The delay has passed." : `Takes effect in ${countdown(nsToMs(pending.effective_at) - now)}.`}
              </p>
              {pendingReady && (
                <Btn className="mt-3" size="sm" busy={busy === "apply"} onClick={() => act("apply", "apply_pending_limits", { mandate_id: id })}>
                  Apply now
                </Btn>
              )}
            </Notice>
          )}

          {isOwner && mandate.state === "Active" && (
            <Card className="p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Change limits</Label>
                  <p className="mt-2 text-[15px] text-mute">Tighten any limit instantly. Loosening waits one challenge window.</p>
                </div>
                {!edit && <Btn variant="outline" size="sm" onClick={() => setEdit(true)}>Edit limits</Btn>}
              </div>
              {edit && <LimitsForm m={mandate} busy={busy === "limits"} onCancel={() => setEdit(false)} onSubmit={async (args) => { await act("limits", "update_limits", { mandate_id: id, ...args }); setEdit(false); }} />}
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-line px-6 py-4"><Label>Proposals</Label></div>
            {props.loading ? <div className="p-6"><Skeleton className="h-14" /></div> : (props.data ?? []).length === 0 ? (
              <Empty title="No proposals yet">Nothing has been proposed under this mandate.</Empty>
            ) : (
              (props.data ?? []).map((p) => <ProposalRow key={p.id} p={p} now={now} />)
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-6">
            <Label>Budget</Label>
            <div className="mt-4"><Budget m={mandate} /></div>
          </Card>
          {isOwner && mandate.state === "Active" && (
            <Card className="p-6">
              <Label>Emergency</Label>
              <p className="mt-2 text-[15px] leading-relaxed text-mute">Revoking stops every payment that has not been signed yet. It cannot be undone.</p>
              <Btn variant="danger" className="mt-4 w-full" busy={busy === "revoke"} onClick={() => { if (window.confirm("Revoke this mandate? This cannot be undone.")) act("revoke", "revoke", { mandate_id: id }); }}>
                Revoke mandate
              </Btn>
            </Card>
          )}
          {isAgent && (mandate.state === "Revoked" || expired) && BigInt(mandate.bond_posted) > BigInt(0) && (
            <Card className="p-6">
              <Label>Bond</Label>
              <p className="mt-2 text-[15px] text-mute">You can take your {formatNear(mandate.bond_posted)} back once nothing is in flight.</p>
              <Btn className="mt-4 w-full" variant="outline" busy={busy === "wd"} onClick={() => act("wd", "withdraw_bond", { mandate_id: id })}>Withdraw bond</Btn>
            </Card>
          )}
          <Card className="p-6">
            <Label>Contract</Label>
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
  const error = !p || !d || t === null ? "Enter valid amounts" : d < p ? "Daily cap must be at least the per-payment cap" : t > p ? "Threshold cannot exceed the per-payment cap" : !(w >= 60 && w <= 86400) ? "Window must be 1 to 1,440 minutes" : null;
  const loosens = !error && (p! > BigInt(m.per_tx_cap) || d! > BigInt(m.daily_cap) || t! > BigInt(m.cooling_threshold) || w < m.challenge_window_s);
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-4">
        <Field label="Per payment"><input className={monoInputCls} value={perTx} onChange={(e) => setPerTx(e.target.value)} /></Field>
        <Field label="Per day"><input className={monoInputCls} value={daily} onChange={(e) => setDaily(e.target.value)} /></Field>
        <Field label="Pause above"><input className={monoInputCls} value={th} onChange={(e) => setTh(e.target.value)} /></Field>
        <Field label="Window (min)"><input className={monoInputCls} value={win} onChange={(e) => setWin(e.target.value)} /></Field>
      </div>
      {error ? <p className="text-[14px] text-bad">{error}</p> : <p className="text-[14px] text-mute">{loosens ? `This loosens a limit, so it takes effect after ${duration(m.challenge_window_s)}.` : "This only tightens limits, so it applies immediately."}</p>}
      <div className="flex gap-3">
        <Btn busy={busy} disabled={!!error} onClick={() => onSubmit({ per_tx_cap: p!.toString(), daily_cap: d!.toString(), cooling_threshold: t!.toString(), challenge_window_s: w })}>Save limits</Btn>
        <Btn variant="outline" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}
