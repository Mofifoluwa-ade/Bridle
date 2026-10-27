"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
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
    questNumber: "STEP 1",
    targetId: "tour-wallet-btn",
    title: "Connect your wallet",
    description:
      "Connect your NEAR wallet to manage your spending rules and approve payments for your AI agent.",
    actionText: "Connect wallet",
    route: "/app",
  },
  {
    id: 2,
    questNumber: "STEP 2",
    targetId: "tour-new-mandate-btn",
    fallbackTargetId: "tour-nav-new-mandate",
    title: "Create spending rules",
    description:
      "Set daily limits, max payment amounts, and who your agent can pay. Your agent can never spend more than this.",
    actionText: "New rule",
    route: "/app",
  },
  {
    id: 3,
    questNumber: "STEP 3",
    targetId: "tour-nav-agent",
    fallbackTargetId: "tour-nav-agent",
    title: "Check agent addresses",
    description:
      "See the multi-chain addresses your agent uses to send payments on Base and Solana without touching private keys.",
    actionText: "View agent",
    route: "/app",
  },
  {
    id: 4,
    questNumber: "STEP 4",
    targetId: "tour-stress-test-btn",
    fallbackTargetId: "tour-nav-dashboard",
    title: "Send a test payment",
    description:
      "Try sending a test payment to see how your rules automatically approve or block requests in real time.",
    actionText: "Test payment",
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

  const endTour = useCallback(() => {
    setIsTourActive(false);
  }, []);

  const openGuideModal = useCallback(() => {
    setIsTourActive(false);
    setIsGuideModalOpen(true);
  }, []);

  const closeGuideModal = useCallback(() => {
    setIsGuideModalOpen(false);
  }, []);

  const startTour = useCallback(
    (stepId?: number) => {
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
    },
    [pathname, router]
  );

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prevIdx) => {
      if (prevIdx < TOUR_STEPS.length - 1) {
        const nextIdx = prevIdx + 1;
        const step = TOUR_STEPS[nextIdx];
        if (step && pathname !== step.route) {
          router.push(step.route);
        }
        return nextIdx;
      } else {
        setIsTourActive(false);
        return prevIdx;
      }
    });
  }, [pathname, router]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prevIdx) => {
      if (prevIdx > 0) {
        const nextIdx = prevIdx - 1;
        const step = TOUR_STEPS[nextIdx];
        if (step && pathname !== step.route) {
          router.push(step.route);
        }
        return nextIdx;
      }
      return prevIdx;
    });
  }, [pathname, router]);

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
  const {
    currentStepIndex,
    startTour,
    nextStep,
    prevStep,
    endTour,
    openGuideModal,
  } = useTour();
  const step = TOUR_STEPS[currentStepIndex];
  const router = useRouter();

  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    radius: number;
  } | null>(null);

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPosition, setCardPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 100, left: 100 });

  // Prevent background scrolling while spotlight is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const preventScroll = (e: Event) => {
      if (cardRef.current && cardRef.current.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };

    const preventKeyScroll = (e: KeyboardEvent) => {
      if (
        ["Space", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.code) &&
        !(cardRef.current && cardRef.current.contains(e.target as Node))
      ) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeyScroll, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeyScroll);
    };
  }, []);

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
        // Add comfortable padding around target
        const pad = 6;
        const computedStyle = window.getComputedStyle(el);
        const computedRadius = parseFloat(computedStyle.borderRadius) || 16;

        const spotW = r.width + pad * 2;
        const spotH = r.height + pad * 2;
        // Auto-contour: if pill button, radius is half-height. Otherwise match element radius.
        const spotRadius = Math.min(
          spotH / 2,
          spotW / 2,
          Math.max(8, computedRadius + pad / 2)
        );

        const spotlightRect = {
          top: Math.max(0, r.top - pad),
          left: Math.max(0, r.left - pad),
          width: spotW,
          height: spotH,
          radius: spotRadius,
        };
        setRect(spotlightRect);

        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });

        // Calculate HUD card position
        const cardW = 360;
        const cardH = 220;
        const spacing = 18;

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

  // When user clicks the illuminated element directly, automatically advance
  useEffect(() => {
    if (!step) return;
    let el = document.getElementById(step.targetId);
    if (!el && step.fallbackTargetId) {
      el = document.getElementById(step.fallbackTargetId);
    }
    if (!el) return;

    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 400);

    let advanceTimer: NodeJS.Timeout | null = null;

    const handleTargetClicked = (e: MouseEvent) => {
      if (!armed) return;
      if (cardRef.current && cardRef.current.contains(e.target as Node)) {
        return;
      }
      advanceTimer = setTimeout(() => {
        nextStep();
      }, 300);
    };

    el.addEventListener("click", handleTargetClicked);
    return () => {
      clearTimeout(armTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
      el?.removeEventListener("click", handleTargetClicked);
    };
  }, [step, nextStep]);

  if (!step) return null;

  const handleAction = () => {
    if (step.id === 1) {
      nextStep();
    } else if (step.id === 2) {
      router.push("/app/mandates/new");
      nextStep();
    } else if (step.id === 3) {
      router.push("/app/agent");
      nextStep();
    } else if (step.id === 4) {
      router.push("/app/agent");
      endTour();
    }
  };

  const buildCutoutPath = () => {
    if (!rect) return "";
    const w = windowSize.width;
    const h = windowSize.height;
    const { left, top, width, height, radius: r } = rect;

    const maxR = Math.min(width / 2, height / 2);
    const cr = Math.max(0, Math.min(r, maxR));

    return [
      `M 0 0 H ${w} V ${h} H 0 Z`,
      `M ${left + cr} ${top}`,
      `H ${left + width - cr}`,
      `A ${cr} ${cr} 0 0 1 ${left + width} ${top + cr}`,
      `V ${top + height - cr}`,
      `A ${cr} ${cr} 0 0 1 ${left + width - cr} ${top + height}`,
      `H ${left + cr}`,
      `A ${cr} ${cr} 0 0 1 ${left} ${top + height - cr}`,
      `V ${top + cr}`,
      `A ${cr} ${cr} 0 0 1 ${left + cr} ${top}`,
      `Z`,
    ].join(" ");
  };

  return (
    <>
      {/* 1. Backdrop with Smooth Rounded Cutout Hole */}
      {rect ? (
        <>
          <svg
            className="fixed inset-0 z-40 w-full h-full pointer-events-auto"
            aria-hidden="true"
          >
            <path
              d={buildCutoutPath()}
              fillRule="evenodd"
              className="fill-black/45 dark:fill-[#05070a]/80 backdrop-blur-xs transition-colors duration-200"
            />
          </svg>

          {/* Highlighted Target Border matching exact rounded corners (static, no pulsing) */}
          <div
            className="fixed z-40 pointer-events-none border-2 border-ink dark:border-[#46D9A4] ring-4 ring-black/10 dark:ring-[#46D9A4]/25 shadow-md dark:shadow-[0_0_20px_rgba(70,217,164,0.35)] transition-all duration-200"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              borderRadius: `${rect.radius}px`,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 z-40 bg-black/45 dark:bg-black/80 backdrop-blur-xs pointer-events-auto transition-opacity duration-300" />
      )}

      {/* 2. Floating Objective HUD Card (Hand in hand with Light / Dark theme) */}
      <div
        ref={cardRef}
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
        }}
        className="fixed z-50 w-[350px] sm:w-[370px] animate-modal-in rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 text-ink dark:text-dark-text shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.85)] transition-all duration-200 pointer-events-auto"
      >
        {/* Quest Badge & Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-line dark:border-dark-border">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4]" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-accent dark:text-[#46D9A4] uppercase">
              STEP {currentStepIndex + 1} OF {TOUR_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => startTour(1)}
              className="text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors p-1"
              title="Restart tour from step 1"
              aria-label="Restart tour from step 1"
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
              onClick={endTour}
              className="text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors text-xs p-1"
              title="Exit tutorial"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quest Title & Description */}
        <div className="mt-3">
          <h3 className="text-[17px] font-semibold tracking-tight text-ink dark:text-white">
            {step.title}
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute dark:text-dark-mute">
            {step.description}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-line dark:border-dark-border">
          <button
            type="button"
            onClick={openGuideModal}
            className="text-[11.5px] text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white underline underline-offset-2 transition-colors"
          >
            Checklist
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-card-hover px-3 py-1.5 text-xs font-medium text-ink dark:text-white hover:bg-line/40 dark:hover:bg-white/10 transition-colors"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleAction}
              className="rounded-full bg-ink text-white hover:bg-night dark:bg-white dark:text-ink dark:hover:bg-gray-100 px-4 py-1.5 text-xs font-semibold shadow-xs transition-transform hover:scale-102 flex items-center gap-1.5"
            >
              <span>{step.actionText}</span>
              <span className="text-[11px]">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
