"use client";

import { useState, useEffect } from "react";

type GettingStartedModalProps = {
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
  isOpen,
  onClose,
  onStartTour,
  onOpenMandateBuilder,
  onOpenManualProposal,
  onRunStressTest,
}: GettingStartedModalProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [activeStepId, setActiveStepId] = useState<number>(2);

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
      description:
        "Owner account authenticated on NEAR Testnet (mofifoluwa.testnet).",
      actionText: "Focus wallet",
    },
    {
      id: 2,
      title: "Sign your agent's mandate",
      description:
        "Define caps, cooling thresholds, and allowlisted addresses. The agent never holds a private key.",
      actionText: "Go to mandate",
    },
    {
      id: 3,
      title: "Test policy enforcement",
      description:
        "Dispatch a payment or simulate a prompt-injection overspend to verify the contract leash.",
      actionText: "Test defense",
    },
    {
      id: 4,
      title: "The Watcher Veto",
      description:
        "Every payment above the pause limit waits in a challenge window where you keep the veto.",
      actionText: "Watch station",
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

  // Trigger spotlight walkthrough on a specific step
  const handleSpotlightStep = (stepId: number) => {
    if (onStartTour) {
      onStartTour(stepId);
    } else {
      handleAction(stepId);
    }
  };

  // Complete a step and advance sequentially
  const handleCompleteAndAdvance = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps((prev) => [...prev, stepId]);
    }
    const nextStep = stepId + 1;
    if (nextStep <= steps.length) {
      setActiveStepId(nextStep);
    }
  };

  const handleAction = (stepId: number) => {
    handleCompleteAndAdvance(stepId);

    if (onStartTour) {
      onStartTour(stepId);
      return;
    }

    if (stepId === 2) {
      onClose();
      onOpenMandateBuilder();
    } else if (stepId === 3) {
      onClose();
      onRunStressTest();
    } else if (stepId === 4) {
      onClose();
      onOpenMandateBuilder();
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
        {/* Header: Progress Counter and Close Icon */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium">
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

        {/* Title & Subtitle */}
        <div className="mt-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
            Getting started
          </h2>
          <p className="text-xs text-mute dark:text-dark-mute mt-1">
            Tap any step to dim the screen and spotlight that exact button.
          </p>
        </div>

        {/* Game Tutorial Mode Trigger Banner */}
        <button
          type="button"
          onClick={() => handleSpotlightStep(activeStepId)}
          className="mt-3.5 w-full flex items-center justify-between p-3 rounded-2xl border border-accent/30 bg-accent-tint/30 dark:bg-accent-tint/15 text-left hover:border-accent transition-all group shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink dark:bg-white text-white dark:text-ink font-bold text-xs shadow-sm">
              🎯
            </span>
            <div>
              <span className="block text-xs font-semibold text-ink dark:text-white">
                Launch Spotlight Mode
              </span>
              <span className="block text-[11px] text-mute dark:text-dark-mute">
                Dims screen and guides you to each button
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-accent dark:text-[#46D9A4] group-hover:translate-x-0.5 transition-transform">
            Start tour →
          </span>
        </button>

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
                  className="flex items-start justify-between gap-3 pt-1"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
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
                    </div>
                  </div>

                  {/* Action or Resume button */}
                  <div className="flex-none pt-0.5 pl-2">
                    <button
                      type="button"
                      onClick={() => handleSpotlightStep(step.id)}
                      className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105 flex items-center gap-1"
                    >
                      <span>🎯</span>
                      <span>{step.actionText}</span>
                    </button>
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
