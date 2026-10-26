"use client";

import { useState, useEffect } from "react";

type GettingStartedModalProps = {
  accountId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: (stepId?: number) => void;
  onOpenMandateBuilder: () => void;
  onOpenManualProposal: () => void;
  onRunStressTest: () => void;
};

type Step = {
  id: number;
  title: string;
  description: string;
  actionText: string;
};

export function GettingStartedModal({
  accountId = null,
  isOpen,
  onClose,
  onStartTour,
  onOpenMandateBuilder,
  onOpenManualProposal,
  onRunStressTest,
}: GettingStartedModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Keep checklist progress between visits; do not imply completion by default
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bridle_getting_started_progress");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((id): id is number =>
            Number.isInteger(id) && id >= 1 && id <= 4
          );
          setCompletedSteps(valid);
          setActiveStepId([1, 2, 3, 4].find((id) => !valid.includes(id)) ?? 4);
        }
      } else if (accountId) {
        setCompletedSteps([1]);
        setActiveStepId(2);
      }
    } catch {}
    setProgressLoaded(true);
  }, [accountId]);

  useEffect(() => {
    if (!progressLoaded) return;
    try {
      localStorage.setItem("bridle_getting_started_progress", JSON.stringify(completedSteps));
    } catch {}
  }, [completedSteps, progressLoaded]);

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

  const steps: Step[] = [
    {
      id: 1,
      title: "Connect owner wallet",
      description: accountId
        ? `Connected owner wallet: ${accountId}.`
        : "Connect your NEAR wallet to identify the account that controls mandates and policy changes.",
      actionText: accountId ? "Connected" : "Connect",
    },
    {
      id: 2,
      title: "Sign your agent's mandate",
      description:
        "Define caps, cooling thresholds, and allowlisted addresses. The agent never holds a private key.",
      actionText: "Go",
    },
    {
      id: 3,
      title: "Verify multi-chain derived accounts",
      description:
        "Inspect the agent's derived MPC addresses on Base Sepolia and Solana Devnet.",
      actionText: "Inspect",
    },
    {
      id: 4,
      title: "Test policy enforcement",
      description:
        "Dispatch a payment or simulate a prompt-injection overspend to verify the leash.",
      actionText: "Test spend",
    },
  ];

  // A step is unlocked if it's step 1 OR if all preceding steps are completed
  const isStepUnlocked = (id: number) => {
    if (id === 1) return true;
    for (let i = 1; i < id; i++) {
      if (!completedSteps.includes(i)) return false;
    }
    return true;
  };

  // The highest uncompleted step in sequential order
  const highestCurrentStepId =
    steps.find((s) => !completedSteps.includes(s.id))?.id ?? steps.length;

  const doneCount = completedSteps.length;
  const progressPercent = (doneCount / steps.length) * 100;

  // Retrace back to a step (only allowed if unlocked; no jumping ahead)
  const handleSelectStep = (id: number) => {
    if (!isStepUnlocked(id)) {
      // Locked: cannot skip or jump ahead
      return;
    }
    setActiveStepId(id);
  };

  const handleRestart = () => {
    setCompletedSteps([]);
    setActiveStepId(1);
    try {
      localStorage.setItem("bridle_getting_started_progress", JSON.stringify([]));
      localStorage.removeItem("bridle_hide_getting_started");
    } catch {}
  };

  // Trigger spotlight walkthrough on a specific step
  const handleSpotlightStep = (stepId: number) => {
    if (onStartTour) {
      onStartTour(stepId);
    } else {
      handleDirectAction(stepId);
    }
  };

  // Complete a step and advance sequentially
  const handleCompleteAndAdvance = (stepId: number) => {
    setCompletedSteps((prev) => (prev.includes(stepId) ? prev : [...prev, stepId]));
    const nextStep = stepId + 1;
    if (nextStep <= steps.length) {
      setActiveStepId(nextStep);
    }
  };

  const handleDirectAction = (stepId: number) => {
    handleCompleteAndAdvance(stepId);
    onClose();

    if (stepId === 1) {
      if (!accountId) {
        const btn = document.getElementById("tour-wallet-btn");
        if (btn) {
          const clickable = btn.querySelector("button") || btn;
          (clickable as HTMLElement).click();
        }
      }
    } else if (stepId === 2) {
      onOpenMandateBuilder();
    } else if (stepId === 3) {
      onOpenManualProposal();
    } else if (stepId === 4) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="animate-modal-in relative w-full max-w-[420px] rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-2xl text-ink dark:text-dark-text transition-colors">
        {/* Header: Progress Counter, Restart Icon, and Close Icon */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
            {doneCount} OF {steps.length} DONE
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-lg p-1 text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-line/40 dark:hover:bg-white/10 transition-colors"
              title="Restart getting started"
              aria-label="Restart getting started"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors p-1"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="mt-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
            Getting started
          </h2>
          <p className="text-xs text-mute dark:text-dark-mute mt-1">
            Follow the steps to configure and verify your agent's payment leash.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-[2px] w-full bg-line dark:bg-white/10 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-ink dark:bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="mt-6 space-y-4">
          {steps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            const isUnlocked = isStepUnlocked(step.id);
            const isActive = step.id === activeStepId;

            // Case 1: Active step currently being viewed or worked on (uncovers details)
            if (isActive) {
              return (
                <div
                  key={step.id}
                  className="rounded-2xl border border-line dark:border-dark-border bg-paper/50 dark:bg-white/[0.03] p-3.5 sm:p-4 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Circle icon */}
                    <div
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-semibold mt-0.5 ${
                        isDone
                          ? "bg-ink text-white dark:bg-white dark:text-ink shadow-2xs"
                          : "border border-line dark:border-white/40 text-ink dark:text-white"
                      }`}
                    >
                      {isDone ? "✓" : step.id}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink dark:text-white leading-snug">
                        {step.title}
                      </div>
                      <p className="text-xs text-mute dark:text-dark-mute mt-1 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Action buttons side by side */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDirectAction(step.id)}
                          className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-transform hover:scale-102 flex items-center gap-1.5"
                        >
                          <span>{step.actionText}</span>
                          <span className="text-[11px]">→</span>
                        </button>
                        {!isDone && (
                          <button
                            type="button"
                            disabled={step.id === 1 && !accountId}
                            onClick={() => handleCompleteAndAdvance(step.id)}
                            className="rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card hover:bg-paper dark:hover:bg-dark-card-hover px-3 py-1.5 text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors shadow-2xs"
                          >
                            Mark complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Case 2: Completed step (can retrace back to review it)
            if (isDone) {
              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between group cursor-pointer py-1"
                  onClick={() => handleSpotlightStep(step.id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-[10px] font-bold shadow-2xs">
                      ✓
                    </div>
                    <span className="text-sm font-medium text-ink/80 dark:text-white/80 group-hover:text-ink dark:group-hover:text-white transition-colors">
                      {step.title}
                    </span>
                  </div>
                  <span className="text-[11.5px] text-mute group-hover:text-accent dark:group-hover:text-[#46D9A4] opacity-0 group-hover:opacity-100 transition-opacity">
                    Spotlight →
                  </span>
                </div>
              );
            }

            // Case 3: Upcoming step
            // If unlocked (reachable sequentially): clickable
            // If locked: cannot jump ahead (no clicking, no skipping)
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between py-1 ${
                  isUnlocked
                    ? "cursor-pointer group"
                    : "opacity-40 cursor-default select-none"
                }`}
                onClick={() => {
                  if (isUnlocked) handleSpotlightStep(step.id);
                }}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-5 text-center text-xs font-medium text-mute dark:text-dark-mute">
                    {step.id}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isUnlocked
                        ? "text-mute dark:text-dark-mute group-hover:text-ink dark:group-hover:text-white transition-colors"
                        : "text-mute dark:text-dark-mute"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {isUnlocked && (
                  <span className="text-[11.5px] text-mute group-hover:text-accent dark:group-hover:text-[#46D9A4] opacity-0 group-hover:opacity-100 transition-opacity">
                    Show me →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-7 flex items-center justify-between">
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
            className="rounded-full bg-paper dark:bg-white/10 hover:bg-line dark:hover:bg-white/20 text-ink dark:text-white px-4 py-1.5 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
