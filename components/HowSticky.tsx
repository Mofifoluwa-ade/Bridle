"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChainLogo } from "./ChainLogo";
import { Container, Eyebrow } from "./Container";

const steps = [
  {
    n: "01",
    title: "You set the mandate",
    body: "Choose a network and an asset, approve recipients, and set per-payment, daily and review limits. Set them as low or as high as you like. You sign the rules once, on NEAR.",
    note: "Owner-defined authority",
  },
  {
    n: "02",
    title: "Your agent proposes",
    body: "The agent submits a payment request through MCP with a restricted function-call key. It cannot add recipients, raise limits or change the mandate.",
    note: "A narrow proposal interface",
  },
  {
    n: "03",
    title: "The contract decides",
    body: "It clears, holds or blocks each request. NEAR payments come from the mandate's funded balance; Base USDC goes through NEAR Chain Signatures and an executor.",
    note: "Policy enforced on-chain",
  },
];

const panel =
  "w-full max-w-[460px] rounded-[24px] border border-line bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-card sm:p-7";
const label = "font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute";

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-3 first:border-t-0 dark:border-dark-border">
      <span className="text-[13px] text-mute dark:text-dark-mute">{k}</span>
      <span className="text-right font-mono text-[13px] text-ink dark:text-white">{v}</span>
    </div>
  );
}

const presets = [
  { name: "Personal", day: "$50", each: "$25", review: "$20", who: "three" },
  { name: "Team", day: "$2,000", each: "$500", review: "$250", who: "ten" },
  { name: "Treasury", day: "$50,000", each: "$10,000", review: "$5,000", who: "twenty" },
];

function Visual({ i }: { i: number }) {
  const [pi, setPi] = useState(0);
  const pr = presets[pi];
  if (i === 0)
    return (
      <div className={panel}>
        <div className="flex items-center justify-between">
          <span className={label}>Example rule</span>
          <span className="rounded-full bg-[#E7F2EE] px-2.5 py-1 font-mono text-[10px] font-medium text-[#0A7C59] dark:bg-accent-tint dark:text-[#46D9A4]">Active</span>
        </div>
        <div role="group" aria-label="Example rules" className="mt-4 inline-flex rounded-full border border-line p-1 dark:border-dark-border">
          {presets.map((p, k) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setPi(k)}
              aria-pressed={pi === k}
              className={`min-h-[32px] rounded-full px-3.5 text-[12.5px] font-medium transition-colors ${
                pi === k ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-mute hover:text-ink dark:text-dark-mute dark:hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[20px] font-medium leading-[1.3] tracking-[-0.02em] text-ink dark:text-white">
          Up to {pr.day} a day, to {pr.who} approved recipients.
        </p>
        <div className="mt-4">
          <Row k="Network" v={<span className="inline-flex items-center gap-2"><ChainLogo chain="base" size={16} label={false} />Base</span>} />
          <Row k="Per payment" v={`up to ${pr.each}`} />
          <Row k="Per day" v={pr.day} />
          <Row k="Review above" v={pr.review} />
        </div>
        <p className="mt-3 text-[12px] leading-[1.5] text-mute dark:text-dark-mute">You choose every number. These are examples.</p>
        <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-accent dark:text-accent-dark">
          <span aria-hidden>✓</span> Signed on NEAR
        </p>
      </div>
    );
  if (i === 1)
    return (
      <div className={panel}>
        <span className={label}>Agent · proposal</span>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-[12.5px] leading-[1.7] text-[#C5CBD4]">
{`propose_payment({
  chain: "Base",
  amount: "18.00",
  recipient: "0x71C…b87"
})`}
        </pre>
        <ul className="mt-4 space-y-2 text-[13px]">
          <li className="flex gap-2.5 text-ink dark:text-white"><span aria-hidden className="text-accent dark:text-accent-dark">✓</span>Can propose a payment</li>
          <li className="flex gap-2.5 text-mute dark:text-dark-mute"><span aria-hidden>✕</span>Cannot change the mandate</li>
          <li className="flex gap-2.5 text-mute dark:text-dark-mute"><span aria-hidden>✕</span>Cannot move funds directly</li>
        </ul>
      </div>
    );
  return (
    <div className={panel}>
      <span className={label}>Contract · decisions</span>
      <div className="mt-4 space-y-3">
        {[
          { amt: "$18.00", to: "0x71C…b87", tag: "Approved", why: "Within every limit", tone: "bg-[#E7F2EE] text-[#0A7C59] dark:bg-accent-tint dark:text-[#46D9A4]" },
          { amt: "$18.00", to: "0xF3a…009", tag: "Blocked", why: "Recipient not on the list", tone: "bg-[#FDECEA] text-[#B42318] dark:bg-bad-tint/15 dark:text-bad" },
          { amt: "$32.00", to: "0x71C…b87", tag: "Waiting", why: "Above the $20 threshold. Waiting for your veto.", tone: "bg-[#FEF3E2] text-[#B54708] dark:bg-warn-tint/15 dark:text-warn" },
        ].map((d) => (
          <div key={d.amt + d.tag} className="rounded-xl border border-line p-3.5 dark:border-dark-border">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[13px] text-ink dark:text-white">{d.amt} <span className="text-mute dark:text-dark-mute">→ {d.to}</span></span>
              <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium ${d.tone}`}>{d.tag}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-mute dark:text-dark-mute">{d.why}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The three steps, with the text pinned on the left and the picture changing as you scroll.
 * Below the large breakpoint it is a plain stack, so nothing depends on sticky positioning.
 */
export function HowSticky() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((n) => n && io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <Container className="pb-12 pt-10 sm:pb-20 sm:pt-16">
      <section id="how" aria-labelledby="how-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:h-fit lg:self-start">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how-title" className="max-w-[560px] text-[clamp(30px,4.6vw,54px)] font-semibold leading-[1.05] tracking-display text-ink dark:text-white">
              A boundary the agent cannot negotiate.
            </h2>
            <p className="mt-5 max-w-[460px] text-[16px] leading-[1.7] text-mute dark:text-dark-mute">
              One policy layer. A different route to each network.
            </p>
            <ol className="mt-9 hidden space-y-1 lg:block">
              {steps.map((s, i) => (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className={`group flex w-full gap-5 rounded-2xl p-4 text-left transition-all duration-500 ${
                      active === i ? "bg-white shadow-sm dark:bg-dark-card" : "opacity-45 hover:opacity-80"
                    }`}
                  >
                    <span className={`pt-1 font-mono text-xs ${active === i ? "text-accent dark:text-accent-dark" : "text-mute dark:text-dark-mute"}`}>{s.n}</span>
                    <span>
                      <span className="block text-[19px] font-semibold tracking-[-0.02em] text-ink dark:text-white">{s.title}</span>
                      <span
                        className="grid transition-all duration-500"
                        style={{ gridTemplateRows: active === i ? "1fr" : "0fr", opacity: active === i ? 1 : 0 }}
                      >
                        <span className="overflow-hidden">
                          <span className="mt-2 block text-[14.5px] leading-[1.7] text-mute dark:text-dark-mute">{s.body}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <Link href="/how-it-works" className="mt-9 hidden items-center gap-2 text-[14px] font-semibold text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border lg:inline-flex">
              Explore the full payment lifecycle <span aria-hidden>↗</span>
            </Link>
          </div>

          <div className="space-y-6 lg:space-y-0">
            {steps.map((s, i) => (
              <div
                key={s.n}
                ref={(n) => {
                  refs.current[i] = n;
                }}
                data-i={i}
                className="flex flex-col items-start gap-5 lg:min-h-[78vh] lg:justify-center"
              >
                <div className="lg:hidden">
                  <span className="font-mono text-xs text-accent dark:text-accent-dark">{s.n}</span>
                  <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.7] text-mute dark:text-dark-mute">{s.body}</p>
                </div>
                <div
                  className="w-full transition-all duration-700 ease-out lg:[transform:var(--t)] lg:[opacity:var(--o)] lg:[filter:var(--f)]"
                  style={
                    {
                      "--o": active === i ? 1 : 0.35,
                      "--t": active === i ? "scale(1)" : "scale(.96)",
                      "--f": active === i ? "none" : "blur(1.5px)",
                    } as React.CSSProperties
                  }
                >
                  <Visual i={i} />
                </div>
              </div>
            ))}
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border lg:hidden">
              Explore the full payment lifecycle <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
