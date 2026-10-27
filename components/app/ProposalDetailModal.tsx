"use client";

import { useEffect } from "react";
import { Proposal } from "@/types/mandate";

type ProposalDetailModalProps = {
  proposal: Proposal | null;
  onClose: () => void;
};

export function ProposalDetailModal({
  proposal,
  onClose,
}: ProposalDetailModalProps) {
  useEffect(() => {
    if (proposal) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [proposal]);

  if (!proposal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-modal-in relative w-full max-w-2xl rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto text-ink dark:text-dark-text transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-line dark:border-dark-border">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
              Payment details
            </span>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
              {proposal.recipientLabel || "Payment inspection"}
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

        {/* Verdict Banner */}
        <div className="my-5 p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
              Spending rule check
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                proposal.state === "Approved" || proposal.state === "Executed"
                  ? "bg-accent-tint text-accent border border-accent/20"
                  : proposal.state === "Blocked" || proposal.state === "Slashed"
                  ? "bg-bad-tint dark:bg-bad-tint/10 text-bad border border-bad/20"
                  : "bg-warn-tint dark:bg-warn-tint/10 text-warn border border-warn/20"
              }`}
            >
              {proposal.state}
            </span>
          </div>
          <p className="text-xs font-medium text-ink dark:text-white leading-relaxed">
            {proposal.ruleCited}
          </p>
        </div>

        {/* Surface 1: Agent Declarative Input Schema */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
              What the agent requested (4 simple fields)
            </span>
            <span className="text-[10.5px] font-mono text-accent bg-accent-tint border border-accent/20 px-2 py-0.5 rounded-full">
              Agent has no private keys
            </span>
          </div>
          <pre className="rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border p-4 font-mono text-xs text-ink dark:text-[#E3E6EB] overflow-x-auto leading-relaxed">
{JSON.stringify(
  {
    name: "propose_payment",
    input_schema: {
      chain: proposal.chain.toLowerCase(),
      asset: proposal.asset,
      amount: proposal.amountRaw,
      recipient: proposal.recipient,
    },
  },
  null,
  2
)}
          </pre>
          <p className="mt-2 text-xs text-mute dark:text-dark-mute">
            Your AI agent asks only for these 4 fields. It never sees private keys and cannot move funds on its own.
          </p>
        </div>

        {/* Surface 2: Contract-built calldata & MPC signature */}
        <div className="mb-5">
          <span className="block font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute mb-2">
            Automatic blockchain transaction details
          </span>
          <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg space-y-3 font-mono text-xs">
            <div>
              <span className="text-mute dark:text-dark-mute block text-[10.5px]">
                Token contract ({proposal.chain})
              </span>
              <span className="text-ink dark:text-white break-all font-medium">
                {proposal.chain === "Base"
                  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)"
                  : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC)"}
              </span>
            </div>

            <div>
              <span className="text-mute dark:text-dark-mute block text-[10.5px]">
                Secure signing address
              </span>
              <span className="text-ink dark:text-white break-all font-medium">
                {proposal.calldataPreview?.derivedSigner ||
                  "bridle.near/mandate-1 (derived MPC address)"}
              </span>
            </div>

            {proposal.calldataPreview?.payloadHex && (
              <div>
                <span className="text-mute dark:text-dark-mute block text-[10.5px]">
                  Raw blockchain payload
                </span>
                <span className="text-mute dark:text-dark-mute break-all text-[11px]">
                  {proposal.calldataPreview.payloadHex}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bond Information */}
        {proposal.agentBondLocked && (
          <div className="mb-5 p-3.5 rounded-2xl bg-warn-tint dark:bg-warn-tint/10 border border-warn/20 text-xs text-warn">
            <span className="font-semibold block mb-0.5">
              Paused for safety review:
            </span>
            Payment is above the pause limit. Agent locked {proposal.agentBondLocked}{" "}
            NEAR security deposit. Reviewers can flag bad payments to earn a reward.
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-line dark:border-dark-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-5 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
