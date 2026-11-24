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
      className="fixed inset-x-3 bottom-3 z-[60] animate-fade-in sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[24rem]"
    >
      <div className="rounded-2xl border border-line bg-white p-5 shadow-xl dark:border-dark-border dark:bg-dark-card">
        <p className="font-mono text-[11px] uppercase tracking-label text-accent dark:text-accent-dark">Privacy</p>
        <h2 className="mt-1.5 text-[16px] font-semibold text-ink dark:text-white">No cookies. Just a head count.</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-mute dark:text-dark-mute">
          Bridle sets no cookies and runs no ad trackers. Once a day, when you visit, we add 1 to an anonymous total. We never store your wallet, IP address or anything that identifies you.{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4 dark:text-white">
            Read the details
          </Link>
          .
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="h-10 rounded-xl bg-ink text-[13.5px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-ink"
          >
            Sounds good
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="h-10 rounded-xl border border-line text-[13.5px] font-semibold text-ink hover:bg-paper dark:border-dark-border dark:text-white dark:hover:bg-dark-card-hover"
          >
            Don&apos;t count me
          </button>
        </div>
      </div>
    </div>
  );
}
