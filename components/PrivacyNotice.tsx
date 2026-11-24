"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setCountingOptOut, trackingConfigured } from "@/lib/track";

const SEEN_KEY = "bridle_privacy_seen";

/**
 * A plain notice, not a cookie wall: Bridle sets no cookies and has no ad trackers.
 * It tells people what is counted and lets them switch the counting off.
 */
export function PrivacyNotice() {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!trackingConfigured) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  const close = (optOut: boolean) => {
    if (optOut) setCountingOptOut(true);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy notice"
      className="fixed inset-x-3 bottom-3 z-[60] animate-fade-in sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[26rem]"
    >
      <div className="rounded-2xl border border-line bg-white p-3.5 shadow-lg dark:border-dark-border dark:bg-dark-card">
        <p className="text-[13px] leading-snug text-mute dark:text-dark-mute">
          <span className="font-semibold text-ink dark:text-white">No cookies.</span> We add 1 to an anonymous daily visitor count.{" "}
          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            className="inline-flex items-center gap-0.5 font-medium text-ink underline underline-offset-4 dark:text-white"
          >
            {more ? "Less" : "Details"}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${more ? "rotate-180" : ""}`} aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </p>

        {more && (
          <ul className="mt-2.5 space-y-1.5 border-t border-line pt-2.5 text-[12.5px] leading-snug text-mute dark:border-dark-border dark:text-dark-mute">
            <li>Counted: a +1 on a daily total for the kind of page you opened, once a day per browser.</li>
            <li>Never stored: your wallet, IP address, device or anything that identifies you.</li>
            <li>No cookies and no ad trackers. A note of today&apos;s date stays in your browser only.</li>
            <li>
              <Link href="/privacy" className="font-medium text-ink underline underline-offset-4 dark:text-white">
                Read the full policy
              </Link>
            </li>
          </ul>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => close(true)}
            className="h-9 rounded-lg border border-line bg-white text-[13px] font-semibold text-ink hover:bg-paper dark:border-dark-border dark:bg-dark-card dark:text-white dark:hover:bg-dark-card-hover"
          >
            Don&apos;t count me
          </button>
          <button
            type="button"
            onClick={() => close(false)}
            className="h-9 rounded-lg bg-ink text-[13px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-ink"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
