"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

export type TourStep = {
  id: number;
  questNumber: string;
  targetId: string;
  fallbackTargetId?: string;
  title: string;
  description: string;
  actionText: string;
  route: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    questNumber: "QUEST 01",
    targetId: "tour-wallet-btn",
    title: "Connect Owner Wallet",
    description:
      "Signing authority and mandate controls are bound to your NEAR account. Connect your wallet to begin steering your agent.",
    actionText: "Click Wallet",
    route: "/app",
  },
  {
    id: 2,
    questNumber: "QUEST 02",
    targetId: "tour-new-mandate-btn",
    fallbackTargetId: "tour-nav-new-mandate",
    title: "Sign Your Agent's Mandate",
    description:
      "Establish the contract leash: set daily caps, pause thresholds, and authorized destination addresses. The agent never holds private keys.",
    actionText: "Open Mandate Builder",
    route: "/app",
  },
  {
    id: 3,
    questNumber: "QUEST 03",
    targetId: "tour-stress-test-btn",
    fallbackTargetId: "tour-nav-dashboard",
    title: "Stress Test Policy Defense",
    description:
      "Simulate a prompt injection attack trying to steal funds or bypass caps. Watch the contract block it on-chain in real time.",
    actionText: "Simulate Attack",
    route: "/app",
  },
  {
    id: 4,
    questNumber: "QUEST 04",
    targetId: "tour-nav-watch",
    fallbackTargetId: "tour-nav-watch",
    title: "The Watcher Veto",
    description:
      "Payments above the cooling threshold wait in a challenge window. Watchers and owners can veto any suspicious payment before execution.",
    actionText: "Open Watch Station",
    route: "/app",
  },
];

type TourContextType = {
  isTourActive: boolean;
  currentStepIndex: number;
  startTour: (stepId?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  isGuideModalOpen: boolean;
  openGuideModal: () => void;
  closeGuideModal: () => void;
};

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const startTour = (stepId?: number) => {
    setIsGuideModalOpen(false);
    const targetIdx = stepId
      ? TOUR_STEPS.findIndex((s) => s.id === stepId)
      : 0;
    const resolvedIdx = targetIdx >= 0 ? targetIdx : 0;
    setCurrentStepIndex(resolvedIdx);
    setIsTourActive(true);

    const step = TOUR_STEPS[resolvedIdx];
    if (step && pathname !== step.route) {
      router.push(step.route);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const step = TOUR_STEPS[nextIdx];
      if (step && pathname !== step.route) {
        router.push(step.route);
      }
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const step = TOUR_STEPS[prevIdx];
      if (step && pathname !== step.route) {
        router.push(step.route);
      }
    }
  };

  const endTour = () => {
    setIsTourActive(false);
  };

  const openGuideModal = () => {
    setIsTourActive(false);
    setIsGuideModalOpen(true);
  };

  const closeGuideModal = () => {
    setIsGuideModalOpen(false);
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        startTour,
        nextStep,
        prevStep,
        endTour,
        isGuideModalOpen,
        openGuideModal,
        closeGuideModal,
      }}
    >
      {children}
      {isTourActive && <SpotlightOverlay />}
    </TourContext.Provider>
  );
}

function SpotlightOverlay() {
  const { currentStepIndex, nextStep, prevStep, endTour, openGuideModal } =
    useTour();
  const step = TOUR_STEPS[currentStepIndex];
  const router = useRouter();

  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 100, left: 100 });

  // Update target rect on step change, resize, or scroll
  useEffect(() => {
    if (!step) return;

    const findAndMeasureTarget = () => {
      let el = document.getElementById(step.targetId);
      if (!el && step.fallbackTargetId) {
        el = document.getElementById(step.fallbackTargetId);
      }

      if (el) {
        // Smoothly scroll target into view
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

        const r = el.getBoundingClientRect();
        // Add padding around target
        const pad = 6;
        const spotlightRect = {
          top: Math.max(0, r.top - pad),
          left: Math.max(0, r.left - pad),
          width: r.width + pad * 2,
          height: r.height + pad * 2,
        };
        setRect(spotlightRect);

        // Calculate card position
        const cardW = 360;
        const cardH = 210;
        const spacing = 16;

        let top = spotlightRect.top + spotlightRect.height + spacing;
        // If near bottom of viewport, position above target
        if (top + cardH > window.innerHeight) {
          top = Math.max(16, spotlightRect.top - cardH - spacing);
        }

        // Horizontal alignment: Center with target, clamped inside viewport
        let left =
          spotlightRect.left + spotlightRect.width / 2 - cardW / 2;
        left = Math.max(16, Math.min(window.innerWidth - cardW - 16, left));

        setCardPosition({ top, left });
      } else {
        setRect(null);
      }
    };

    // Initial check with brief delay for layout/render
    const timer = setTimeout(findAndMeasureTarget, 100);
    const interval = setInterval(findAndMeasureTarget, 600);

    window.addEventListener("resize", findAndMeasureTarget);
    window.addEventListener("scroll", findAndMeasureTarget, true);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", findAndMeasureTarget);
      window.removeEventListener("scroll", findAndMeasureTarget, true);
    };
  }, [step]);

  if (!step) return null;

  const handleAction = () => {
    if (step.id === 1) {
      // Connect wallet: trigger wallet button
      const btn = document.getElementById("tour-wallet-btn");
      if (btn) btn.click();
      nextStep();
    } else if (step.id === 2) {
      router.push("/app/mandates/new");
      nextStep();
    } else if (step.id === 3) {
      // Stress test: trigger stress test button
      const btn = document.getElementById("tour-stress-test-btn");
      if (btn) btn.click();
      nextStep();
    } else if (step.id === 4) {
      router.push("/app/watch");
      endTour();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-auto"
      role="dialog"
      aria-label="Interactive Game Tutorial"
    >
      {/* 1. Global Dim Overlay with Cutout Glow */}
      {rect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            boxShadow:
              "0 0 0 9999px rgba(5, 7, 10, 0.82), 0 0 35px rgba(70, 217, 164, 0.45)",
          }}
        >
          {/* Animated Glowing Ring & Target Reticle */}
          <div className="absolute inset-0 rounded-2xl border-2 border-[#46D9A4] ring-4 ring-[#46D9A4]/30 shadow-[0_0_25px_rgba(70,217,164,0.6)] animate-pulse" />
          <div className="absolute -inset-1 rounded-[18px] border border-white/40 opacity-75" />
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300" />
      )}

      {/* 2. Floating Game HUD Objective Card */}
      <div
        ref={cardRef}
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
        }}
        className="fixed z-50 w-[350px] sm:w-[370px] animate-modal-in rounded-3xl border border-[#46D9A4]/35 bg-[#0F1116]/95 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md transition-all duration-200"
      >
        {/* Quest Badge & Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#46D9A4] shadow-[0_0_8px_#46D9A4] animate-ping" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-[#46D9A4] uppercase">
              {step.questNumber} • STEP {currentStepIndex + 1} OF{" "}
              {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={endTour}
            className="text-white/50 hover:text-white transition-colors text-xs p-1"
            title="Exit tutorial"
          >
            ✕
          </button>
        </div>

        {/* Quest Title & Description */}
        <div className="mt-3">
          <h3 className="text-[17px] font-semibold tracking-tight text-white flex items-center gap-1.5">
            <span>🎯</span>
            <span>{step.title}</span>
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-300">
            {step.description}
          </p>
        </div>

        {/* Interactive Pointer Hint */}
        <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-[11.5px] text-[#46D9A4]">
          <span className="text-sm">👆</span>
          <span className="font-medium text-gray-200 truncate">
            Target illuminated on screen. Tap to interact!
          </span>
        </div>

        {/* Controls Bar */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={openGuideModal}
            className="text-[11.5px] text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            Checklist
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleAction}
              className="rounded-full bg-[#46D9A4] hover:bg-[#3bc493] text-black px-4 py-1.5 text-xs font-semibold shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
            >
              <span>{step.actionText}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
