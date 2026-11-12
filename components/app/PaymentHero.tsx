import type { ReactNode } from "react";
import { AccountAvatar } from "./AccountAvatar";

/**
 * The payment card: who gets paid, how much, and the one button that matters.
 * Always dark, so the amount is the loudest thing on the page in light and dark mode alike.
 */
export function PaymentHero({
  label,
  amount,
  to,
  memo,
  exists,
  children,
}: {
  label: string;
  /** Pass a node (an input) when the payer chooses the amount, or the formatted amount. */
  amount: ReactNode;
  to: string;
  memo?: string;
  exists: boolean | null;
  children?: ReactNode;
}) {
  return (
    <section className="pay-hero relative overflow-hidden rounded-[28px] bg-ink p-6 text-white shadow-[0_24px_60px_-28px_rgba(14,17,22,0.7)] sm:p-9">
      <div aria-hidden className="pay-hero-glow pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full" />
      <div aria-hidden className="pay-hero-dots pointer-events-none absolute inset-0" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-dark" />
            {label}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-white/55">NEAR testnet</span>
        </div>

        <div className="mt-8 flex items-end gap-3">{amount}</div>

        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <AccountAvatar id={to} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-label text-white/50">Paying</p>
            <p className="font-mono text-[15px] leading-snug [overflow-wrap:anywhere]">{to}</p>
            {exists === true && <p className="mt-1.5 text-[12.5px] font-medium text-accent-dark">✓ Account found on this network</p>}
            {exists === false && <p className="mt-1.5 text-[12.5px] font-medium text-[#FFB4AB]">✗ Account not found</p>}
          </div>
        </div>

        {memo && (
          <p className="mt-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-[15px] leading-relaxed text-white/85">
            <span className="mr-1 text-white/40">&ldquo;</span>{memo}<span className="ml-0.5 text-white/40">&rdquo;</span>
          </p>
        )}

        {exists === false && (
          <p className="mt-3 text-[13.5px] font-medium text-[#FFB4AB]">This account does not exist on this network. Do not pay it.</p>
        )}

        <div className="mt-7">{children}</div>

        <p className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed text-white/50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Anyone can make a link like this. Check the account is the one you mean. Payments on NEAR cannot be reversed.
        </p>
      </div>
    </section>
  );
}

/** Three plain steps, shown before a wallet is connected, so nobody wonders what happens next. */
export function PaySteps({ amount, to }: { amount: string; to: string }) {
  const steps = [
    { t: "Connect a wallet", d: "Any NEAR testnet account. Nothing is sent yet." },
    { t: "Approve once", d: `One approval sets up a rule that can pay only ${to}, only ${amount}, and expires in a day.` },
    { t: "Get your receipt", d: "The payment settles on NEAR and you see a receipt you can keep." },
  ];
  return (
    <ol className="mt-8 space-y-5">
      {steps.map((s, i) => (
        <li key={s.t} className="flex gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[13px] text-accent dark:border-dark-border dark:text-accent-dark">{i + 1}</span>
          <div className="min-w-0 pt-1">
            <p className="font-semibold leading-tight">{s.t}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-mute dark:text-dark-mute">{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
