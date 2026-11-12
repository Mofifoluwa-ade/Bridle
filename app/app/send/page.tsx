"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Btn, Card, Field, Notice, PageHeader, monoInputCls } from "@/components/app/ui";
import { parseNear, validNearAccount } from "@/lib/format";
import { accountExists } from "@/lib/near";
import { buildRequestLink } from "@/lib/request";

export default function SendPage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toId = to.trim().toLowerCase();
  const toOk = validNearAccount(toId);
  const amt = parseNear(amount.trim());
  const amtOk = amt !== null && amt > BigInt(0);

  const go = async () => {
    if (!toOk || !amtOk) return;
    setChecking(true);
    setErr(null);
    const exists = await accountExists(toId);
    setChecking(false);
    if (exists === false) {
      setErr(`${toId} does not exist on this network. Check the spelling.`);
      return;
    }
    // Hand off to the same pay page a request link opens, so there is one payment flow.
    const href = buildRequestLink("", { to: toId, amount: amount.trim(), memo });
    router.push(href);
  };

  return (
    <>
      <PageHeader
        title="Send a payment"
        lead="Pay someone with only their NEAR account name. They do not need to send you a link or share any contact details."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="space-y-6 p-5 sm:p-7 md:p-8">
          <Field label="Recipient's NEAR account" error={to && !toOk ? "Enter a valid NEAR account, such as them.testnet" : null}>
            <input className={monoInputCls} value={to} onChange={(e) => setTo(e.target.value.trim())} spellCheck={false} placeholder="them.testnet" />
          </Field>
          <Field label="Amount (NEAR)" error={amount && !amtOk ? "Enter an amount above zero" : null}>
            <input className={monoInputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.5" />
          </Field>
          <Field label="Note (optional)" hint="Up to 140 characters.">
            <input className={monoInputCls} value={memo} maxLength={140} onChange={(e) => setMemo(e.target.value)} />
          </Field>
          {err && <Notice tone="bad" title="Cannot continue">{err}</Notice>}
          <Btn size="lg" busy={checking} disabled={!toOk || !amtOk} onClick={go}>Review payment</Btn>
        </Card>
        <aside className="min-w-0">
          <Notice title="Check the account first">
            <p>Payments on NEAR cannot be reversed. You will see the full account name on the next screen before anything is sent. A mistyped name that happens to exist will still be paid.</p>
          </Notice>
        </aside>
      </div>
    </>
  );
}
