"use client";

import { useEffect, useRef, useState } from "react";
import { Container, Eyebrow } from "./Container";

const rows = [
  {
    topic: "Where the limit lives",
    without: "In a prompt the agent can be talked out of.",
    with: "In a contract you signed. The agent cannot edit it.",
  },
  {
    topic: "What the agent holds",
    without: "A private key to the funds.",
    with: "No key to the funds. It proposes; the contract decides.",
  },
  {
    topic: "When something goes wrong",
    without: "You find out after the money has moved.",
    with: "Over-limit payments are blocked. Large ones wait for your veto.",
  },
  {
    topic: "Stopping an agent",
    without: "Rotate keys and hope nothing is pending.",
    with: "Revoke with one signature. Pending payments are cancelled.",
  },
];

/** A before and after switch. It flips by itself once when scrolled into view, then it is yours. */
export function Compare() {
  const [on, setOn] = useState(false);
  const touched = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          timer = setTimeout(() => {
            if (!touched.current) setOn(true);
          }, 1400);
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const pick = (v: boolean) => {
    touched.current = true;
    setOn(v);
  };

  return (
    <Container className="pb-20 pt-6 sm:pb-28 sm:pt-12">
      <section id="compare" aria-labelledby="compare-title" ref={root}>
        <div className="mx-auto max-w-[880px] text-center">
          <Eyebrow>The difference</Eyebrow>
          <h2 id="compare-title" className="text-[clamp(30px,5vw,56px)] font-semibold leading-[1.05] tracking-display text-ink dark:text-white">
            Most agent wallets ask you to trust the agent. Bridle does not.
          </h2>
          <div role="group" aria-label="Compare" className="mx-auto mt-9 inline-flex rounded-full border border-line bg-white p-1 shadow-sm dark:border-dark-border dark:bg-dark-card">
            {[
              { v: false, label: "Without a mandate" },
              { v: true, label: "With Bridle" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={on === o.v}
                onClick={() => pick(o.v)}
                className={`min-h-[40px] rounded-full px-4 text-[13px] sm:px-5 sm:text-[14px] font-semibold transition-all duration-300 ${
                  on === o.v
                    ? "bg-ink text-white shadow-sm dark:bg-white dark:text-ink"
                    : "text-mute hover:text-ink dark:text-dark-mute dark:hover:text-white"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-[980px] gap-4 sm:mt-14 sm:grid-cols-2">
          {rows.map((r, i) => (
            <div
              key={r.topic}
              className={`relative overflow-hidden rounded-[20px] border p-6 transition-colors duration-500 sm:p-7 ${
                on
                  ? "border-accent/30 bg-white dark:border-accent-dark/25 dark:bg-dark-card"
                  : "border-line bg-white/60 dark:border-dark-border dark:bg-dark-card/60"
              }`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">{r.topic}</p>
              <div className="relative mt-4 min-h-[88px]">
                <p
                  aria-hidden={on}
                  className="absolute inset-0 text-[19px] sm:text-[21px] font-medium leading-[1.3] tracking-[-0.02em] text-mute transition-all duration-500 dark:text-dark-mute"
                  style={{ opacity: on ? 0 : 1, transform: on ? "translateY(-10px)" : "none", filter: on ? "blur(4px)" : "none", transitionDelay: `${i * 60}ms` }}
                >
                  {r.without}
                </p>
                <p
                  aria-hidden={!on}
                  className="absolute inset-0 text-[19px] sm:text-[21px] font-medium leading-[1.3] tracking-[-0.02em] text-ink transition-all duration-500 dark:text-white"
                  style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(10px)", filter: on ? "none" : "blur(4px)", transitionDelay: `${i * 60}ms` }}
                >
                  {r.with}
                </p>
              </div>
              <span
                aria-hidden
                className={`absolute right-5 top-5 h-2 w-2 rounded-full transition-colors duration-500 ${on ? "bg-accent dark:bg-accent-dark" : "bg-rule dark:bg-dark-border"}`}
              />
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
