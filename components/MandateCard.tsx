"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero card. A ~13 second loop that shows the whole product:
 * the mandate writes itself and goes active, then three decisions arrive
 * (approved, blocked, held), the owner vetoes the held one, and it repeats.
 *
 * Pauses when off-screen or the tab is hidden. With prefers-reduced-motion
 * it renders the final state as a still. The card keeps a fixed height, so
 * nothing below it moves while it plays.
 */

const HEADLINE =
  "Up to $50 a day, to three approved recipients. Pause anything over $20.".split(" ");
const CHIPS = ["Base", "Solana", "USDC"];

// 0 empty · 1 approved · 2 blocked · 3 waiting · 4 cursor arrives · 5 vetoed · 6 fading out
type Feed = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TONE = {
  ok: "bg-[#E7F2EE] text-[#0A7C59] dark:bg-accent-tint dark:text-[#46D9A4]",
  bad: "bg-[#FDECEA] text-[#B42318] dark:bg-bad-tint/15 dark:text-bad",
  warn: "bg-[#FEF3E2] text-[#B54708] dark:bg-warn-tint/15 dark:text-warn",
  off: "bg-[#ECEEF2] text-ink dark:bg-dark-subtle dark:text-dark-soft",
} as const;

export function MandateCard() {
  const root = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);
  const [intro, setIntro] = useState(0); // 1 words · 2 chips · 3 active
  const [feed, setFeed] = useState<Feed>(0);
  const [cycle, setCycle] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let inView = true;
    const sync = () => setVisible(inView && !document.hidden);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (reduced) {
      setIntro(3);
      setFeed(5);
      return;
    }
    if (!visible) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    let t: number;
    if (!introDone.current) {
      at(150, () => setIntro(1));
      at(1900, () => setIntro(2));
      at(2700, () => {
        setIntro(3);
        introDone.current = true;
      });
      t = 3300;
    } else {
      setIntro(3);
      t = 500;
    }
    at(t, () => setFeed(1));
    at(t + 1600, () => setFeed(2));
    at(t + 3200, () => setFeed(3));
    at(t + 5600, () => setFeed(4));
    at(t + 6500, () => setFeed(5));
    at(t + 8800, () => setFeed(6));
    at(t + 9500, () => {
      setFeed(0);
      setCycle((c) => c + 1);
    });
    return () => timers.forEach(clearTimeout);
  }, [visible, reduced, cycle]);

  const shown = (n: number) => feed >= n && feed !== 6;
  const vetoed = feed === 5;
  const budget = shown(1) ? 36 : 0;

  return (
    <div>
      <div
        ref={root}
        role="img"
        aria-label="Animated illustration: a mandate goes active, then one payment is approved, one is blocked, and one is held until the owner vetoes it."
        className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 sm:p-7 md:p-8 shadow-sm transition-colors text-ink dark:text-dark-text"
      >
        <div aria-hidden>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute dark:text-dark-mute font-medium">
              Mandate
            </span>
            <span className="relative grid h-[30px] min-w-[84px] place-items-center">
              <Pill show={intro < 3} off>Draft</Pill>
              <Pill show={intro >= 3}>Active</Pill>
              {intro >= 3 && !reduced && (
                <span className="pointer-events-none absolute right-0 h-[30px] w-[74px] animate-hero-ping rounded-full border-2 border-accent" />
              )}
            </span>
          </div>

          <p className="mt-4 sm:mt-5 text-[20px] sm:text-[25px] font-medium leading-[1.3] tracking-[-0.02em] text-ink dark:text-white">
            {HEADLINE.map((w, i) => (
              <span
                key={i}
                className="mr-[0.27em] inline-block transition-all duration-500 ease-out"
                style={{
                  opacity: intro >= 1 ? 1 : 0,
                  transform: intro >= 1 ? "translateY(0)" : "translateY(8px)",
                  transitionDelay: reduced ? "0ms" : `${i * 70}ms`,
                }}
              >
                {w}
              </span>
            ))}
          </p>

          <div className="mt-4 sm:mt-5 flex flex-wrap gap-2">
            {CHIPS.map((c, i) => (
              <span
                key={c}
                className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-1.5 text-[13px] text-mute dark:text-dark-mute font-medium transition-all duration-500"
                style={{
                  opacity: intro >= 2 ? 1 : 0,
                  transform: intro >= 2 ? "scale(1)" : "scale(.8)",
                  transitionDelay: reduced ? "0ms" : `${i * 130}ms`,
                  transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
                }}
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mb-3 mt-6 sm:mt-7 h-px bg-line dark:bg-dark-border" />
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute dark:text-dark-mute font-medium">
              Live feed
            </span>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-mute dark:text-dark-mute">
              Today
              <span className="h-[5px] w-[72px] overflow-hidden rounded-full bg-[#ECEEF2] dark:bg-dark-subtle">
                <span
                  className="block h-full rounded-full bg-accent transition-[width] duration-[900ms] ease-out"
                  style={{ width: `${budget}%` }}
                />
              </span>
            </span>
          </div>

          {/* Three fixed slots so the card never changes height while it plays */}
          <ul className="relative h-[228px]">
            <Row
              show={shown(1)}
              tone="ok"
              icon="check"
              title="Invoice paid"
              detail="Approved recipient"
              amount="$18.00"
              top="top-0"
            />
            <Row
              show={shown(2)}
              tone="bad"
              icon="x"
              title="Blocked"
              detail="Recipient not on the list"
              amount="$240.00"
              strike
              shake
              top="top-[76px]"
            />
            <li
              className={`absolute inset-x-0 top-[152px] flex items-center gap-3 sm:gap-4 py-3 transition-all duration-500 ${
                shown(3) ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-full transition-colors duration-300 ${
                  vetoed ? TONE.off : TONE.warn
                }`}
              >
                <Icon kind={vetoed ? "x" : "pause"} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] sm:text-[15px] font-semibold text-ink dark:text-white">
                  {vetoed ? "Vetoed" : "Waiting for your veto"}
                </div>
                <div className="truncate text-[12.5px] sm:text-[13px] text-mute dark:text-dark-mute">
                  {vetoed ? "Nothing moved" : "Above the $20 threshold"}
                </div>
                <div
                  className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#FEF3E2] dark:bg-warn-tint/15"
                  style={{ opacity: feed >= 3 && feed < 5 ? 1 : 0, transition: "opacity .3s" }}
                >
                  {feed >= 3 && feed < 5 && <div className="h-full origin-left bg-warn animate-hero-drain" />}
                </div>
              </div>
              <div className="relative flex min-w-[84px] flex-none justify-end pl-2">
                {feed === 4 ? (
                  <span className="rounded-full border-[1.5px] border-bad px-3.5 py-1 text-[13px] font-semibold text-bad">
                    Veto
                  </span>
                ) : vetoed ? (
                  <span className="relative scale-95 rounded-full border-[1.5px] border-bad bg-bad px-3.5 py-1 text-[13px] font-semibold text-white">
                    Veto
                    <span className="absolute inset-0 rounded-full border-2 border-bad animate-hero-ping" />
                  </span>
                ) : (
                  <span className="font-mono text-[15px] sm:text-base font-semibold text-ink dark:text-white">
                    $32.00
                  </span>
                )}
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute -bottom-3 right-1 transition-all duration-700 ease-out"
                  style={{
                    transform:
                      feed === 4 ? "translate(0,0)" : vetoed ? "translate(0,0) scale(.88)" : "translate(60px,50px)",
                    opacity: feed === 4 || vetoed ? 1 : 0,
                  }}
                >
                  <path
                    d="M5 3l14 8-6 2 4 7-3 1.5-4-7-5 4z"
                    className="fill-ink stroke-white dark:fill-white dark:stroke-dark-card"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-3.5 text-center text-[12.5px] text-mute dark:text-dark-mute">
        <a
          href="/app"
          className="font-medium text-ink dark:text-white underline transition-colors hover:text-accent dark:hover:text-accent"
        >
          Open policy monitor →
        </a>
      </p>
    </div>
  );
}

function Pill({ show, off, children }: { show: boolean; off?: boolean; children: string }) {
  return (
    <span
      className={`absolute right-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-500 ${
        off
          ? "border-line bg-[#ECEEF2] text-mute dark:border-dark-border dark:bg-dark-subtle dark:text-dark-mute"
          : "border-accent/20 bg-accent-tint text-accent dark:text-[#46D9A4]"
      }`}
      style={{ opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(.9)" }}
    >
      {children}
    </span>
  );
}

function Row({
  show,
  tone,
  icon,
  title,
  detail,
  amount,
  top,
  strike,
  shake,
}: {
  show: boolean;
  tone: "ok" | "bad";
  icon: "check" | "x";
  title: string;
  detail: string;
  amount: string;
  top: string;
  strike?: boolean;
  shake?: boolean;
}) {
  return (
    <li
      className={`absolute inset-x-0 ${top} flex items-center gap-3 sm:gap-4 border-b border-line/60 dark:border-dark-border/60 py-3 transition-all duration-500 ${
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div
        className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-full ${TONE[tone]} ${
          show && shake ? "animate-hero-shake" : ""
        }`}
      >
        <Icon kind={icon} draw={show} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] sm:text-[15px] font-semibold text-ink dark:text-white">{title}</div>
        <div className="truncate text-[12.5px] sm:text-[13px] text-mute dark:text-dark-mute">{detail}</div>
      </div>
      <div
        className={`flex-none pl-2 font-mono text-[15px] sm:text-base font-semibold ${
          strike ? "text-mute line-through dark:text-dark-mute" : "text-ink dark:text-white"
        }`}
      >
        {amount}
      </div>
    </li>
  );
}

function Icon({ kind, draw }: { kind: "check" | "x" | "pause"; draw?: boolean }) {
  const d = { check: "M5 12.5l4.5 4.5L19 7.5", x: "M7 7l10 10M17 7L7 17", pause: "M9 7v10M15 7v10" }[kind];
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} strokeDasharray={draw ? 26 : undefined} className={draw ? "animate-hero-draw" : undefined} />
    </svg>
  );
}
