"use client";

import { useState, useEffect } from "react";
import { Mandate, ChainType, Proposal } from "@/types/mandate";
import {
  validateProposal,
  generateMockTxHash,
} from "@/lib/mandate-engine";

type ManualProposalModalProps = {
  isOpen: boolean;
  mandate: Mandate;
  onClose: () => void;
  onSubmitProposal: (newProposal: Proposal) => void;
};

export function ManualProposalModal({
  isOpen,
  mandate,
  onClose,
  onSubmitProposal,
}: ManualProposalModalProps) {
  const [chain, setChain] = useState<ChainType>("Base");
  const [amount, setAmount] = useState<string>("15");
  const [recipient, setRecipient] = useState<string>(
    mandate.recipients[0]?.address || ""
  );
  const [recipientLabel, setRecipientLabel] = useState<string>(
    mandate.recipients[0]?.label || ""
  );

  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const validation = validateProposal(mandate, {
    chain,
    asset: "USDC",
    amount: numAmount,
    recipient,
  });

  const handleSelectPreset = (
    address: string,
    label: string,
    targetChain: ChainType
  ) => {
    setChain(targetChain);
    setRecipient(address);
    setRecipientLabel(label);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || numAmount <= 0) return;

    const { txHash, explorerUrl } =
      validation.status === "Approved"
        ? generateMockTxHash(chain)
        : { txHash: undefined, explorerUrl: undefined };

    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      createdAt: "Just now",
      chain,
      asset: "USDC",
      amount: numAmount,
      amountRaw: Math.round(numAmount * 1_000_000).toString(),
      recipient: recipient.trim(),
      recipientLabel: recipientLabel || `${chain} Transfer`,
      state: validation.status,
      ruleCited: validation.ruleCited,
      txHash,
      explorerUrl,
      agentBondLocked: validation.requiresCooling ? mandate.bond : undefined,
    };

    onSubmitProposal(newProposal);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-modal-in relative w-full max-w-lg rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 shadow-2xl text-ink dark:text-dark-text transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-line dark:border-dark-border">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
              Payment dispatch
            </span>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
              Propose payment
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Preset Buttons */}
          <div>
            <span className="block text-xs font-medium text-mute dark:text-dark-mute mb-1.5">
              Quick presets
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {mandate.recipients.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectPreset(r.address, r.label, r.chain)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    recipient === r.address
                      ? "bg-ink text-white font-semibold border-ink dark:bg-white dark:text-ink dark:border-white shadow-sm"
                      : "bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white border-line dark:border-dark-border"
                  }`}
                >
                  {r.label} ({r.chain})
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    "Malicious Address (Prompt Injected)",
                    "Base"
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  recipient === "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                    ? "bg-bad text-white font-semibold border-bad shadow-sm"
                    : "bg-bad-tint/60 dark:bg-bad-tint/10 text-bad border-bad/30 hover:bg-bad hover:text-white"
                }`}
              >
                Unknown address
              </button>
            </div>
          </div>

          {/* Chain & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-mute dark:text-dark-mute mb-1">
                Chain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value as ChainType)}
                aria-label="Chain selection"
                className="w-full rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-2 text-xs font-medium text-ink dark:text-white focus:outline-none"
              >
                <option value="Base">Base Sepolia (EVM)</option>
                <option value="Solana">Solana Devnet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-mute dark:text-dark-mute mb-1">
                Amount (USDC)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-2 font-mono text-xs text-ink dark:text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-xs font-medium text-mute dark:text-dark-mute mb-1">
              Recipient address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setRecipientLabel("");
              }}
              className="w-full rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-2 font-mono text-xs text-ink dark:text-white focus:outline-none placeholder:text-dim dark:placeholder:text-dark-dim"
              placeholder={chain === "Base" ? "0x..." : "Base58 address..."}
              required
            />
          </div>

          {/* Live Verdict Preview */}
          <div className="p-3.5 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono uppercase tracking-wider text-[10px] text-mute dark:text-dark-mute font-medium">
                Contract verdict preview
              </span>
              <span
                className={`font-semibold ${
                  validation.status === "Approved"
                    ? "text-accent"
                    : validation.status === "Blocked"
                    ? "text-bad"
                    : "text-warn"
                }`}
              >
                {validation.status}
              </span>
            </div>
            <p className="text-mute dark:text-dark-mute leading-relaxed">
              {validation.ruleCited}
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line dark:border-dark-border px-4 py-2 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-5 py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              Propose to contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
