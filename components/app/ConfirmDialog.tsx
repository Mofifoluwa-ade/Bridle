"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Btn } from "@/components/app/ui";

/**
 * Bridle's own confirmation modal, used in place of the browser's confirm().
 * Esc and a click outside cancel it, focus stays inside while it is open and returns afterwards.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Start on the safe choice.
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const f = ref.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div className="confirm-backdrop absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={() => !busy && onCancel()} />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="confirm-panel relative w-full max-w-[420px] rounded-2xl border border-line bg-white p-6 shadow-2xl dark:border-dark-border dark:bg-dark-card"
      >
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${destructive ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-accent-tint text-accent dark:bg-accent-dark/10 dark:text-accent-dark"}`} aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {destructive ? <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></>}
          </svg>
        </div>
        <h2 id={titleId} className="text-[19px] font-semibold tracking-tight">{title}</h2>
        {children && <div className="mt-2 text-[15px] leading-relaxed text-mute dark:text-dark-mute">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-[15px] font-medium transition-colors hover:bg-paper disabled:opacity-50 dark:border-dark-border dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <Btn variant={destructive ? "dangerSolid" : "primary"} busy={busy} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>,
    document.body,
  );
}
