"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChainLogo, type Chain as LogoKey } from "@/components/ChainLogo";
import type { Chain } from "@/lib/types";

const KEY: Record<Chain, LogoKey> = { Base: "base", Solana: "solana", Near: "near" };
const LABEL: Record<Chain, string> = { Base: "Base", Solana: "Solana", Near: "NEAR" };

/** A network's logo with its name beside it. Pass `name={false}` for the logo alone. */
export function ChainTag({ chain, size = 18, name = true, className = "" }: { chain: Chain; size?: number; name?: boolean; className?: string }) {
  return (
    <span title={name ? undefined : LABEL[chain]} className={`inline-flex items-center gap-2 ${className}`}>
      <ChainLogo chain={KEY[chain]} size={size} label={!name} />
      {name && <span>{LABEL[chain]}</span>}
    </span>
  );
}

/** Replaces the browser's own select so networks show their logos. Arrow keys, Enter, Esc and typing all work. */
export function ChainSelect({ value, options, onChange, id, className = "mt-2" }: { value: Chain; options: readonly Chain[]; onChange: (c: Chain) => void; id?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const uid = useId();
  const list = options.length ? options : [value];

  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);

  const pick = (c: Chain) => { onChange(c); setOpen(false); };
  const openList = () => { setActive(Math.max(0, list.indexOf(value))); setOpen(true); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % list.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + list.length) % list.length); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(list[active]); }
    else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 text-left text-[15px] shadow-2xs transition-colors hover:border-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:border-dark-border dark:bg-dark-card dark:hover:border-white/30 dark:focus-visible:ring-accent-dark"
      >
        <ChainTag chain={value} size={22} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-none text-mute transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul id={`${uid}-list`} role="listbox" className="chain-pop absolute left-0 right-0 z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl dark:border-dark-border dark:bg-dark-card">
          {list.map((c, i) => (
            <li
              key={c}
              role="option"
              aria-selected={c === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(c)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2.5 text-[15px] ${i === active ? "bg-paper dark:bg-white/5" : ""}`}
            >
              <ChainTag chain={c} size={22} />
              {c === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent dark:text-accent-dark" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
