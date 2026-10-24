import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-page px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`mb-4 font-mono text-xs uppercase tracking-label ${
        tone === "dark" ? "text-dim" : "text-mute"
      }`}
    >
      {children}
    </p>
  );
}

export function PrimaryButton({
  href,
  children,
  large = false,
}: {
  href: string;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-ink font-semibold text-white transition-opacity hover:opacity-85 ${
        large ? "min-h-[52px] px-7 text-base" : "min-h-[44px] px-5 text-[15px]"
      }`}
    >
      {children}
    </a>
  );
}

export function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-rule px-7 text-base font-semibold text-ink transition-colors hover:bg-white"
    >
      {children}
    </a>
  );
}
