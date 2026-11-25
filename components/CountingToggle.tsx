"use client";

import { useEffect, useState } from "react";
import { countingOptedOut, setCountingOptOut } from "@/lib/track";

/** Lets a visitor switch the anonymous counting off or back on from the privacy page. */
export function CountingToggle() {
  const [off, setOff] = useState<boolean | null>(null);
  useEffect(() => setOff(countingOptedOut()), []);
  if (off === null) return null;
  return (
    <div className="mt-10 max-w-3xl rounded-2xl border border-line p-5 dark:border-dark-border">
      <h2 className="text-lg font-semibold text-ink dark:text-white">Your choice</h2>
      <p className="mt-2 text-sm leading-7 text-mute dark:text-dark-mute">
        Anonymous counting is <strong className="text-ink dark:text-white">{off ? "off" : "on"}</strong> in this browser.
      </p>
      <button
        type="button"
        onClick={() => {
          setCountingOptOut(!off);
          setOff(!off);
        }}
        className="mt-3 h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink hover:bg-paper dark:border-dark-border dark:text-white dark:hover:bg-dark-card-hover"
      >
        {off ? "Turn counting on" : "Turn counting off"}
      </button>
    </div>
  );
}
