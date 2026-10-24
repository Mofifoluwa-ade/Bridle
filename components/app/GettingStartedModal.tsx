"use client";

import { useState, useEffect } from "react";

type GettingStartedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenMandateBuilder: () => void;
  onOpenManualProposal: () => void;
  onRunStressTest: () => void;
};

type LevelData = {
  id: number;
  title: string;
  shortDesc: string;
  actionText?: string;
  uncovered: {
    tag: string;
    metrics: { label: string; value: string }[];
    insight: string;
  };
};

export function GettingStartedModal({
  isOpen,
  onClose,
  onOpenMandateBuilder,
  onOpenManualProposal,
  onRunStressTest,
}: GettingStartedModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [expandedLevel, setExpandedLevel] = useState<number>(2);

  // Lock background scrolling completely on body and documentElement when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const levels: LevelData[] = [
    {
      id: 1,
      title: "Connect owner wallet",
      shortDesc: "Authenticated on NEAR Testnet (mofifoluwa.testnet).",
      uncovered: {
        tag: "Level 1 Uncovered · Key Root",
        metrics: [
          { label: "Account", value: "mofifoluwa.testnet" },
          { label: "Signer contract", value: "v1.signer-prod.testnet" },
        ],
        insight:
          "Owner wallet holds root veto power. The AI agent never receives private keys or seed phrases.",
      },
    },
    {
      id: 2,
      title: "Sign your agent's mandate",
      shortDesc: "Define caps, challenge cooldowns, and allowlisted addresses.",
      actionText: "Configure in builder",
      uncovered: {
        tag: "Level 2 Uncovered · Enforced Caps",
        metrics: [
          { label: "Daily cap", value: "$50.00" },
          { label: "Per-tx cap", value: "$25.00" },
          { label: "Cooling pause", value: "> $20.00 (10m delay)" },
        ],
        insight:
          "All spending is bound by strict invariant math on-chain. If an agent tries to overspend, the contract rejects it before signing.",
      },
    },
    {
      id: 3,
      title: "Verify multi-chain derived accounts",
      shortDesc: "Inspect keyless derived accounts across EVM and Solana.",
      actionText: "Inspect accounts",
      uncovered: {
        tag: "Level 3 Uncovered · Derived Accounts",
        metrics: [
          { label: "Base Sepolia (EVM)", value: "0x93A5...82F1" },
          { label: "Solana Devnet (SVM)", value: "7xKp...9B2v" },
        ],
        insight:
          "One NEAR account deterministically controls external chain wallets. The runner sends only 4 parameters; contract builds the raw tx bytes.",
      },
    },
    {
      id: 4,
      title: "Test spend defense",
      shortDesc: "Dispatch payments and simulate prompt-injection overspends.",
      actionText: "Run stress test",
      uncovered: {
        tag: "Level 4 Uncovered · Threat Defense",
        metrics: [
          { label: "Stress vector A", value: "$240 overspend (Blocked)" },
          { label: "Stress vector B", value: "Unlisted recipient (Blocked)" },
          { label: "Slash game", value: "1.0 NEAR bond locked" },
        ],
        insight:
          "Watchers post 0.1 NEAR to flag malicious proposals. Confirmed breaches slash the agent bond (40% watcher, 30% owner, 30% burned).",
      },
    },
  ];

  const doneCount = completedSteps.length;
  const progressPercent = (doneCount / levels.length) * 100;

  const toggleStepDone = (id: number) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter((s) => s !== id));
    } else {
      const nextDone = [...completedSteps, id];
      setCompletedSteps(nextDone);
      // Auto-expand next incomplete level
      const nextIncomplete = levels.find((l) => !nextDone.includes(l.id));
      if (nextIncomplete) {
        setExpandedLevel(nextIncomplete.id);
      }
    }
  };

  const handleAction = (stepId: number) => {
    if (stepId === 2) {
      if (!completedSteps.includes(2)) toggleStepDone(2);
      onClose();
      onOpenMandateBuilder();
    } else if (stepId === 3) {
      if (!completedSteps.includes(3)) toggleStepDone(3);
      onClose();
      onOpenMandateBuilder();
    } else if (stepId === 4) {
      if (!completedSteps.includes(4)) toggleStepDone(4);
      onClose();
      onRunStressTest();
    }
  };

  const handleDontShowAgain = () => {
    try {
      localStorage.setItem("bridle_hide_getting_started", "true");
    } catch {}
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[430px] my-auto max-h-[min(580px,calc(100vh-2rem))] flex flex-col rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 shadow-2xl text-ink dark:text-dark-text transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between flex-none">
          <span className="font-mono text-[10px] uppercase tracking-wider text-mute dark:text-dark-mute font-semibold">
            {doneCount} OF {levels.length} COMPLETED
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors p-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="flex-none mt-1">
          <h2 className="text-lg sm:text-xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
            Getting started
          </h2>
          <p className="text-xs text-mute dark:text-dark-mute mt-0.5">
            Four levels of protocol verification. Each level uncovers deeper telemetry.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-line dark:bg-dark-border rounded-full mt-2.5 overflow-hidden flex-none">
          <div
            className="h-full bg-ink dark:bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Levels List with Progressive Disclosure */}
        <div className="mt-3 space-y-2 overflow-y-auto max-h-[44vh] pr-0.5">
          {levels.map((lvl) => {
            const isDone = completedSteps.includes(lvl.id);
            const isExpanded = expandedLevel === lvl.id;

            return (
              <div
                key={lvl.id}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? "border-accent/40 bg-accent-tint/10 dark:bg-accent-tint/5 shadow-2xs"
                    : "border-line dark:border-dark-border bg-paper dark:bg-dark-bg/60 hover:border-rule dark:hover:border-dark-mute"
                }`}
              >
                {/* Level Summary Header Row */}
                <div
                  onClick={() => setExpandedLevel(isExpanded ? 0 : lvl.id)}
                  className="flex items-start justify-between gap-2.5 p-2.5 cursor-pointer select-none"
                >
                  {/* Left: Checkmark / Level Indicator */}
                  <div className="pt-0.5 flex-none">
                    {isDone ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepDone(lvl.id);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-[10px] font-bold shadow-2xs"
                        title="Mark incomplete"
                      >
                        ✓
                      </button>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-line dark:border-dark-mute text-[10px] font-semibold text-mute dark:text-dark-mute">
                        {lvl.id}
                      </div>
                    )}
                  </div>

                  {/* Middle: Title & Short Desc */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-[13px] font-semibold leading-tight ${
                          isDone
                            ? "text-mute dark:text-dark-mute line-through"
                            : "text-ink dark:text-white"
                        }`}
                      >
                        {lvl.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-mute dark:text-dark-mute mt-0.5 leading-snug">
                      {lvl.shortDesc}
                    </p>
                  </div>

                  {/* Right: Expand / Collapse chevron indicator */}
                  <div className="flex-none pt-1 text-mute dark:text-dark-mute text-xs">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {/* Uncovered Info Panel (Revealed when level is expanded) */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-line/60 dark:border-dark-border/60 text-xs">
                    {/* Uncovered Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                        {lvl.uncovered.tag}
                      </span>
                      {!isDone ? (
                        <button
                          type="button"
                          onClick={() => toggleStepDone(lvl.id)}
                          className="text-[10.5px] text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white underline transition-colors"
                        >
                          Mark complete
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-accent font-medium">
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Metric Cards */}
                    <div className="space-y-1.5 font-mono text-[11px]">
                      {lvl.uncovered.metrics.map((m) => (
                        <div
                          key={m.label}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-dark-card border border-line/70 dark:border-dark-border"
                        >
                          <span className="text-mute dark:text-dark-mute text-[10.5px]">
                            {m.label}
                          </span>
                          <span className="font-semibold text-ink dark:text-white text-[11px] truncate max-w-[190px]">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Deep Telemetry Insight */}
                    <div className="mt-2 text-[11px] text-mute dark:text-dark-mute leading-relaxed bg-white/70 dark:bg-dark-card/60 p-2 rounded-lg border border-line/40 dark:border-dark-border/40">
                      <span className="font-semibold text-ink dark:text-white">
                        Invariant:{" "}
                      </span>
                      {lvl.uncovered.insight}
                    </div>

                    {/* Level Action Button */}
                    {lvl.actionText && (
                      <div className="mt-2.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleAction(lvl.id)}
                          className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-3 py-1 text-[11px] font-semibold shadow-sm transition-transform hover:scale-105"
                        >
                          {lvl.actionText} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-line dark:border-dark-border flex items-center justify-between flex-none">
          <button
            type="button"
            onClick={handleDontShowAgain}
            className="text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
          >
            Don&apos;t show again
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3.5 py-1 text-xs font-semibold text-ink dark:text-white hover:bg-line/40 dark:hover:bg-dark-card-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
