"use client";

import { useState } from "react";
import { CONFIG } from "@/lib/config";
import { formatNear, formatNearWithUsd } from "@/lib/format";
import type { Mandate, Proposal } from "@/lib/types";
import { Btn, Notice, inputCls } from "./ui";
import { useWallet } from "./WalletProvider";

/** Every action the connected account may take on one proposal. Shows only what applies. */
export function ProposalActions({ proposal: p, mandate: m, now, onDone }: { proposal: Proposal; mandate: Mandate; now: number; onDone: () => void }) {
  const { accountId, call, signIn } = useWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [flagging, setFlagging] = useState(false);

  const isOwner = accountId === m.owner;
  const execAt = Number(BigInt(p.executable_at) / BigInt(1_000_000));
  const windowOpen = now < execAt;
  const run = async (key: string, method: string, args: Record<string, unknown>, deposit?: string) => {
    setBusy(key);
    setErr(null);
    try {
      await call({ method, args, deposit });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const bondYocto = (BigInt(m.bond) / BigInt(10)).toString();
  const canVeto = isOwner && ["Waiting", "Ready", "Flagged"].includes(p.status);
  const canResolve = isOwner && p.status === "Flagged";
  const canExecute = (p.status === "Ready" || (p.status === "Waiting" && !windowOpen)) && m.state === "Active";
  const canFlag = p.status === "Waiting" && windowOpen && accountId !== m.owner && accountId !== m.agent;
  const canExpire = p.status === "Flagged" && !windowOpen;

  if (!canVeto && !canResolve && !canExecute && !canFlag && !canExpire) return null;
  if (!accountId)
    return (
      <div className="flex items-center gap-3">
        <Btn onClick={signIn}>Connect wallet to act</Btn>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {canResolve && (
          <>
            <Btn variant="dangerSolid" busy={busy === "confirm"} onClick={() => run("confirm", "resolve_flag", { proposal_id: p.id, confirm: true })}>
              Confirm flag and slash bond
            </Btn>
            <Btn variant="outline" busy={busy === "dismiss"} onClick={() => run("dismiss", "resolve_flag", { proposal_id: p.id, confirm: false })}>
              Dismiss flag
            </Btn>
          </>
        )}
        {canVeto && (
          <Btn variant="danger" busy={busy === "veto"} onClick={() => run("veto", "veto", { proposal_id: p.id })}>
            Veto payment
          </Btn>
        )}
        {canExecute && (
          <Btn variant="accent" busy={busy === "exec"} onClick={() => run("exec", "execute", { proposal_id: p.id })}>
            Clear for signing
          </Btn>
        )}
        {canExpire && (
          <Btn variant="outline" busy={busy === "expire"} onClick={() => run("expire", "expire_flag", { proposal_id: p.id })}>
            Close unanswered flag
          </Btn>
        )}
        {canFlag && !flagging && (
          <Btn variant="outline" onClick={() => setFlagging(true)}>
            Flag this payment
          </Btn>
        )}
      </div>

      {canFlag && flagging && (
        <div className="rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-card p-5 transition-colors">
          <p className="text-[15px] font-semibold text-ink dark:text-white">Why does this look wrong?</p>
          <input className={inputCls} maxLength={280} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="One sentence the owner can act on" />
          <p className="mt-2 text-[14px] text-mute dark:text-dark-mute">
            You stake {formatNearWithUsd(bondYocto)} in testnet NEAR (no real funds). If the owner confirms, you win 40% of the agent's bond. If the owner dismisses, your stake goes to the agent.
          </p>
          <div className="mt-4 flex gap-3">
            <Btn busy={busy === "flag"} disabled={!reason.trim()} onClick={() => run("flag", "flag", { proposal_id: p.id, reason: reason.trim() }, bondYocto)}>
              Stake testnet bond and flag
            </Btn>
            <Btn variant="outline" onClick={() => setFlagging(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
      {err && <Notice tone="bad" title="That did not go through">{err}</Notice>}
      <p className="text-[13px] text-mute dark:text-dark-mute">Signed with {accountId} on NEAR {CONFIG.network} (testnet · non-real funds).</p>
    </div>
  );
}
