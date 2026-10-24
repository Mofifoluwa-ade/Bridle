import { Proposal } from "@/types/mandate";

type ProposalDetailModalProps = {
  proposal: Proposal | null;
  onClose: () => void;
};

export function ProposalDetailModal({
  proposal,
  onClose,
}: ProposalDetailModalProps) {
  if (!proposal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-dark-border bg-dark-card p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto text-dark-text">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-dark-border">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-dark-mute">
              Proposal detail
            </span>
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-white mt-0.5">
              {proposal.recipientLabel || "Payment inspection"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dark-border text-dark-mute hover:text-white hover:border-dark-mute transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Verdict Banner */}
        <div className="my-5 p-4 rounded-2xl bg-dark-bg border border-dark-border">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-dark-mute">
              Contract verdict
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                proposal.state === "Approved" || proposal.state === "Executed"
                  ? "bg-accent-tint text-accent border border-accent/20"
                  : proposal.state === "Blocked" || proposal.state === "Slashed"
                  ? "bg-bad-tint/10 text-bad border border-bad/20"
                  : "bg-warn-tint/10 text-warn border border-warn/20"
              }`}
            >
              {proposal.state}
            </span>
          </div>
          <p className="text-xs font-medium text-white leading-relaxed">
            {proposal.ruleCited}
          </p>
        </div>

        {/* Surface 1: Agent Declarative Input Schema */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-dark-mute">
              Agent input schema (4 fields only)
            </span>
            <span className="text-[10.5px] font-mono text-accent bg-accent-tint border border-accent/20 px-2 py-0.5 rounded-full">
              Zero key custody
            </span>
          </div>
          <pre className="rounded-2xl bg-dark-bg border border-dark-border p-4 font-mono text-xs text-[#E3E6EB] overflow-x-auto leading-relaxed">
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
          <p className="mt-2 text-xs text-dark-mute">
            The agent supplies only these four high-level declarative fields.
            It cannot construct arbitrary calldata or touch destination private keys.
          </p>
        </div>

        {/* Surface 2: Contract-built calldata & MPC signature */}
        <div className="mb-5">
          <span className="block font-mono text-[11px] uppercase tracking-wider text-dark-mute mb-2">
            Contract-built calldata & MPC derivation
          </span>
          <div className="p-4 rounded-2xl border border-dark-border bg-dark-bg space-y-3 font-mono text-xs">
            <div>
              <span className="text-dark-mute block text-[10.5px]">
                Target token contract ({proposal.chain})
              </span>
              <span className="text-white break-all font-medium">
                {proposal.chain === "Base"
                  ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC)"
                  : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC)"}
              </span>
            </div>

            <div>
              <span className="text-dark-mute block text-[10.5px]">
                Derived signer account (NEAR Chain Signatures)
              </span>
              <span className="text-white break-all font-medium">
                {proposal.calldataPreview?.derivedSigner ||
                  "bridle.near/mandate-1 (derived MPC address)"}
              </span>
            </div>

            {proposal.calldataPreview?.payloadHex && (
              <div>
                <span className="text-dark-mute block text-[10.5px]">
                  Raw payload constructed by adapter
                </span>
                <span className="text-dark-mute break-all text-[11px]">
                  {proposal.calldataPreview.payloadHex}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bond Information */}
        {proposal.agentBondLocked && (
          <div className="mb-5 p-3.5 rounded-2xl bg-warn-tint/10 border border-warn/20 text-xs text-warn">
            <span className="font-semibold block mb-0.5">
              Cooling threshold challenge active:
            </span>
            Proposal exceeds threshold. Agent locked {proposal.agentBondLocked}{" "}
            NEAR bond. Watchers can flag for a 40% slash reward.
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-dark-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-ink hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
