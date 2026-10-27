"use client";

import Link from "next/link";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
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
      className={`rounded-3xl border transition-colors ${
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
}: {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BTN} ${SIZES[size]} ${VARIANTS[variant]}`}>
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

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[15px] font-semibold text-ink dark:text-white">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[13.5px] text-bad">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13.5px] text-mute dark:text-dark-mute">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputCls =
  "mt-2 block w-full rounded-xl border border-rule dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-[15.5px] text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:border-ink dark:focus:border-white focus:outline-none transition-colors shadow-2xs";
export const monoInputCls = `${inputCls} font-mono text-[14.5px]`;
