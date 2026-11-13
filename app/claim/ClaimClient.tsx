"use client";

import { useEffect, useState } from "react";
import { PaidReceipt } from "@/components/app/PaidReceipt";
import { Btn, LinkBtn, Notice } from "@/components/app/ui";
import { formatNear, validNearAccount } from "@/lib/format";
import { claimToAccount, claimToNewAccount, keyBalance, publicKeyOf, validNewName } from "@/lib/linkdrop";
import { accountExists } from "@/lib/near";

type Done = { hash: string; account: string; recoveryKey?: string };

const field =
  "w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 font-mono text-[15px] text-white placeholder:text-white/30 focus:border-accent-dark focus:outline-none";

function RecoveryKey({ value, saved, onSaved }: { value: string; saved: boolean; onSaved: (v: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const download = () => {
    const url = URL.createObjectURL(new Blob([`Bridle account recovery key\n\n${value}\n\nAnyone with this key controls the account. Keep it private.\n`], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bridle-recovery-key.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="rounded-3xl border border-warn/40 bg-warn/[0.06] p-5 sm:p-6">
      <p className="font-semibold">Save your recovery key now</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-mute dark:text-dark-mute">
        This key is the only way into your new account. Bridle cannot recover it for you. You can import it into any NEAR wallet later using &ldquo;import with private key&rdquo;.
      </p>
      <p className="mt-4 break-all rounded-xl border border-line bg-white p-3.5 font-mono text-[12.5px] leading-relaxed dark:border-dark-border dark:bg-dark-bg">
        {shown ? value : "•".repeat(48)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn size="sm" variant="outline" onClick={() => setShown((v) => !v)}>{shown ? "Hide" : "Show"}</Btn>
        <Btn size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }}>{copied ? "Copied" : "Copy"}</Btn>
        <Btn size="sm" variant="outline" onClick={download}>Download</Btn>
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-[14px]">
        <input type="checkbox" checked={saved} onChange={(e) => onSaved(e.target.checked)} className="h-4 w-4 accent-[#0A7C59]" />
        I have saved it somewhere safe
      </label>
    </div>
  );
}

export default function ClaimClient() {
  const [secret, setSecret] = useState<string | null | undefined>(undefined);
  const [memo, setMemo] = useState("");
  const [bal, setBal] = useState<bigint | null | undefined>(undefined);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [existing, setExisting] = useState("");
  const [avail, setAvail] = useState<boolean | null>(null);
  const [existsAcct, setExistsAcct] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    setSecret(h && publicKeyOf(h) ? h : null);
    setMemo((new URLSearchParams(window.location.search).get("m") ?? "").slice(0, 140));
  }, []);

  useEffect(() => {
    if (!secret) return;
    let live = true;
    keyBalance(publicKeyOf(secret)!).then((b) => live && setBal(b));
    return () => {
      live = false;
    };
  }, [secret]);

  const full = `${name}.testnet`;
  useEffect(() => {
    setAvail(null);
    if (!validNewName(name)) return;
    let live = true;
    const t = setTimeout(() => accountExists(full).then((v) => live && setAvail(v === null ? null : !v)), 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [name, full]);

  useEffect(() => {
    setExistsAcct(null);
    if (!validNearAccount(existing)) return;
    let live = true;
    const t = setTimeout(() => accountExists(existing).then((v) => live && setExistsAcct(v)), 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [existing]);

  // Do not let the page close on a new account whose key has not been saved.
  useEffect(() => {
    if (!done?.recoveryKey || saved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [done, saved]);

  const nameOk = validNewName(name) && avail !== false;
  const existingOk = validNearAccount(existing) && existsAcct !== false;
  const ready = mode === "new" ? nameOk : existingOk;

  const claim = async () => {
    if (!secret || !ready) return;
    setBusy(true);
    setErr(null);
    try {
      if (mode === "new") {
        const r = await claimToNewAccount(secret, full);
        setDone({ hash: r.hash, account: full, recoveryKey: r.recoveryKey });
      } else {
        const hash = await claimToAccount(secret, existing);
        setDone({ hash, account: existing });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not claim this payment.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <PaidReceipt
        heading="Payment received"
        yocto={bal ?? null}
        to={done.account}
        from={null}
        memo={memo}
        hash={done.hash}
        oneOff={false}
        extra={done.recoveryKey ? <RecoveryKey value={done.recoveryKey} saved={saved} onSaved={setSaved} /> : undefined}
        actions={
          done.recoveryKey && !saved ? (
            <p className="text-[13.5px] text-mute dark:text-dark-mute">Save your recovery key to continue.</p>
          ) : (
            <LinkBtn href="/" variant="primary">Done</LinkBtn>
          )
        }
      />
    );
  }

  if (secret === undefined || (secret && bal === undefined)) {
    return <div className="mx-auto h-72 w-full max-w-[520px] animate-pulse rounded-[28px] bg-ink/10 dark:bg-white/10" />;
  }

  if (secret === null || bal === null) {
    const invalid = secret === null;
    return (
      <div className="mx-auto w-full max-w-[520px] text-center">
        <div className="rounded-[28px] border border-line bg-white p-8 shadow-sm dark:border-dark-border dark:bg-dark-card sm:p-11">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${invalid ? "bg-warn/15 text-warn" : "bg-accent-tint text-accent dark:bg-accent-dark/10 dark:text-accent-dark"}`} aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {invalid ? <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></> : <path d="m5 12.5 4.5 4.5L19 7.5" />}
            </svg>
          </div>
          <h1 className="mt-5 text-[22px] font-semibold tracking-tight sm:text-[26px]">{invalid ? "This link looks incomplete" : "This payment was already claimed"}</h1>
          <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-relaxed text-mute dark:text-dark-mute">
            {invalid
              ? "Part of the link may have been cut off. Ask the sender to share it again, and make sure the whole link is copied."
              : "The money has already been collected, so there is nothing left to claim here. If it was not you, let the sender know."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
            <LinkBtn href="/" variant="outline">What is Bridle?</LinkBtn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <section className="pay-hero relative overflow-hidden rounded-[28px] bg-ink p-6 text-white shadow-[0_24px_60px_-28px_rgba(14,17,22,0.7)] sm:p-9">
        <div aria-hidden className="pay-hero-glow pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full" />
        <div aria-hidden className="pay-hero-dots pointer-events-none absolute inset-0" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-dark" />A payment for you
          </span>
          <div className="mt-8 flex items-end gap-3">
            <span className="font-mono text-[48px] font-medium leading-none sm:text-[64px]">{formatNear(bal!).replace(/ NEAR$/, "")}</span>
            <span className="font-mono text-[22px] text-white/55 sm:text-[26px]">NEAR</span>
          </div>
          {memo && (
            <p className="mt-6 rounded-2xl bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-white/85">
              <span className="mr-1 text-white/40">&ldquo;</span>{memo}<span className="ml-0.5 text-white/40">&rdquo;</span>
            </p>
          )}

          <div className="mt-7 flex gap-1 rounded-full border border-white/15 p-1" role="tablist">
            {(["new", "existing"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setErr(null); }} className={`flex-1 rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors ${mode === m ? "bg-white text-ink" : "text-white/60 hover:text-white"}`}>
                {m === "new" ? "Create my account" : "I have an account"}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {mode === "new" ? (
              <>
                <label className="font-mono text-[11px] uppercase tracking-label text-white/50" htmlFor="nm">Choose a name</label>
                <div className="mt-2 flex items-center gap-2">
                  <input id="nm" className={field} value={name} placeholder="yourname" spellCheck={false} autoCapitalize="none" onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} />
                  <span className="shrink-0 font-mono text-[14px] text-white/55">.testnet</span>
                </div>
                <p className="mt-2 min-h-[20px] text-[13px]">
                  {name && !validNewName(name) && <span className="text-[#FFB4AB]">Use 2 or more letters or numbers. Dashes and underscores are fine in the middle.</span>}
                  {validNewName(name) && avail === true && <span className="text-accent-dark">✓ {full} is available</span>}
                  {validNewName(name) && avail === false && <span className="text-[#FFB4AB]">✗ {full} is taken</span>}
                </p>
              </>
            ) : (
              <>
                <label className="font-mono text-[11px] uppercase tracking-label text-white/50" htmlFor="ex">Your NEAR account</label>
                <input id="ex" className={`${field} mt-2`} value={existing} placeholder="you.testnet" spellCheck={false} autoCapitalize="none" onChange={(e) => setExisting(e.target.value.trim().toLowerCase())} />
                <p className="mt-2 min-h-[20px] text-[13px]">
                  {existing && !validNearAccount(existing) && <span className="text-[#FFB4AB]">That is not a valid NEAR account name.</span>}
                  {validNearAccount(existing) && existsAcct === true && <span className="text-accent-dark">✓ Account found</span>}
                  {validNearAccount(existing) && existsAcct === false && <span className="text-[#FFB4AB]">✗ That account does not exist on this network</span>}
                </p>
              </>
            )}
          </div>

          {err && <p className="mt-2 text-[13.5px] text-[#FFB4AB]">{err}</p>}
          <Btn size="lg" busy={busy} disabled={!ready} className="mt-4 w-full !bg-white !text-ink hover:!bg-gray-100" onClick={claim}>
            {mode === "new" ? "Create account and claim" : "Claim"}
          </Btn>
          <p className="mt-4 text-center text-[12.5px] leading-relaxed text-white/50">
            Free to claim. No wallet, no gas, nothing to buy first.{mode === "new" ? " You will get a recovery key to save." : ""}
          </p>
        </div>
      </section>

      <p className="mt-6 text-center text-[12.5px] leading-relaxed text-mute dark:text-dark-mute">
        Anyone with this link can claim this payment, so do not share it.
      </p>
    </div>
  );
}
