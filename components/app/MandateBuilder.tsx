"use client";

import { useState } from "react";
import { Mandate, RecipientItem, ChainType } from "@/types/mandate";

type MandateBuilderProps = {
  mandate: Mandate;
  onUpdateMandate: (updated: Mandate) => void;
};

export function MandateBuilder({
  mandate,
  onUpdateMandate,
}: MandateBuilderProps) {
  const [dailyCap, setDailyCap] = useState(mandate.daily_cap);
  const [perTxCap, setPerTxCap] = useState(mandate.per_tx_cap);
  const [coolingThreshold, setCoolingThreshold] = useState(
    mandate.cooling_threshold
  );
  const [challengeWindow, setChallengeWindow] = useState(
    mandate.challenge_window
  );
  const [bond, setBond] = useState(mandate.bond);
  const [recipients, setRecipients] = useState<RecipientItem[]>(
    mandate.recipients
  );

  // New recipient form state
  const [newChain, setNewChain] = useState<ChainType>("Base");
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Live rule checks
  const isPerTxValid = perTxCap <= dailyCap;
  const isCoolingValid = coolingThreshold <= perTxCap;
  const isWindowValid = challengeWindow >= 60 && challengeWindow <= 86400;
  const isAllowlistNonEmpty = recipients.length > 0;
  const isAllValid =
    isPerTxValid && isCoolingValid && isWindowValid && isAllowlistNonEmpty;

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    const newItem: RecipientItem = {
      id: `rec-${Date.now()}`,
      chain: newChain,
      address: newAddress.trim(),
      label: newLabel.trim() || `${newChain} Recipient`,
    };

    setRecipients([...recipients, newItem]);
    setNewAddress("");
    setNewLabel("");
    setIsAddingRecipient(false);
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    if (!isAllValid) return;

    const updated: Mandate = {
      ...mandate,
      daily_cap: dailyCap,
      per_tx_cap: perTxCap,
      cooling_threshold: coolingThreshold,
      challenge_window: challengeWindow,
      bond: bond,
      recipients: recipients,
    };

    onUpdateMandate(updated);
    setFeedback("Mandate updated and verified against contract policy.");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-5 border-b border-line dark:border-dark-border">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Policy specification
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
            Mandate builder
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Enforced on-chain
        </span>
      </div>

      {/* Sentence-style primary policy */}
      <div className="py-6 border-b border-line dark:border-dark-border">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute mb-2">
          Sentence-style rule
        </label>
        <p className="text-xl sm:text-2xl font-medium leading-[1.35] tracking-[-0.02em] text-ink dark:text-white">
          Up to{" "}
          <span className="inline-block border-b border-accent text-accent px-1">
            ${dailyCap} a day
          </span>
          , to{" "}
          <span className="inline-block border-b border-accent text-accent px-1">
            {recipients.length} approved recipient
            {recipients.length === 1 ? "" : "s"}
          </span>
          . Pause anything over{" "}
          <span className="inline-block border-b border-accent text-accent px-1">
            ${coolingThreshold}
          </span>
          .
        </p>
      </div>

      {/* Numerical Cap Sliders & Inputs */}
      <div className="py-6 border-b border-line dark:border-dark-border grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink dark:text-white">Daily cap</span>
            <span className="font-mono text-xs font-semibold text-accent">
              ${dailyCap} USDC
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={dailyCap}
            onChange={(e) => setDailyCap(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">Resets at 00:00 UTC</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink dark:text-white">
              Per-tx limit
            </span>
            <span
              className={`font-mono text-xs font-semibold ${
                isPerTxValid ? "text-accent" : "text-bad"
              }`}
            >
              ${perTxCap} USDC
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={perTxCap}
            onChange={(e) => setPerTxCap(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <p
            className={`mt-1 text-[11px] ${
              isPerTxValid ? "text-mute dark:text-dark-mute" : "text-bad font-medium"
            }`}
          >
            {isPerTxValid ? "Must be ≤ daily cap" : "Cannot exceed daily cap"}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-ink dark:text-white">
              Cooling threshold
            </span>
            <span
              className={`font-mono text-xs font-semibold ${
                isCoolingValid ? "text-accent" : "text-bad"
              }`}
            >
              ${coolingThreshold} USDC
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={coolingThreshold}
            onChange={(e) => setCoolingThreshold(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <p
            className={`mt-1 text-[11px] ${
              isCoolingValid ? "text-mute dark:text-dark-mute" : "text-bad font-medium"
            }`}
          >
            {isCoolingValid
              ? "Over this, proposals wait"
              : "Must be ≤ per-tx limit"}
          </p>
        </div>
      </div>

      {/* Challenge Window & Bond Settings */}
      <div className="py-5 border-b border-line dark:border-dark-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
          <div>
            <div className="font-semibold text-ink dark:text-white">Challenge window</div>
            <div className="text-[11px] text-mute dark:text-dark-mute mt-0.5">
              Delay for watchers & veto
            </div>
          </div>
          <select
            value={challengeWindow}
            onChange={(e) => setChallengeWindow(Number(e.target.value))}
            aria-label="Challenge window duration"
            className="rounded-lg border border-line dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1 font-mono text-xs text-ink dark:text-white focus:outline-none"
          >
            <option value={300}>300s (5m)</option>
            <option value={600}>600s (10m - default)</option>
            <option value={1800}>1800s (30m)</option>
            <option value={3600}>3600s (1h)</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
          <div>
            <div className="font-semibold text-ink dark:text-white">Agent required bond</div>
            <div className="text-[11px] text-mute dark:text-dark-mute mt-0.5">
              Locked on over-threshold spend
            </div>
          </div>
          <div className="font-mono text-xs font-semibold text-ink dark:text-white">
            {bond} NEAR
          </div>
        </div>
      </div>

      {/* Recipient Allowlist */}
      <div className="py-6 border-b border-line dark:border-dark-border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
              Allowlist
            </span>
            <div className="text-sm font-semibold text-ink dark:text-white">
              Approved recipient addresses
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingRecipient(!isAddingRecipient)}
            className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-1 text-xs font-medium text-ink dark:text-white hover:bg-line/40 dark:hover:bg-dark-card-hover transition-colors"
          >
            {isAddingRecipient ? "Cancel" : "+ Add recipient"}
          </button>
        </div>

        {isAddingRecipient && (
          <form
            onSubmit={handleAddRecipient}
            className="mb-4 p-4 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-mute dark:text-dark-mute mb-1">
                  Chain
                </label>
                <select
                  value={newChain}
                  onChange={(e) => setNewChain(e.target.value as ChainType)}
                  aria-label="Select chain"
                  className="w-full rounded-lg border border-line dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs text-ink dark:text-white"
                >
                  <option value="Base">Base (EVM)</option>
                  <option value="Solana">Solana</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-mute dark:text-dark-mute mb-1">
                  Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Model Provider / API Gateway"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full rounded-lg border border-line dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 text-xs text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-mute dark:text-dark-mute mb-1">
                Recipient address
              </label>
              <input
                type="text"
                placeholder={
                  newChain === "Base" ? "0x..." : "Base58 address..."
                }
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full rounded-lg border border-line dark:border-dark-border bg-white dark:bg-dark-card px-2.5 py-1.5 font-mono text-xs text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-4 py-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                Save address
              </button>
            </div>
          </form>
        )}

        <ul className="space-y-2">
          {recipients.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line dark:border-dark-border p-3 bg-paper dark:bg-dark-bg text-xs transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white dark:bg-dark-card border border-line dark:border-dark-border px-2 py-0.5 font-semibold text-[10px] text-mute dark:text-dark-mute">
                    {r.chain}
                  </span>
                  <span className="font-semibold text-ink dark:text-white">{r.label}</span>
                </div>
                <div className="font-mono text-mute dark:text-dark-mute truncate mt-1">
                  {r.address}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRecipient(r.id)}
                className="text-mute dark:text-dark-mute hover:text-bad transition-colors px-2 py-1"
                title="Remove recipient"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        {!isAllowlistNonEmpty && (
          <p className="mt-3 text-xs text-bad font-medium">
            Rule violation: An empty recipient list prevents the agent from
            spending anything.
          </p>
        )}
      </div>

      {/* Asymmetric Rules Callout */}
      <div className="py-4 text-xs text-mute dark:text-dark-mute flex items-start gap-2">
        <span className="text-accent mt-0.5">•</span>
        <div>
          <span className="font-semibold text-ink dark:text-white">
            Asymmetric enforcement:
          </span>{" "}
          Tightening is instant. Loosening a cap or adding a recipient is
          delayed by one challenge window ({challengeWindow / 60}m) to stop
          session takeover drains.
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="pt-4 flex items-center justify-between gap-4">
        <div>
          {feedback && (
            <span className="text-xs font-medium text-accent">{feedback}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isAllValid}
          className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
            isAllValid
              ? "bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 shadow-sm"
              : "bg-line dark:bg-dark-border text-dim dark:text-dark-mute cursor-not-allowed"
          }`}
        >
          Sign mandate on NEAR
        </button>
      </div>
    </div>
  );
}
