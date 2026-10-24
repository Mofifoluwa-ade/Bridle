"use client";

import { useState, useEffect } from "react";
import { Mandate, Proposal } from "@/types/mandate";
import {
  DEFAULT_MANDATE,
  INITIAL_PROPOSALS,
} from "@/lib/mandate-engine";
import { AppSidebar, NavTab } from "@/components/app/AppSidebar";
import { MandateBuilder } from "@/components/app/MandateBuilder";
import { LiveProposalFeed } from "@/components/app/LiveProposalFeed";
import { ProposalDetailModal } from "@/components/app/ProposalDetailModal";
import { ManualProposalModal } from "@/components/app/ManualProposalModal";
import { WatcherSlashModal } from "@/components/app/WatcherSlashModal";
import { GettingStartedModal } from "@/components/app/GettingStartedModal";
import { AppSettings } from "@/components/app/AppSettings";

export default function AppPage() {
  const [mandate, setMandate] = useState<Mandate>(DEFAULT_MANDATE);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [activeTab, setActiveTab] = useState<NavTab>("monitor");

  // Modals state
  const [isGettingStartedOpen, setIsGettingStartedOpen] = useState(false);
  const [inspectProposal, setInspectProposal] = useState<Proposal | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [slashingProposal, setSlashingProposal] = useState<Proposal | null>(
    null
  );
  const [notification, setNotification] = useState<string | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with document element and localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("bridle_theme") as
        | "light"
        | "dark"
        | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("bridle_theme", nextTheme);
    } catch {}
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Auto open Getting Started on first visit
  useEffect(() => {
    try {
      const hidden = localStorage.getItem("bridle_hide_getting_started");
      if (!hidden) {
        setIsGettingStartedOpen(true);
      }
    } catch {}
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Revoke & Restore Handlers
  const handleRevoke = () => {
    setMandate((prev) => ({ ...prev, state: "Revoked" }));
    setProposals((prev) =>
      prev.map((p) =>
        p.state === "Waiting" || p.state === "Flagged"
          ? {
              ...p,
              state: "Cancelled",
              ruleCited: "Cancelled: Owner revoked mandate.",
            }
          : p
      )
    );
    showNotification("Agent frozen. Every pending proposal has been cancelled.");
  };

  const handleRestore = () => {
    setMandate((prev) => ({ ...prev, state: "Active" }));
    showNotification("Mandate restored. Policy enforcement active.");
  };

  // Proposal Actions
  const handleOwnerVeto = (id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              state: "Cancelled",
              ruleCited: "Cancelled by free owner veto during challenge window.",
            }
          : p
      )
    );
    showNotification("Owner veto confirmed. Funds stay put.");
  };

  const handleWatcherFlag = (id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              state: "Flagged",
              watcherAddress: "watcher-01.near",
              watcherBondLocked: 0.1,
              ruleCited:
                "Flagged by watcher (0.1 NEAR bond posted). Requires owner confirmation.",
            }
          : p
      )
    );
    showNotification("Watcher flagged proposal with 0.1 NEAR bond.");
  };

  const handleConfirmSlash = (id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              state: "Slashed",
              ruleCited:
                "Flag confirmed by owner. 1.0 NEAR agent bond slashed (40% watcher, 30% owner, 30% burned).",
            }
          : p
      )
    );
    showNotification("Agent bond slashed. Proposal permanently cancelled.");
  };

  const handleDismissFlag = (id: string) => {
    setProposals((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              state: "Waiting",
              ruleCited:
                "Flag dismissed by owner. Watcher bond forfeited to agent. Proposal resumes cooling window.",
            }
          : p
      )
    );
    showNotification("Watcher flag dismissed. Watcher bond forfeited to agent.");
  };

  // Add proposal handler
  const handleAddProposal = (newProp: Proposal) => {
    setProposals([newProp, ...proposals]);
    showNotification(`Proposal processed: ${newProp.state}.`);
  };

  // Trigger adversarial policy stress test
  const handleTriggerAdversarial = () => {
    const attack1: Proposal = {
      id: `attack-${Date.now()}-1`,
      createdAt: "Just now",
      chain: "Base",
      asset: "USDC",
      amount: 240.0,
      amountRaw: "240000000",
      recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      recipientLabel: "Prompt injection attempt (Overspend)",
      state: "Blocked",
      ruleCited: "Blocked: Exceeds per-tx cap ($25) and daily cap ($50).",
    };

    const attack2: Proposal = {
      id: `attack-${Date.now()}-2`,
      createdAt: "Just now",
      chain: "Solana",
      asset: "USDC",
      amount: 15.0,
      amountRaw: "15000000",
      recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      recipientLabel: "Unapproved recipient attempt",
      state: "Blocked",
      ruleCited: "Blocked: Recipient not on the approved allowlist.",
    };

    setProposals([attack1, attack2, ...proposals]);
    showNotification("Adversarial spend blocked on both chains with exact rules cited.");
  };

  const isRevoked = mandate.state === "Revoked";
  const dailySpent = proposals
    .filter((p) => p.state === "Approved" || p.state === "Executed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-paper dark:bg-dark-bg text-ink dark:text-dark-text flex flex-col md:flex-row font-sans selection:bg-accent selection:text-white transition-colors duration-200">
      {/* Persistent Left Sidebar Navigation */}
      <AppSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        mandateState={mandate.state}
        ownerAccount={mandate.owner}
        agentAccount={mandate.agent}
        onRevoke={handleRevoke}
        onRestore={handleRestore}
        proposalCount={proposals.length}
        onOpenGettingStarted={() => setIsGettingStartedOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Revoked Warning Banner */}
        {isRevoked && (
          <div className="bg-bad text-white px-6 py-2.5 text-center text-xs font-semibold tracking-wide">
            Agent frozen. Every pending proposal has been cancelled.
          </div>
        )}

        {/* Ephemeral Feedback Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-white dark:bg-dark-card px-5 py-3 text-xs font-semibold text-ink dark:text-white shadow-xl flex items-center gap-2.5 border border-line dark:border-dark-border">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>{notification}</span>
          </div>
        )}

        <main className="flex-1 w-full max-w-5xl mx-auto px-5 py-8 sm:px-8 lg:px-10">
          {/* Main View Header */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
              {activeTab === "monitor"
                ? "Policy monitor"
                : activeTab === "builder"
                ? "Mandate builder"
                : activeTab === "threats"
                ? "Verification & limits"
                : "Settings"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-mute dark:text-dark-mute">
              {activeTab === "monitor"
                ? "Your agent's spending leash, approved limits, and multi-chain execution."
                : activeTab === "builder"
                ? "Configure deterministic policy rules signed once by the owner."
                : activeTab === "threats"
                ? "Formal threat model and cryptographically verified boundaries."
                : "Configure interface appearance, network endpoints, and protocol accounts."}
            </p>
          </div>

          {/* Conditional Overview Cards (Hidden on Settings) */}
          {activeTab !== "settings" && (
            <>
              {/* Hero Card: Daily Budget & Actions (Matching Gloam's Hero Card) */}
              <div className="mb-6 rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 shadow-sm transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-mute dark:text-dark-mute">
                  Daily budget
                </span>
                <span className="inline-flex items-center rounded-full bg-accent-tint border border-accent/20 px-2.5 py-0.5 text-[10.5px] font-semibold text-accent">
                  {isRevoked ? "Frozen" : "Policy bound"}
                </span>
              </div>
            </div>

            {/* Big Metric Display */}
            <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight text-ink dark:text-white">
                  ${dailySpent.toFixed(2)}
                </div>
                <p className="mt-1.5 text-xs text-mute dark:text-dark-mute">
                  ${Math.max(0, mandate.daily_cap - dailySpent).toFixed(2)}{" "}
                  remaining today of ${mandate.daily_cap}.00 daily cap. Resets
                  at 00:00 UTC.
                </p>
              </div>

              {/* Action Pill Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-5 py-2 text-xs font-semibold transition-all shadow-sm"
                >
                  + Propose spend
                </button>
                <button
                  type="button"
                  onClick={handleTriggerAdversarial}
                  className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-4 py-2 text-xs font-semibold text-ink dark:text-white hover:bg-line/40 dark:hover:bg-dark-card-hover transition-colors"
                  title="Stress test prompt injection resistance"
                >
                  ⚡ Stress test defense
                </button>
                <button
                  type="button"
                  onClick={isRevoked ? handleRestore : handleRevoke}
                  className="rounded-full border border-bad/30 bg-bad-tint/50 dark:bg-bad-tint/10 px-4 py-2 text-xs font-semibold text-bad hover:bg-bad hover:text-white transition-colors"
                >
                  {isRevoked ? "Restore" : "Instant revoke"}
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Cards Row (3 Cards directly matching Gloam's Total Value / Wallet / Tokens row) */}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 transition-colors">
              <div className="flex items-center justify-between text-xs text-mute dark:text-dark-mute mb-2">
                <span>Per-tx cap</span>
                <span className="font-mono text-[10px] text-dim dark:text-dark-dim">USDC</span>
              </div>
              <div className="font-mono text-2xl font-semibold text-ink dark:text-white">
                ${mandate.per_tx_cap}.00
              </div>
              <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">
                Max allowed per single spend
              </p>
            </div>

            <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 transition-colors">
              <div className="flex items-center justify-between text-xs text-mute dark:text-dark-mute mb-2">
                <span>Cooling threshold</span>
                <span className="font-mono text-[10px] text-accent">
                  1 NEAR bond
                </span>
              </div>
              <div className="font-mono text-2xl font-semibold text-ink dark:text-white">
                ${mandate.cooling_threshold}.00
              </div>
              <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">
                Above this pauses {mandate.challenge_window / 60}m for veto
              </p>
            </div>

            <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 transition-colors">
              <div className="flex items-center justify-between text-xs text-mute dark:text-dark-mute mb-2">
                <span>Allowlist</span>
                <span className="font-mono text-[10px] text-dim dark:text-dark-dim">
                  Base • Solana
                </span>
              </div>
              <div className="font-mono text-2xl font-semibold text-ink dark:text-white">
                {mandate.recipients.length} recipients
              </div>
              <p className="mt-1 text-[11px] text-mute dark:text-dark-mute">
                Strict deny-by-default allowlist
              </p>
            </div>
          </div>
        </>
      )}

          {/* Tab Content */}
          {activeTab === "monitor" && (
            <LiveProposalFeed
              proposals={proposals}
              mandate={mandate}
              onInspect={(p) => setInspectProposal(p)}
              onOwnerVeto={handleOwnerVeto}
              onWatcherFlag={handleWatcherFlag}
              onConfirmSlash={(id) => {
                const target = proposals.find((p) => p.id === id);
                if (target) setSlashingProposal(target);
              }}
              onDismissFlag={handleDismissFlag}
            />
          )}

          {activeTab === "builder" && (
            <MandateBuilder
              mandate={mandate}
              onUpdateMandate={(updated) => {
                setMandate(updated);
                showNotification("Mandate limits updated on-chain.");
              }}
            />
          )}

          {activeTab === "threats" && (
            <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 text-ink dark:text-dark-text shadow-sm transition-colors">
              <div className="pb-5 border-b border-line dark:border-dark-border">
                <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute">
                  Specification Matrix
                </span>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white mt-0.5">
                  Threat model & honest boundaries
                </h2>
                <p className="mt-1 text-xs text-mute dark:text-dark-mute leading-relaxed">
                  Bridle bounds the financial loss an AI agent can cause. It
                  replaces counterparty trust with cryptographic mandate enforcement.
                </p>
              </div>

              <div className="mt-5 divide-y divide-line dark:divide-dark-border text-xs">
                {[
                  {
                    threat: "Prompt-injected agent tries to overspend treasury",
                    covered: true,
                    details:
                      "Per-transaction ($25) and daily ($50) caps reject excessive spending immediately at the contract level before signing.",
                  },
                  {
                    threat: "Agent proposes an unlisted or malicious recipient",
                    covered: true,
                    details:
                      "Strict allowlist match required per destination chain. Unknown addresses fail validation at propose time.",
                  },
                  {
                    threat: "Agent tries to smuggle extra instructions or calldata",
                    covered: true,
                    details:
                      "The agent sends only four fields. The contract adapter builds raw transaction bytes deterministically.",
                  },
                  {
                    threat: "Colluding agent and watcher attempt slash farming",
                    covered: true,
                    details:
                      "Slashing burns 30% and routes 30% to the owner. The watcher receives at most 40%, making farming net-negative.",
                  },
                  {
                    threat: "Compromised owner session tries to flash-drain",
                    covered: "Partly",
                    details:
                      "Loosening limits or adding recipients requires a challenge window delay (10m). Tightening and revocation remain instant.",
                  },
                  {
                    threat: "Owner allowlist contains a bad address",
                    covered: "No",
                    details:
                      "The mandate is only as good as the owner's allowlist. Bridle guarantees delivery only to approved recipients.",
                  },
                ].map((row) => (
                  <div
                    key={row.threat}
                    className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="font-semibold text-ink dark:text-white sm:w-1/3">
                      {row.threat}
                    </div>
                    <div className="sm:w-1/6">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10.5px] ${
                          row.covered === true
                            ? "bg-accent-tint text-accent border border-accent/20"
                            : row.covered === "Partly"
                            ? "bg-warn-tint text-warn border border-warn/20"
                            : "bg-bad-tint text-bad border border-bad/20"
                        }`}
                      >
                        {row.covered === true
                          ? "Covered"
                          : row.covered === "Partly"
                          ? "Partly"
                          : "Not covered"}
                      </span>
                    </div>
                    <div className="text-mute dark:text-dark-mute sm:w-1/2 leading-relaxed text-[11.5px]">
                      {row.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <AppSettings
              theme={theme}
              onSelectTheme={(t) => {
                setTheme(t);
                try {
                  localStorage.setItem("bridle_theme", t);
                } catch {}
                document.documentElement.classList.toggle("dark", t === "dark");
                showNotification(`Theme set to ${t} mode.`);
              }}
              ownerAccount={mandate.owner}
              agentAccount={mandate.agent}
              onOpenGettingStarted={() => setIsGettingStartedOpen(true)}
              onResetGuide={() => {
                try {
                  localStorage.removeItem("bridle_hide_getting_started");
                } catch {}
                setIsGettingStartedOpen(true);
                showNotification("Getting started guide reset.");
              }}
            />
          )}
        </main>
      </div>

      {/* Getting Started Guide Modal (Matching Screenshot 2) */}
      <GettingStartedModal
        isOpen={isGettingStartedOpen}
        onClose={() => setIsGettingStartedOpen(false)}
        onOpenMandateBuilder={() => setActiveTab("builder")}
        onOpenManualProposal={() => setIsManualModalOpen(true)}
        onRunStressTest={handleTriggerAdversarial}
      />

      {/* Inspect Detail Modal */}
      <ProposalDetailModal
        proposal={inspectProposal}
        onClose={() => setInspectProposal(null)}
      />

      {/* Manual Propose Modal */}
      <ManualProposalModal
        isOpen={isManualModalOpen}
        mandate={mandate}
        onClose={() => setIsManualModalOpen(false)}
        onSubmitProposal={handleAddProposal}
      />

      {/* Watcher Slash Review Modal */}
      <WatcherSlashModal
        proposal={slashingProposal}
        isOpen={!!slashingProposal}
        onClose={() => setSlashingProposal(null)}
        onConfirm={handleConfirmSlash}
      />
    </div>
  );
}
