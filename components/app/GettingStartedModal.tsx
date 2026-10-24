"use client";

import { useState, useEffect } from "react";

type GettingStartedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenMandateBuilder: () => void;
  onOpenManualProposal: () => void;
  onRunStressTest: () => void;
};

type Step = {
  id: number;
  title: string;
  description: string;
  actionText?: string;
  isDone: boolean;
};

export function GettingStartedModal({
  isOpen,
  onClose,
  onOpenMandateBuilder,
  onOpenManualProposal,
  onRunStressTest,
}: GettingStartedModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

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
      description: "Owner account authenticated on NEAR Testnet (mofifoluwa.testnet).",
      isDone: completedSteps.includes(1),
    },
    {
      id: 2,
      title: "Sign your agent's mandate",
      description:
        "Define caps, cooling thresholds, and allowlisted addresses. The agent never holds a key.",
      actionText: "Configure",
      isDone: completedSteps.includes(2),
    },
    {
      id: 3,
      title: "Verify multi-chain derived accounts",
      description:
        "Inspect the agent's derived MPC addresses on Base Sepolia and Solana Devnet.",
      actionText: "Inspect",
      isDone: completedSteps.includes(3),
    },
    {
      id: 4,
      title: "Test policy enforcement",
      description:
        "Dispatch a legitimate spend or simulate prompt-injection to verify limits.",
      actionText: "Test spend",
      isDone: completedSteps.includes(4),
    },
  ];

  const doneCount = completedSteps.length;
  const progressPercent = (doneCount / steps.length) * 100;

  const toggleStepDone = (id: number) => {
    if (completedSteps.includes(id)) {
      setCompletedSteps(completedSteps.filter((s) => s !== id));
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
  };

  const handleAction = (stepId: number) => {
    if (stepId === 2) {
      toggleStepDone(2);
      onClose();
      onOpenMandateBuilder();
    } else if (stepId === 3) {
      toggleStepDone(3);
      onClose();
      onOpenMandateBuilder();
    } else if (stepId === 4) {
      toggleStepDone(4);
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
      <div className="relative w-full max-w-[420px] my-auto max-h-[min(540px,calc(100vh-2rem))] flex flex-col rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 shadow-2xl text-ink dark:text-dark-text transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between flex-none">
          <span className="font-mono text-[10px] uppercase tracking-wider text-mute dark:text-dark-mute font-semibold">
            {doneCount} OF {steps.length} DONE
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
            A few steps to get going. Each one takes a minute.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-line dark:bg-dark-border rounded-full mt-2.5 overflow-hidden flex-none">
          <div
            className="h-full bg-ink dark:bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps List (Scrollable if screen is extremely short, otherwise fits cleanly) */}
        <div className="mt-2.5 space-y-1.5 overflow-y-auto max-h-[38vh] sm:max-h-[42vh] pr-0.5">
          {steps.map((step) => {
            return (
              <div
                key={step.id}
                className="flex items-start justify-between gap-2.5 p-2 rounded-xl hover:bg-paper dark:hover:bg-dark-card-hover/50 transition-colors"
              >
                {/* Left: Checkmark or Number */}
                <div className="pt-0.5">
                  {step.isDone ? (
                    <button
                      type="button"
                      onClick={() => toggleStepDone(step.id)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-[10px] font-bold"
                      title="Mark incomplete"
                    >
                      ✓
                    </button>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-line dark:border-dark-mute text-[10px] font-medium text-mute dark:text-dark-mute">
                      {step.id}
                    </div>
                  )}
                </div>

                {/* Middle: Title & Subtitle */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs sm:text-[13px] font-semibold leading-tight ${
                      step.isDone ? "text-mute dark:text-dark-mute line-through" : "text-ink dark:text-white"
                    }`}
                  >
                    {step.title}
                  </div>
                  <p className="text-[11px] text-mute dark:text-dark-mute mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>

                {/* Right: Action button */}
                <div className="flex-none pt-0.5">
                  {!step.isDone && step.actionText ? (
                    <button
                      type="button"
                      onClick={() => handleAction(step.id)}
                      className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-transform hover:scale-105"
                    >
                      {step.actionText}
                    </button>
                  ) : !step.isDone ? (
                    <button
                      type="button"
                      onClick={() => toggleStepDone(step.id)}
                      className="text-[11px] text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
                    >
                      Mark done
                    </button>
                  ) : null}
                </div>
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
