"use client";

import { useEffect, useRef, useState } from "react";
import { Container, Eyebrow } from "./Container";

type Attempt = {
  id: string;
  label: string;
  /** Dollars the attempt would move. Zero for the stop action. */
  amount: number;
  key: { text: string; tone: "bad" | "plain" };
  bridle: { status: "Blocked" | "Paid" | "Held" | "Revoked"; text: string };
};

const attempts: Attempt[] = [
  {
    id: "stranger",
    label: "Pay $900 to an address it has never seen",
    amount: 900,
    key: { text: "Sent. $900 is gone.", tone: "bad" },
    bridle: { status: "Blocked", text: "Over the $50 cap, and not an approved recipient." },
  },
  {
    id: "small",
    label: "Pay $12 to an approved recipient",
    amount: 12,
    key: { text: "Sent.", tone: "plain" },
    bridle: { status: "Paid", text: "Within the rule." },
  },
  {
    id: "large",
    label: "Pay $35 to an approved recipient",
    amount: 35,
    key: { text: "Sent. You were never asked.", tone: "bad" },
    bridle: { status: "Held", text: "Above $20. Waiting for your veto." },
  },
  {
    id: "stop",
    label: "Stop the agent",
    amount: 0,
    key: { text: "Rotate the key and hope nothing is pending.", tone: "bad" },
    bridle: { status: "Revoked", text: "One signature. Pending payments cancelled." },
  },
];

const pill: Record<Attempt["bridle"]["status"], string> = {
  Blocked: "bg-bad-tint text-bad dark:bg-bad/20 dark:text-[#FDA29B]",
  Paid: "bg-accent-tint text-accent dark:bg-accent-dark/15 dark:text-accent-dark",
  Held: "bg-warn-tint text-warn dark:bg-warn/25 dark:text-[#FEC84B]",
  Revoked: "bg-ink text-white dark:bg-white dark:text-ink",
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Try to break it. The same attempt is made against a wallet that holds a key and against one under a Bridle rule.
 * Every figure is an example, and the section says so.
 */
export function Compare() {
  const [ran, setRan] = useState<string[]>([]);
  const touched = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const root = useRef<HTMLDivElement>(null);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setRan(attempts.map((a) => a.id));
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          timers.current.push(
            setTimeout(() => {
              if (!touched.current) setRan(["stranger"]);
            }, 1000),
          );
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clear();
    };
  }, []);

  const run = (id: string) => {
    touched.current = true;
    clear();
    setRan((r) => (r.includes(id) ? r : [...r, id]));
  };
  const runAll = () => {
    touched.current = true;
    clear();
    setRan([]);
    attempts.forEach((a, i) => timers.current.push(setTimeout(() => setRan((r) => [...r, a.id]), 250 + i * 750)));
  };
  const reset = () => {
    touched.current = true;
    clear();
    setRan([]);
  };

  const done = attempts.filter((a) => ran.includes(a.id));
  const moved = done.reduce((n, a) => n + a.amount, 0);
  const paid = done.filter((a) => a.bridle.status === "Paid").reduce((n, a) => n + a.amount, 0);
  const held = done.filter((a) => a.bridle.status === "Held").reduce((n, a) => n + a.amount, 0);
  const blocked = done.filter((a) => a.bridle.status === "Blocked").reduce((n, a) => n + a.amount, 0);

  return (
    <Container className="pb-20 pt-6 sm:pb-28 sm:pt-12">
      <section id="compare" aria-labelledby="compare-title" ref={root}>
        <div className="mx-auto max-w-[880px] text-center">
          <Eyebrow>The difference</Eyebrow>
          <h2 id="compare-title" className="text-[clamp(30px,5vw,56px)] font-semibold leading-[1.05] tracking-display text-ink dark:text-white">
            Most agent wallets ask you to trust the agent. Bridle does not.
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.65] text-mute dark:text-dark-mute">
            Same agent, same mistake, two wallets. Pick something it might get wrong.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[980px] overflow-hidden rounded-[24px] border border-line bg-white shadow-sm dark:border-dark-border dark:bg-dark-card sm:mt-14">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-3.5 dark:border-dark-border sm:px-7">
            <p className="font-mono text-[11px] tracking-[0.04em] text-ink dark:text-white">
              <span className="text-mute dark:text-dark-mute">Rule </span>$50 a payment · pause above $20 · 3 approved recipients
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">Illustration · example amounts</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4 dark:border-dark-border sm:px-7">
            {attempts.map((a) => {
              const used = ran.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => run(a.id)}
                  aria-pressed={used}
                  className={`min-h-[40px] rounded-full border px-4 text-left text-[13px] font-medium transition-all duration-200 ${
                    used
                      ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink"
                      : "border-rule text-ink hover:-translate-y-px hover:border-ink dark:border-dark-border dark:text-white dark:hover:border-white"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
            <span className="ml-auto flex gap-1 text-[13px]">
              <button type="button" onClick={runAll} className="min-h-[40px] rounded-full px-3 font-semibold text-accent hover:underline dark:text-accent-dark">
                Run all
              </button>
              {ran.length > 0 && (
                <button type="button" onClick={reset} className="min-h-[40px] rounded-full px-3 text-mute hover:text-ink dark:text-dark-mute dark:hover:text-white">
                  Reset
                </button>
              )}
            </span>
          </div>

          <div className="grid divide-line dark:divide-dark-border md:grid-cols-2 md:divide-x">
            <div className="p-5 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">An agent holding a key</p>
              <ul aria-live="polite" className="mt-4 min-h-[196px] space-y-2.5">
                {done.length === 0 && <li className="text-[14px] text-mute dark:text-dark-mute">Nothing attempted yet.</li>}
                {done.map((a) => (
                  <li key={a.id} className="compare-row rounded-xl border border-line px-4 py-3 dark:border-dark-border">
                    <p className="text-[12px] text-mute dark:text-dark-mute">{a.label}</p>
                    <p className={`mt-1 text-[15px] font-medium ${a.key.tone === "bad" ? "text-bad dark:text-[#FDA29B]" : "text-ink dark:text-white"}`}>{a.key.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-line bg-paper/60 p-5 dark:border-dark-border dark:bg-dark-bg/40 sm:p-7 md:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">An agent under a Bridle rule</p>
              <ul aria-live="polite" className="mt-4 min-h-[196px] space-y-2.5">
                {done.length === 0 && <li className="text-[14px] text-mute dark:text-dark-mute">Nothing attempted yet.</li>}
                {done.map((a) => (
                  <li key={a.id} className="compare-row rounded-xl border border-line bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-card">
                    <p className="text-[12px] text-mute dark:text-dark-mute">{a.label}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-medium text-ink dark:text-white">
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${pill[a.bridle.status]}`}>{a.bridle.status}</span>
                      {a.bridle.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-px border-t border-line bg-line dark:border-dark-border dark:bg-dark-border md:grid-cols-2">
            <p className="bg-white px-5 py-4 text-[14px] text-mute dark:bg-dark-card dark:text-dark-mute sm:px-7">
              {moved > 0 ? (
                <>
                  <span className="font-semibold text-bad dark:text-[#FDA29B]">{usd(moved)}</span> left the wallet, and nothing asked you first.
                </>
              ) : (
                "Nothing has moved."
              )}
            </p>
            <p className="bg-white px-5 py-4 text-[14px] text-mute dark:bg-dark-card dark:text-dark-mute sm:px-7">
              {moved > 0 ? (
                <>
                  <span className="font-semibold text-accent dark:text-accent-dark">{usd(paid)}</span> paid · <span className="font-semibold text-warn dark:text-[#FEC84B]">{usd(held)}</span> held for you ·{" "}
                  <span className="font-semibold text-bad dark:text-[#FDA29B]">{usd(blocked)}</span> blocked
                </>
              ) : (
                "Nothing has moved."
              )}
            </p>
          </div>
        </div>
      </section>
    </Container>
  );
}
