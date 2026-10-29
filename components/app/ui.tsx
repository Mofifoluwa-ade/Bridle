"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CONFIG } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import type { ProposalStatus } from "@/lib/types";

export function Card({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl border transition-colors min-w-0 ${
        dark
          ? "border-night dark:border-dark-border bg-ink dark:bg-dark-card text-white shadow-sm"
          : "border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-dark-text shadow-sm"
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] sm:text-[36px] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white">
          {title}
        </h1>
        {lead && (
          <p className="mt-2 max-w-xl text-[15px] sm:text-[16px] leading-relaxed text-mute dark:text-dark-mute">
            {lead}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
      {children}
    </p>
  );
}

type Tone = "neutral" | "ok" | "warn" | "bad";
const TONES: Record<Tone, string> = {
  neutral:
    "bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute border border-line dark:border-dark-border",
  ok: "bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/20",
  warn: "bg-warn-tint dark:bg-warn-tint/15 text-warn dark:text-warn border border-warn/20",
  bad: "bg-bad-tint dark:bg-bad-tint/15 text-bad dark:text-bad border border-bad/20",
};

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[28px] items-center rounded-full px-3 text-[13px] font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export const STATUS: Record<
  ProposalStatus,
  { label: string; tone: Tone; line: string }
> = {
  Rejected: {
    label: "Blocked",
    tone: "bad",
    line: "Blocked by your spending rules",
  },
  Waiting: {
    label: "Paused",
    tone: "warn",
    line: "Paused for review. You can approve or cancel.",
  },
  Ready: {
    label: "Approved",
    tone: "ok",
    line: "Passed all rules. Ready to send.",
  },
  Flagged: {
    label: "Flagged",
    tone: "warn",
    line: "Reported as suspicious. Paused until you review it.",
  },
  Cancelled: {
    label: "Cancelled",
    tone: "bad",
    line: "Payment cancelled. Suspicious payment stopped.",
  },
  Vetoed: {
    label: "Cancelled",
    tone: "neutral",
    line: "You cancelled this payment. No money was sent.",
  },
  Expired: {
    label: "Expired",
    tone: "neutral",
    line: "Timed out without approval. No money was sent.",
  },
  Signing: {
    label: "Sending",
    tone: "ok",
    line: "Approved. Sending on the blockchain.",
  },
  Executed: {
    label: "Sent",
    tone: "ok",
    line: "Payment sent successfully.",
  },
};

export function StatusPill({ status }: { status: ProposalStatus }) {
  const s = STATUS[status];
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45";
const SIZES = {
  md: "min-h-[44px] px-5 text-[15px]",
  lg: "min-h-[50px] px-7 text-base",
  sm: "min-h-[36px] px-4 text-[13.5px]",
};
const VARIANTS = {
  primary:
    "bg-ink text-white hover:opacity-90 dark:bg-white dark:text-ink dark:hover:bg-gray-100 shadow-sm",
  outline:
    "border border-rule dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover shadow-2xs",
  danger:
    "border border-bad/30 bg-bad-tint/60 dark:bg-bad-tint/15 text-bad hover:bg-bad hover:text-white",
  dangerSolid: "bg-bad text-white hover:opacity-90 shadow-sm",
  accent: "bg-accent text-white hover:opacity-90 shadow-sm",
};

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  busy?: boolean;
};

export function Btn({
  variant = "primary",
  size = "md",
  busy,
  children,
  className = "",
  disabled,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`${BTN} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {busy && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

export function LinkBtn({
  href,
  variant = "outline",
  size = "md",
  children,
  className = "",
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BTN} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
}) {
  const c = {
    neutral:
      "border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white",
    ok: "border-accent/30 bg-accent-tint dark:bg-accent-tint/15",
    warn: "border-warn/30 bg-warn-tint dark:bg-warn-tint/15",
    bad: "border-bad/30 bg-bad-tint dark:bg-bad-tint/15",
  }[tone];
  const t = {
    neutral: "text-ink dark:text-white",
    ok: "text-accent dark:text-[#46D9A4]",
    warn: "text-warn",
    bad: "text-bad",
  }[tone];
  return (
    <div
      role={tone === "bad" ? "alert" : "status"}
      className={`rounded-2xl border px-5 py-4 ${c}`}
    >
      {title && <p className={`text-[15px] font-semibold ${t}`}>{title}</p>}
      {children && (
        <div className="mt-1 text-[14.5px] leading-relaxed text-mute dark:text-dark-mute">
          {children}
        </div>
      )}
    </div>
  );
}

export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <p className="text-[20px] font-semibold tracking-[-0.02em] text-ink dark:text-white">
        {title}
      </p>
      {children && (
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-mute dark:text-dark-mute">
          {children}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-line/60 dark:bg-dark-border ${className}`}
      aria-hidden
    />
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  badge,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "warn" | "ok";
  badge?: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5 rounded-2xl transition-all">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {badge}
      </div>
      <p
        className={`mt-2 font-mono text-[24px] sm:text-[28px] font-semibold leading-tight ${
          tone === "warn"
            ? "text-warn"
            : "text-ink dark:text-white"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[12.5px] sm:text-[13px] text-mute dark:text-dark-mute leading-normal truncate">
          {sub}
        </p>
      )}
    </Card>
  );
}

export function Addr({
  value,
  chars = 6,
}: {
  value: string;
  chars?: number;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={`${value} (click to copy)`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className="font-mono text-[14px] text-ink dark:text-white underline decoration-rule dark:decoration-dark-border underline-offset-4 hover:decoration-ink dark:hover:decoration-white transition-colors"
    >
      {copied ? "Copied" : shortAddr(value, chars, 4)}
    </button>
  );
}

export function NearAccountLink({ id }: { id: string }) {
  return (
    <a
      href={`${CONFIG.explorer}/address/${id}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-[14px] text-ink dark:text-white underline decoration-rule dark:decoration-dark-border underline-offset-4 hover:decoration-accent dark:hover:decoration-[#46D9A4] transition-colors"
    >
      {id}
    </a>
  );
}

export function HelpButton({
  content,
  title,
  label = "More information",
  align = "left",
}: {
  content: ReactNode;
  title?: string;
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={label}
        aria-expanded={open}
        title={open ? "Close help" : "Click for explanation"}
        className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-mono transition-all ${
          open
            ? "bg-ink text-white dark:bg-white dark:text-ink font-bold shadow-xs scale-105"
            : "border border-rule dark:border-dark-border text-mute hover:text-ink hover:border-ink hover:bg-paper dark:text-dark-mute dark:hover:text-white dark:hover:border-white dark:hover:bg-dark-card-hover"
        }`}
      >
        ?
      </button>

      {open && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-3.5 text-xs leading-relaxed text-ink dark:text-dark-text shadow-xl animate-fade-in`}
        >
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-line/60 dark:border-dark-border/60">
            <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-white text-[12px]">
              <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-accent/20 text-accent dark:text-[#46D9A4] text-[9px] font-mono font-bold">
                ?
              </span>
              <span>{title || "Help guide"}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-mute hover:text-ink dark:hover:text-white p-0.5 rounded text-xs transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="text-mute dark:text-dark-mute text-[12px] leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpDropdown({
  title,
  children,
  defaultOpen = false,
  badge = "Guide",
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-line dark:border-dark-border bg-paper/50 dark:bg-dark-card/50 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left text-xs sm:text-sm font-medium text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-rule dark:border-dark-border bg-white dark:bg-dark-card text-[10px] font-mono font-bold text-accent dark:text-[#46D9A4]">
            ?
          </span>
          <span className="font-semibold text-ink dark:text-white">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-mute dark:text-dark-mute text-xs">
          <span>{open ? "Hide" : "Learn more"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 text-xs sm:text-[13px] leading-relaxed border-t border-line/60 dark:border-dark-border/60 text-mute dark:text-dark-mute space-y-2 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export function HelpGuideMenu({
  guides,
  buttonLabel = "Help Guide",
}: {
  guides: { title: string; description: ReactNode; badge?: string }[];
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card px-2.5 sm:px-3 py-1.5 text-xs font-medium text-ink dark:text-white shadow-2xs hover:border-ink dark:hover:border-white transition-all"
        aria-expanded={open}
      >
        <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-rule dark:border-dark-border text-[10px] font-mono font-bold text-accent dark:text-[#46D9A4]">
          ?
        </span>
        <span className="font-semibold">{buttonLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-3 shadow-xl backdrop-blur-md animate-fade-in space-y-2">
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-line dark:border-dark-border">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-ink dark:text-white">Help & Rules Guide</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                Tips
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-mute hover:text-ink dark:hover:text-white p-0.5 rounded text-xs transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {guides.map((item, idx) => {
              const isItemExpanded = expandedIndex === idx;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-line/60 dark:border-dark-border/60 bg-paper/40 dark:bg-dark-card/40 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isItemExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-2.5 text-left text-xs font-medium text-ink dark:text-white hover:text-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-mute dark:text-dark-mute">0{idx + 1}</span>
                      <span className="font-semibold">{item.title}</span>
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${isItemExpanded ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isItemExpanded && (
                    <div className="px-2.5 pb-2.5 pt-0 text-[11.5px] leading-relaxed text-mute dark:text-dark-mute border-t border-line/40 dark:border-dark-border/40 mt-1 pt-1.5">
                      {item.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  help,
  error,
  children,
}: {
  label: string;
  hint?: string;
  help?: string | ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  const helpContent = help || hint;

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-semibold text-ink dark:text-white">
            {label}
          </span>
          {helpContent && (
            <HelpButton
              content={helpContent}
              title={label}
              label={`Help for ${label}`}
            />
          )}
        </div>
      </div>

      {children}

      {error ? (
        <span className="mt-1.5 block text-[13.5px] text-bad">{error}</span>
      ) : null}
    </div>
  );
}

export const inputCls =
  "mt-2 block w-full min-w-0 rounded-xl border border-rule dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-[15.5px] text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:border-ink dark:focus:border-white focus:outline-none transition-colors shadow-2xs";
export const monoInputCls = `${inputCls} font-mono text-[14.5px]`;
