"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { NeedsContract } from "@/components/app/Gate";
import { PaidReceipt } from "@/components/app/PaidReceipt";
import { PaymentHero, PaySteps } from "@/components/app/PaymentHero";
import { Btn, Card, Label, LinkBtn, Notice, Skeleton } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates } from "@/hooks/useMyData";
import { CONFIG } from "@/lib/config";
import { accountExists, api, txOutcome } from "@/lib/near";
import { useNow } from "@/hooks/usePoll";
import { formatNear, nsToMs, parseNear, unitOfMandate } from "@/lib/format";
import { parseRequest } from "@/lib/request";
import type { Mandate } from "@/lib/types";

const DAY_MS = 86_400_000;

export default function PayClient() {
  return (
    <>
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
  const [typed, setTyped] = useState("");
  const [exists, setExists] = useState<boolean | null>(null);
  const [check, setCheck] = useState<"checking" | "ok" | "failed" | "unknown">("checking");
  const txHash = (sp.get("transactionHashes") ?? "").split(",").pop() || null;
  const req = parseRequest((k) => sp.get(k));
  const toId = req.ok ? req.to : "";

  useEffect(() => {
    setExists(null);
    if (!toId) return;
    let live = true;
    accountExists(toId).then((v) => live && setExists(v));
    return () => {
      live = false;
    };
  }, [toId]);

  useEffect(() => {
    if (!txHash || !accountId) return;
    let live = true;
    setCheck("checking");
    txOutcome(txHash, accountId).then((v) => live && setCheck(v));
    return () => {
      live = false;
    };
  }, [txHash, accountId]);

  if (!req.ok) return <Notice tone="bad" title="This payment request is not valid">{req.error}</Notice>;
  const { to, memo } = req;
  // A link without an amount lets the payer choose; a link with one fixes it.
  const open = req.yocto === null;
  const typedYocto = parseNear(typed.trim());
  const yocto: bigint = req.yocto ?? (typedYocto !== null && typedYocto > BigInt(0) ? typedYocto : BigInt(0));
  const amount = req.amount ?? typed.trim();
  const ready = yocto > BigInt(0);

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

  const createHref = `/app/mandates/new?near=${encodeURIComponent(to)}${amount ? `&amount=${encodeURIComponent(amount)}` : ""}`;

  // Back from a redirect wallet: the wallet adds ?transactionHashes=. Prove it before celebrating.
  if (txHash && check === "ok") {
    return <PaidReceipt yocto={yocto > BigInt(0) ? yocto : null} to={to} from={accountId} memo={memo} hash={txHash} />;
  }
  if (done) {
    return <PaidReceipt yocto={yocto} to={to} from={accountId} memo={memo} hash={done} />;
  }

  const cta = !accountId ? (
    <Btn size="lg" className="w-full !bg-white !text-ink hover:!bg-gray-100" onClick={signIn}>Connect wallet to pay</Btn>
  ) : (
    <Btn size="lg" busy={paying} disabled={!ready || exists === false} className="w-full !bg-white !text-ink hover:!bg-gray-100" onClick={payNow}>
      {ready ? `Pay ${formatNear(yocto)}` : "Enter an amount"}
    </Btn>
  );

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {txHash && check === "checking" && <Notice title="Confirming your payment">Checking the transaction on NEAR.</Notice>}
      {txHash && check === "failed" && <div className="mb-6"><Notice tone="bad" title="That payment did not go through">The transaction was rejected, so no NEAR was sent. You can try again below.</Notice></div>}
      {txHash && check === "unknown" && <div className="mb-6"><Notice title="Payment submitted">I could not confirm it yet. <a className="underline" href={`${CONFIG.explorer}/txns/${txHash}`} target="_blank" rel="noopener noreferrer">Check the transaction ↗</a></Notice></div>}

      <PaymentHero
        label={open ? "Pay someone" : "Payment request"}
        to={to}
        memo={memo}
        exists={exists}
        amount={
          open ? (
            <>
              <input
                aria-label="Amount in NEAR"
                inputMode="decimal"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="0.0"
                className="w-full min-w-0 border-0 border-b border-white/20 bg-transparent pb-1 font-mono text-[44px] font-medium leading-none text-white placeholder:text-white/25 focus:border-accent-dark focus:outline-none sm:text-[56px]"
              />
              <span className="font-mono text-[20px] text-white/55">NEAR</span>
            </>
          ) : (
            <>
              <span className="font-mono text-[48px] font-medium leading-none sm:text-[64px]">{formatNear(yocto).replace(/ NEAR$/, "")}</span>
              <span className="font-mono text-[22px] text-white/55 sm:text-[26px]">NEAR</span>
            </>
          )
        }
      >
        {cta}
        {accountId && ready && (
          <p className="mt-3 text-center text-[12.5px] leading-relaxed text-white/50">
            One approval. It can pay only {to}, only this amount, and expires in a day. You need {formatNear(yocto)} plus network fees.
          </p>
        )}
        {open && typed && !ready && <p className="mt-3 text-center text-[12.5px] text-[#FFB4AB]">Enter an amount above zero.</p>}
      </PaymentHero>

      {err && <div className="mt-6"><Notice tone="bad" title="That did not go through">{err}</Notice></div>}

      {!accountId ? (
        <PaySteps amount={ready ? formatNear(yocto) : "the amount you choose"} to={to} />
      ) : mandates.loading ? (
        <Skeleton className="mt-6 h-40" />
      ) : mandates.error ? (
        <div className="mt-6"><Notice tone="bad" title="Could not read the contract">{mandates.error}</Notice></div>
      ) : (
        <div className="mt-8 space-y-4">
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
                  {ready && f.ok && isAgent && (
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
    </div>
  );
}
