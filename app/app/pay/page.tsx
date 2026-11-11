"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { NeedsContract } from "@/components/app/Gate";
import { TxBanner } from "@/components/app/TxBanner";
import { Addr, Btn, Card, Label, LinkBtn, Notice, PageHeader, Skeleton } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates } from "@/hooks/useMyData";
import { api } from "@/lib/near";
import { useNow } from "@/hooks/usePoll";
import { formatNear, nsToMs, unitOfMandate } from "@/lib/format";
import { parseRequest } from "@/lib/request";
import type { Mandate } from "@/lib/types";

const DAY_MS = 86_400_000;

export default function PayPage() {
  return (
    <>
      <PageHeader title="Payment request" lead="Someone asked you to pay them NEAR. Check the details, then pay under one of your spending rules." />
      <NeedsContract>
        <Suspense fallback={null}>
          <Body />
        </Suspense>
      </NeedsContract>
    </>
  );
}

/** Whether a rule can pay this request right now, and why not if it cannot. */
function fit(m: Mandate, to: string, amount: bigint, nowMs: number): { ok: boolean; why?: string; review: boolean } {
  if (m.state !== "Active") return { ok: false, why: "Revoked", review: false };
  if (nsToMs(m.expires_at) <= nowMs) return { ok: false, why: "Expired", review: false };
  if (!m.allowlist.some((r) => r.chain === "Near" && r.address === to)) return { ok: false, why: "This account is not on its approved list", review: false };
  if (amount > BigInt(m.per_tx_cap)) return { ok: false, why: "Over its per-payment cap", review: false };
  const today = Math.floor(nowMs / DAY_MS) === m.day_index;
  const spent = today ? BigInt(m.spent_today) : BigInt(0);
  if (spent + amount > BigInt(m.daily_cap)) return { ok: false, why: "Over today's cap", review: false };
  if (BigInt(m.bond_posted) < BigInt(m.bond)) return { ok: false, why: "Agent deposit not posted", review: false };
  return { ok: true, review: amount > BigInt(m.cooling_threshold) };
}

function Body() {
  const sp = useSearchParams();
  const router = useRouter();
  const now = useNow(30_000);
  const { accountId, call, callBatch, signIn } = useWallet();
  const mandates = useMyMandates();
  const [busy, setBusy] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const req = parseRequest((k) => sp.get(k));

  if (!req.ok) return <Notice tone="bad" title="This payment request is not valid">{req.error}</Notice>;
  const { to, amount, yocto, memo } = req;

  const nearRules = (mandates.data ?? []).filter((m) => unitOfMandate(m) === "NEAR");
  const rows = nearRules.map((m) => ({ m, f: fit(m, to, yocto, now) }));
  const usable = rows.filter((r) => r.f.ok);

  const send = async (m: Mandate) => {
    setBusy(m.id);
    setErr(null);
    try {
      await call({ method: "propose_payment", args: { mandate_id: m.id, chain: "Near", asset: "NEAR", amount: yocto.toString(), recipient: to } });
      router.push(`/app/mandates/${m.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  // One click: a one-off rule for this payee and amount, funded, proposed and paid, in ONE transaction.
  // The ids are read first. If another rule or payment lands in between, the contract refuses the
  // whole batch (a wrong id fails the owner check), so nothing half-happens and you can try again.
  const payNow = async () => {
    if (!accountId) return;
    setPaying(true);
    setErr(null);
    try {
      const c = await api.counts();
      const mid = c.mandates + 1;
      const pid = c.proposals + 1;
      const amt = yocto.toString();
      const hash = await callBatch([
        {
          method: "create_mandate",
          gas: "30000000000000",
          args: {
            agent: accountId,
            chains: ["Near"],
            assets: ["NEAR"],
            allowlist: [{ chain: "Near", address: to }],
            per_tx_cap: amt,
            daily_cap: amt,
            cooling_threshold: amt,
            challenge_window_s: 60,
            bond: "0",
            expiry_days: 1,
          },
        },
        { method: "fund_mandate", gas: "30000000000000", deposit: amt, args: { mandate_id: mid } },
        { method: "propose_payment", gas: "30000000000000", args: { mandate_id: mid, chain: "Near", asset: "NEAR", amount: amt, recipient: to } },
        { method: "execute", gas: "60000000000000", args: { proposal_id: pid } },
      ]);
      if (hash) {
        // Extension wallets return here; check what happened instead of assuming.
        await new Promise((r) => setTimeout(r, 2500));
        const p = await api.proposal(pid).catch(() => null);
        if (p && p.mandate_id === mid && p.status === "Executed") setDone(hash);
        else if (p && p.mandate_id === mid) router.push(`/app/mandates/${mid}`);
        else setErr("The transaction was sent, but I could not confirm the payment. Check your rules page.");
      }
      // Redirect wallets come back to this page with ?transactionHashes=..., shown by the banner above.
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPaying(false);
    }
  };

  const createHref = `/app/mandates/new?near=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;

  return (
    <>
      <TxBanner what="Payment request" />
      <Card className="p-5 sm:p-7 md:p-8">
        <Label>Request</Label>
        <p className="mt-3 font-mono text-[30px] font-medium leading-tight sm:text-[40px]">{formatNear(yocto)}</p>
        <dl className="mt-5 space-y-3 text-[15px]">
          <div>
            <dt className="text-mute">To</dt>
            <dd className="mt-0.5"><Addr value={to} chars={40} /></dd>
          </div>
          {memo && (
            <div>
              <dt className="text-mute">Note from the requester</dt>
              <dd className="mt-0.5">{memo}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 text-[13px] leading-relaxed text-mute">
          Anyone can make a link like this. Check that the account is the one you mean before you pay. Payments on NEAR cannot be reversed.
        </p>
      </Card>

      {err && <div className="mt-6"><Notice tone="bad" title="That did not go through">{err}</Notice></div>}

      {!accountId ? (
        <div className="mt-6">
          <Notice title="Connect your wallet to pay">
            <Btn className="mt-3" size="sm" onClick={signIn}>Connect wallet</Btn>
          </Notice>
        </div>
      ) : mandates.loading ? (
        <Skeleton className="mt-6 h-40" />
      ) : mandates.error ? (
        <div className="mt-6"><Notice tone="bad" title="Could not read the contract">{mandates.error}</Notice></div>
      ) : (
        <div className="mt-6 space-y-4">
          {done ? (
            <Notice title="Paid">
              <p>{formatNear(yocto)} was sent to {to}.</p>
              <a className="mt-2 inline-block underline" href={`https://testnet.nearblocks.io/txns/${done}`} target="_blank" rel="noopener noreferrer">View the transaction ↗</a>
            </Notice>
          ) : (
            <Card className="p-5 sm:p-6">
              <Btn size="lg" busy={paying} onClick={payNow}>Pay {formatNear(yocto)} now</Btn>
              <p className="mt-3 text-[13px] leading-relaxed text-mute">
                One approval. It makes a one-off rule that can pay only {to}, only this amount, expires in a day, and sends the payment. You need {formatNear(yocto)} plus network fees in your wallet.
              </p>
            </Card>
          )}
          <Label>Or pay under one of your existing NEAR rules</Label>
          {usable.length === 0 && (
            <Notice title="None of your rules can pay this yet">
              <p>A rule only pays accounts on its approved list, and that list is fixed when the rule is created. Make a rule for this payment: it fills in the recipient and amount for you.</p>
              <LinkBtn className="mt-3" href={createHref}>Create a rule for this payment</LinkBtn>
            </Notice>
          )}
          {rows.map(({ m, f }) => {
            const isAgent = m.agent === accountId;
            return (
              <Card key={m.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Rule #{m.id}</p>
                    <p className="mt-0.5 text-[14px] text-mute">
                      {f.ok
                        ? f.review ? "Allowed, but above its review threshold: it waits for the owner to approve." : "Allowed. Within every limit."
                        : `Cannot pay this: ${f.why}.`}
                    </p>
                  </div>
                  {f.ok && isAgent && (
                    <Btn busy={busy === m.id} onClick={() => send(m)}>Propose this payment</Btn>
                  )}
                </div>
                {f.ok && !isAgent && (
                  <p className="mt-3 text-[13px] text-mute">
                    This rule's agent is <span className="font-mono">{m.agent}</span>; only the agent can propose payments. Ask it to pay {formatNear(yocto)} to {to} under rule #{m.id}, or sign in as the agent.
                  </p>
                )}
              </Card>
            );
          })}
          {usable.length > 0 && (
            <p className="text-[13px] text-mute">
              Proposing sends the payment to the rule's checks. Once cleared, approve it on the rule page and the NEAR is paid from that rule's balance. Make sure the rule has enough NEAR added.
            </p>
          )}
        </div>
      )}
    </>
  );
}
