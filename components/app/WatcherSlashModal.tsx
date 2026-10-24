"use client";

import { useEffect } from "react";
import { Proposal } from "@/types/mandate";
import { computeSlashBreakdown } from "@/lib/mandate-engine";

type WatcherSlashModalProps = {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proposalId: string) => void;
};

export function WatcherSlashModal({
  proposal,
  isOpen,
  onClose,
  onConfirm,
}: WatcherSlashModalProps) {
  useEffect(() => {
    if (isOpen && proposal) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen, proposal]);

  if (!isOpen || !proposal) return null;

  const bondAmount = proposal.agentBondLocked || 1.0;
  const breakdown = computeSlashBreakdown(bondAmount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-modal-in relative w-full max-w-lg rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 shadow-2xl text-ink dark:text-dark-text transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line dark:border-dark-border">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-bad font-semibold">
              Human veto & penalty
            </span>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
              Confirm flag & slash bond
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line dark:border-dark-border text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:border-rule dark:hover:border-dark-mute transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Target Details */}
        <div className="my-5 p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-mute dark:text-dark-mute">Proposal:</span>
            <span className="font-mono font-semibold text-ink dark:text-white">
              ${proposal.amount.toFixed(2)} USDC on {proposal.chain}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-mute dark:text-dark-mute">Recipient:</span>
            <span className="font-mono text-mute dark:text-dark-mute truncate max-w-[220px]">
              {proposal.recipient}
            </span>
          </div>
        </div>

        {/* 40/30/30 Slash Split Breakdown */}
        <div className="mb-5">
          <span className="block font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute mb-2.5">
            Economic split ({bondAmount} NEAR bond)
          </span>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-semibold text-ink dark:text-white">
                  Watcher reward (40%)
                </span>
              </div>
              <span className="font-mono font-bold text-accent">
                +{breakdown.watcherShare.toFixed(2)} NEAR
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ink dark:bg-white" />
                <span className="font-semibold text-ink dark:text-white">
                  Owner compensation (30%)
                </span>
              </div>
              <span className="font-mono font-bold text-ink dark:text-white">
                +{breakdown.ownerShare.toFixed(2)} NEAR
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-bad" />
                <span className="font-semibold text-ink dark:text-white">Burned (30%)</span>
              </div>
              <span className="font-mono font-bold text-bad">
                -{breakdown.burnShare.toFixed(2)} NEAR
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Collusion Note */}
        <div className="p-3.5 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs text-mute dark:text-dark-mute leading-relaxed mb-6">
          <span className="font-semibold text-ink dark:text-white block mb-0.5">
            Collusion defense (&quot;On Collusion&quot;):
          </span>
          Even if an agent and a watcher collude, slashing burns or pays out
          60% of the bond to external parties. Farming slashes is mathematically
          net-negative.
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line dark:border-dark-border px-4 py-2 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(proposal.id);
              onClose();
            }}
            className="rounded-full bg-bad px-5 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Slash {bondAmount} NEAR & cancel proposal
          </button>
        </div>
      </div>
    </div>
  );
}
