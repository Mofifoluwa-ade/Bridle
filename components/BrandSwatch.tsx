"use client";

import { useState } from "react";

/** A colour chip. Click to copy the hex value. */
export function BrandSwatch({
  name,
  hex,
  use,
  dark = false,
}: {
  name: string;
  hex: string;
  use: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked; the value is on screen */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group overflow-hidden rounded-[18px] border border-line bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-border dark:bg-dark-card"
      aria-label={`${name} ${hex}. Click to copy.`}
    >
      <span
        className="flex h-24 items-end p-3 sm:h-28"
        style={{ backgroundColor: hex }}
      >
        <span className={`font-mono text-[11px] ${dark ? "text-white/80" : "text-ink/70"}`}>
          {copied ? "Copied" : "Copy"}
        </span>
      </span>
      <span className="block p-4">
        <span className="block text-[15px] font-semibold tracking-[-0.01em] text-ink dark:text-white">{name}</span>
        <span className="mt-0.5 block font-mono text-[12px] text-mute dark:text-dark-mute">{hex}</span>
        <span className="mt-2 block text-[13px] leading-[1.5] text-mute dark:text-dark-mute">{use}</span>
      </span>
    </button>
  );
}
