"use client";

type AppSettingsProps = {
  theme: "light" | "dark";
  onSelectTheme: (theme: "light" | "dark") => void;
  ownerAccount: string;
  agentAccount: string;
  onOpenGettingStarted: () => void;
  onResetGuide: () => void;
};

export function AppSettings({
  theme,
  onSelectTheme,
  ownerAccount,
  agentAccount,
  onOpenGettingStarted,
  onResetGuide,
}: AppSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Card 1: Appearance / Theme Mode */}
      <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
        <div className="pb-5 border-b border-line dark:border-dark-border">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Appearance
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
            Interface theme
          </h2>
          <p className="mt-1 text-xs text-mute dark:text-dark-mute">
            Select your preferred display theme for this browser session.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Selector Card */}
          <button
            type="button"
            onClick={() => onSelectTheme("light")}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 ${
              theme === "light"
                ? "border-accent ring-2 ring-accent/20 bg-accent-tint/30 dark:bg-accent-tint/10"
                : "border-line dark:border-dark-border bg-paper dark:bg-dark-bg hover:border-rule dark:hover:border-dark-mute"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-dark-card border border-line dark:border-dark-border text-ink dark:text-white shadow-2xs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink dark:text-white">
                  Light mode
                </span>
              </div>
              {theme === "light" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-tint border border-accent/20 px-2 py-0.5 text-[10.5px] font-semibold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
              Paper canvas with crisp ink typography, high contrast, and neutral gray borders.
            </p>
          </button>

          {/* Dark Mode Selector Card */}
          <button
            type="button"
            onClick={() => onSelectTheme("dark")}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 ${
              theme === "dark"
                ? "border-accent ring-2 ring-accent/20 bg-accent-tint/30 dark:bg-accent-tint/10"
                : "border-line dark:border-dark-border bg-paper dark:bg-dark-bg hover:border-rule dark:hover:border-dark-mute"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-dark-card border border-line dark:border-dark-border text-ink dark:text-white shadow-2xs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink dark:text-white">
                  Dark mode
                </span>
              </div>
              {theme === "dark" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-tint border border-accent/20 px-2 py-0.5 text-[10.5px] font-semibold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
              Midnight canvas with card surface elevation, reduced glare, and focused contrast.
            </p>
          </button>
        </div>
      </div>

      {/* Card 2: Network & Multi-Chain Endpoints */}
      <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
        <div className="pb-5 border-b border-line dark:border-dark-border">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Infrastructure
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
            Network connections & MPC telemetry
          </h2>
          <p className="mt-1 text-xs text-mute dark:text-dark-mute">
            Live cryptographic signing endpoints and protocol adapters.
          </p>
        </div>

        <div className="mt-5 space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-ink dark:text-white block">
                NEAR Testnet (Signing Network)
              </span>
              <span className="text-[11px] text-mute dark:text-dark-mute">
                Contract: v1.signer-prod.testnet
              </span>
            </div>
            <span className="text-accent text-[11px] font-sans font-semibold">
              Connected
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-ink dark:text-white block">
                Base Sepolia (EVM Adapter)
              </span>
              <span className="text-[11px] text-mute dark:text-dark-mute">
                USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
              </span>
            </div>
            <span className="text-accent text-[11px] font-sans font-semibold">
              Ready
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-ink dark:text-white block">
                Solana Devnet (SVM Adapter)
              </span>
              <span className="text-[11px] text-mute dark:text-dark-mute">
                USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
              </span>
            </div>
            <span className="text-accent text-[11px] font-sans font-semibold">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Key-Bound Accounts & Guide Triggers */}
      <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
        <div className="pb-5 border-b border-line dark:border-dark-border">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            Accounts & walkthrough
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
            Bound accounts & walkthrough guides
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg">
            <span className="text-dim dark:text-dark-dim block text-[11px] mb-1">
              Owner Account
            </span>
            <span className="font-mono font-semibold text-ink dark:text-white text-sm">
              {ownerAccount}
            </span>
            <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">
              Has free veto authority and exclusive rights to modify policy caps.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg">
            <span className="text-dim dark:text-dark-dim block text-[11px] mb-1">
              Agent Runner
            </span>
            <span className="font-mono font-semibold text-ink dark:text-white text-sm">
              {agentAccount}
            </span>
            <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">
              Keyless autonomous runner constrained strictly to mandate limits.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-line dark:border-dark-border flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenGettingStarted}
            className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-4 py-2 text-xs font-semibold shadow-sm transition-colors"
          >
            Launch getting started guide
          </button>
          <button
            type="button"
            onClick={onResetGuide}
            className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-4 py-2 text-xs font-semibold text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
          >
            Reset dismissed guides
          </button>
        </div>
      </div>
    </div>
  );
}
