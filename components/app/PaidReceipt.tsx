"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { formatNear } from "@/lib/format";
import { AccountAvatar } from "./AccountAvatar";
import { LinkBtn } from "./ui";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="receipt-row flex items-baseline justify-between gap-6 py-3 text-[14.5px]">
      <dt className="shrink-0 text-mute dark:text-dark-mute">{k}</dt>
      <dd className="min-w-0 break-all text-right font-mono text-[13.5px]">{children}</dd>
    </div>
  );
}

/** The screen after a payment settles: confirmation first, then a receipt worth keeping. */
export function PaidReceipt({
  yocto,
  to,
  from,
  memo,
  hash,
  oneOff = true,
  heading = "Payment sent",
  actions,
  extra,
}: {
  yocto: bigint | null;
  to: string;
  from: string | null;
  memo?: string;
  hash: string;
  oneOff?: boolean;
  heading?: string;
  /** Replaces the default buttons. */
  actions?: React.ReactNode;
  /** Shown between the receipt and the buttons. */
  extra?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [when] = useState(() => new Date());
  const [shown, setShown] = useState(0);

  // Count the amount up once, so it lands rather than just appearing.
  const target = yocto === null ? 0 : Number(formatNear(yocto).replace(/ NEAR$/, ""));
  useEffect(() => {
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      setShown(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const url = `${CONFIG.explorer}/txns/${hash}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const decimals = target % 1 === 0 ? 0 : Math.min(4, (String(target).split(".")[1] ?? "").length);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="text-center">
        <div className="paid-ring mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path className="paid-check" d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="paid-fade mt-6 font-mono text-xs uppercase tracking-label text-accent dark:text-accent-dark" style={{ animationDelay: "0.25s" }}>{heading}</p>
        <p className="paid-fade mt-2 font-mono text-[44px] font-medium leading-none sm:text-[56px]" style={{ animationDelay: "0.3s" }}>
          {shown.toFixed(decimals)} <span className="text-[22px] text-mute dark:text-dark-mute sm:text-[26px]">NEAR</span>
        </p>
        <p className="paid-fade mt-4 inline-flex items-center gap-2 text-[15px] text-mute dark:text-dark-mute" style={{ animationDelay: "0.4s" }}>
          to <AccountAvatar id={to} size={22} /> <span className="font-mono text-ink dark:text-white">{to}</span>
        </p>
      </div>

      <div className="paid-fade relative mt-9 rounded-3xl border border-line bg-white p-6 dark:border-dark-border dark:bg-dark-card sm:p-7" style={{ animationDelay: "0.5s" }}>
        <p className="font-mono text-xs uppercase tracking-label text-mute dark:text-dark-mute">Receipt</p>
        <dl className="mt-2 divide-y divide-line dark:divide-dark-border">
          <Row k="Amount">{yocto === null ? "—" : formatNear(yocto)}</Row>
          <Row k="To">{to}</Row>
          {from && <Row k="From">{from}</Row>}
          {memo && <Row k="Note"><span className="font-sans text-[14.5px]">{memo}</span></Row>}
          <Row k="Network">NEAR {CONFIG.network}</Row>
          {oneOff && <Row k="Rule"><span className="font-sans text-[14.5px]">One-off, expires in 24 hours</span></Row>}
          <Row k="Time">{when.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</Row>
        </dl>
        <div className="relative -mx-6 mt-2 border-t border-dashed border-line px-6 pt-4 dark:border-dark-border sm:-mx-7 sm:px-7">
          <span aria-hidden className="absolute -left-2.5 -top-[11px] h-5 w-5 rounded-full border border-line border-l-transparent bg-paper dark:border-dark-border dark:border-l-transparent dark:bg-dark-bg" />
          <span aria-hidden className="absolute -right-2.5 -top-[11px] h-5 w-5 rounded-full border border-line border-r-transparent bg-paper dark:border-dark-border dark:border-r-transparent dark:bg-dark-bg" />
          <p className="font-mono text-[11px] uppercase tracking-label text-mute dark:text-dark-mute">Transaction</p>
          <p className="mt-1 break-all font-mono text-[13px]">{hash}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
            <a className="underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">View on explorer ↗</a>
            <button type="button" onClick={copy} className="underline underline-offset-4">{copied ? "Link copied" : "Copy receipt link"}</button>
          </div>
        </div>
      </div>

      {extra && <div className="paid-fade mt-6" style={{ animationDelay: "0.55s" }}>{extra}</div>}

      <div className="paid-fade mt-7 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.6s" }}>
        {actions ?? (
          <>
            <LinkBtn href="/app/send" variant="primary">Send another payment</LinkBtn>
            <LinkBtn href="/app">Back to dashboard</LinkBtn>
          </>
        )}
      </div>
      <p className="paid-fade mt-5 text-center text-[12.5px] text-mute dark:text-dark-mute" style={{ animationDelay: "0.65s" }}>Testnet tokens. No real funds moved.</p>
    </div>
  );
}
