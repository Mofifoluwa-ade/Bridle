"use client";

import { useEffect, useState } from "react";
import { Btn, Card, Field, Label, Notice, PageHeader, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { parseNear, validNearAccount } from "@/lib/format";
import { QrCode } from "@/components/app/QrCode";
import { buildRequestLink } from "@/lib/request";

export default function RequestPage() {
  const { accountId } = useWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("1");
  const [anyAmount, setAnyAmount] = useState(false);
  const [memo, setMemo] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (accountId && !to) setTo(accountId);
  }, [accountId, to]);

  const amt = parseNear(amount);
  const toOk = validNearAccount(to.trim());
  const amtOk = anyAmount || (amt !== null && amt > BigInt(0));
  const link = toOk && amtOk && typeof window !== "undefined"
    ? buildRequestLink(window.location.origin, { to: to.trim(), amount: anyAmount ? "" : amount.trim(), memo })
    : null;

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the link is still shown for manual copy */
    }
  };

  return (
    <>
      <PageHeader
        title="Request a payment"
        lead="Make a link that asks someone to pay you NEAR. They open it, check it, and pay through their own Bridle rule. Nothing moves until they approve."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="space-y-6 p-5 sm:p-7 md:p-8">
          <Field label="Pay to (your NEAR account)" error={to && !toOk ? "Enter a valid NEAR account, such as you.testnet" : null}>
            <input className={monoInputCls} value={to} onChange={(e) => setTo(e.target.value.trim())} spellCheck={false} placeholder="you.testnet" />
          </Field>
          <Field label="Amount (NEAR)" error={!anyAmount && amount && !amtOk ? "Enter an amount above zero" : null}>
            <input className={`${monoInputCls} disabled:opacity-40`} inputMode="decimal" value={anyAmount ? "" : amount} disabled={anyAmount} placeholder={anyAmount ? "The payer chooses" : ""} onChange={(e) => setAmount(e.target.value)} />
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[14px]">
              <input type="checkbox" checked={anyAmount} onChange={(e) => setAnyAmount(e.target.checked)} className="h-4 w-4 accent-[#0A7C59]" />
              Let the payer choose the amount (a standing &ldquo;pay me&rdquo; link)
            </label>
          </Field>
          <Field label="What is it for? (optional)" hint="Up to 140 characters. The payer sees this text, so keep it plain.">
            <input className={monoInputCls} value={memo} maxLength={140} onChange={(e) => setMemo(e.target.value)} placeholder="Lunch, invoice 12, ..." />
          </Field>
          {link ? (
            <div>
              <Label>Your link</Label>
              <p className="mt-2 break-all rounded-xl border border-line bg-paper p-3.5 font-mono text-[13px] dark:border-dark-border dark:bg-dark-bg">{link}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Btn onClick={copy}>{copied ? "Copied" : "Copy link"}</Btn>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <Btn variant="outline" onClick={() => navigator.share({ title: "Payment request", url: link }).catch(() => {})}>Share</Btn>
                )}
              </div>
              <div className="mt-6">
                <Label>QR code</Label>
                <div className="mt-2"><QrCode value={link} /></div>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-mute">Fill in your account and an amount to get a link.</p>
          )}
        </Card>
        <aside className="space-y-6 min-w-0">
          <Notice title="How it works">
            <p>Your NEAR account name is your username: nobody needs your phone number or email, only the link, the QR code, or your account name on the Send a payment page. Leave the amount open and the same link works as a standing pay-me link.</p>
            <p className="mt-2">The link only carries who to pay, how much (if you set it), and a note. It cannot take money. The payer must have a spending rule that allows paying you, or create one from the link, and their agent proposes the payment.</p>
          </Notice>
        </aside>
      </div>
    </>
  );
}
