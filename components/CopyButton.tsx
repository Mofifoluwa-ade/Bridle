"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and some embedded webviews block the async clipboard API.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function useCopy(text: string) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = async () => {
    setState((await copyText(text)) ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  };
  return { state, copy };
}

/** Hero-sized primary button that copies `text`. */
export function CopyPromptButton({ text, label, children }: { text: string; label: string; children?: ReactNode }) {
  const { state, copy } = useCopy(text);
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-ink px-7 text-base font-semibold text-white shadow-sm transition-all hover:opacity-85 dark:bg-white dark:text-ink dark:hover:bg-gray-100"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {state === "copied" ? (
            <path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="5.2" y="5.2" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.8 5.2V4a1.6 1.6 0 0 0-1.6-1.6H4A1.6 1.6 0 0 0 2.4 4v5.2A1.6 1.6 0 0 0 4 10.8h1.2" stroke="currentColor" strokeWidth="1.5" />
            </>
          )}
        </svg>
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Could not copy. Select the text and copy it." : ""}
      </span>
      {children}
    </>
  );
}

/** A code block with a copy button. */
export function CodeBlock({ code, label, wrap = false }: { code: string; label?: string; wrap?: boolean }) {
  const { state, copy } = useCopy(code);
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white dark:border-dark-border dark:bg-dark-card">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 dark:border-dark-border">
        <span className="font-mono text-xs uppercase tracking-label text-mute dark:text-dark-mute">{label ?? ""}</span>
        <button
          type="button"
          onClick={copy}
          className="min-h-[32px] rounded-full px-3 text-[13px] font-medium text-ink transition-colors hover:bg-paper dark:text-white dark:hover:bg-white/10"
        >
          {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
        </button>
      </div>
      <pre className={`p-4 font-mono text-[13px] leading-[1.65] text-ink dark:text-white ${wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto"}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
