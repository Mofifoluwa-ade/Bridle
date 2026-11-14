"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClaimLinks } from "@/components/app/ClaimLinks";
import { QrCode } from "@/components/app/QrCode";
import { Btn, Card, Field, Label, Notice, PageHeader, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { formatNear, parseNear, validNearAccount } from "@/lib/format";
import { LINKDROP_ACCOUNT, LINKDROP_FEE, claimLink, newDrop, saveDrop } from "@/lib/linkdrop";
import { accountExists } from "@/lib/near";
import { buildRequestLink, cleanMemo } from "@/lib/request";

export default function SendPage() {
  const router = useRouter();
  const { accountId, call, signIn } = useWallet();
  const [mode, setMode] = useState<"account" | "link">("account");
  const [made, setMade] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const makeLink = async () => {
    if (!amtOk || amt === null) return;
    setCreating(true);
    setErr(null);
    setMade(null);
    try {
      const drop = newDrop();
      const m = cleanMemo(memo);
      // Save the key before the wallet opens: a wallet that redirects would otherwise lose it.
      saveDrop({ ...drop, amount: amt.toString(), memo: m, createdAt: Date.now(), from: accountId ?? "" });
      await call({ to: LINKDROP_ACCOUNT, method: "send", args: { public_key: drop.publicKey }, deposit: (amt + LINKDROP_FEE).toString(), gas: "30000000000000" });
      setMade(claimLink(window.location.origin, drop.secret, m));
      setRefresh((n) => n + 1);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the link.");
    } finally {
      setCreating(false);
    }
  };

  const copyMade = async () => {
    if (!made) return;
    try {
      await navigator.clipboard.writeText(made);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {}
  };

  const tab = (m: "account" | "link", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setErr(null);
      }}
      className={`relative z-10 flex-1 rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-200 ${mode === m ? "text-white dark:text-ink" : "text-mute hover:text-ink dark:text-dark-mute dark:hover:text-white"}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Send a payment"
        lead="Pay someone with only their NEAR account name, or send a claim link to anyone, even if they have no account yet."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6 lg:self-start">
        <Card className="space-y-6 p-5 sm:p-7 md:p-8">
          <div className="relative flex gap-1 rounded-full border border-line p-1 dark:border-dark-border" role="tablist">
              {/* The pill only moves with a transform, so switching never reflows the page. */}
              <span
                aria-hidden
                className="tab-pill absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-full bg-ink dark:bg-white"
                style={{ transform: mode === "link" ? "translateX(calc(100% + 4px))" : "translateX(0)" }}
              />
            {tab("account", "To a NEAR account")}
            {tab("link", "To anyone (claim link)")}
          </div>

          {mode === "account" && (
            <Field label="Recipient's NEAR account" error={to && !toOk ? "Enter a valid NEAR account, such as them.testnet" : null}>
              <input className={monoInputCls} value={to} onChange={(e) => setTo(e.target.value.trim())} spellCheck={false} placeholder="them.testnet" />
            </Field>
          )}
          <Field label="Amount (NEAR)" error={amount && !amtOk ? "Enter an amount above zero" : null}>
            <input className={monoInputCls} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1.5" />
          </Field>
          <Field label="Note (optional)" hint="Up to 140 characters.">
            <input className={monoInputCls} value={memo} maxLength={140} onChange={(e) => setMemo(e.target.value)} />
          </Field>
          {err && <Notice tone="bad" title="Cannot continue">{err}</Notice>}

          {mode === "account" ? (
            <Btn size="lg" busy={checking} disabled={!toOk || !amtOk} onClick={go}>Review payment</Btn>
          ) : !accountId ? (
            <Btn size="lg" onClick={signIn}>Connect wallet</Btn>
          ) : (
            <div>
              <Btn size="lg" busy={creating} disabled={!amtOk} onClick={makeLink}>Create claim link</Btn>
              {amtOk && amt !== null && (
                <p className="mt-3 text-[13px] leading-relaxed text-mute dark:text-dark-mute">
                  Your wallet will send {formatNear(amt + LINKDROP_FEE)}: {formatNear(amt)} for the recipient plus a {formatNear(LINKDROP_FEE)} fee kept by the linkdrop contract to cover creating their account.
                </p>
              )}
            </div>
          )}
        </Card>
        <ClaimLinks accountId={accountId} refreshKey={refresh} />
        </div>
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:self-start">
          {made && (
            <Card className="p-5 sm:p-6">
              <Label>Your claim link</Label>
              <p className="mt-3 break-all rounded-xl border border-line bg-paper p-3.5 font-mono text-[12.5px] leading-relaxed dark:border-dark-border dark:bg-dark-bg">{made}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Btn size="sm" onClick={copyMade}>{copiedLink ? "Copied" : "Copy link"}</Btn>
              </div>
              <div className="mt-5"><QrCode value={made} label="Claim link" filename="bridle-claim-link.png" /></div>
              <p className="mt-4 text-[12.5px] leading-relaxed text-mute dark:text-dark-mute">Anyone with this link can claim the money. Send it only to the person you mean to pay.</p>
            </Card>
          )}
          {mode === "account" ? (
            <Notice title="Check the account first">
              <p>Payments on NEAR cannot be reversed. You will see the full account name on the next screen before anything is sent. A mistyped name that happens to exist will still be paid.</p>
              <p className="mt-2">No NEAR account for them yet? Use a claim link instead.</p>
            </Notice>
          ) : (
            <Notice title="How a claim link works">
              <p>The money is locked against a one-time key that lives only in the link. The person you send it to opens it, picks a name for a new account (or uses one they have), and claims. They need no wallet and no gas.</p>
              <p className="mt-2">If nobody claims it, you can take it back from the list below, from this browser.</p>
            </Notice>
          )}
        </aside>
      </div>
    </>
  );
}
