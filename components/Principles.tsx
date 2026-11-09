import type { ReactNode } from "react";
import { Container, Eyebrow } from "./Container";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const principles: { number: string; title: string; body: string; icon: ReactNode }[] = [
  {
    number: "01",
    title: "Policy before payment",
    body: "Every proposal is checked by the NEAR contract against the mandate — not by an agent prompt or a dashboard-side rule.",
    icon: <Icon><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" /><path d="M8.5 12l2.2 2.2 4.8-5" /></Icon>,
  },
  {
    number: "02",
    title: "Authority stays bounded",
    body: "The agent's function-call key is restricted to proposing payments. It cannot edit the mandate or move funds directly.",
    icon: <Icon><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3" /></Icon>,
  },
  {
    number: "03",
    title: "Tighten immediately",
    body: "Owners can reduce limits or revoke access at once. Looser limits and expanded permissions wait through a challenge window.",
    icon: <Icon><path d="M12 3v18M5 10l7-7 7 7" /><path d="M5 21h14" /></Icon>,
  },
  {
    number: "04",
    title: "Keep a human veto",
    body: "Threshold payments can wait for review. Watchers can flag suspicious proposals, and the owner keeps the final say.",
    icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></Icon>,
  },
];

export function Principles() {
  return (
    <section className="bg-ink text-[#F3F4F6]">
      <Container className="py-16 sm:py-24">
        <div id="principles" aria-labelledby="principles-title">
          <Eyebrow tone="dark">Design principles</Eyebrow>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h2 id="principles-title" className="max-w-[650px] text-[clamp(30px,4.3vw,48px)] font-semibold leading-[1.07] tracking-heading text-white">
              Autonomy, without handing over the keys.
            </h2>
            <p className="max-w-[330px] text-sm leading-[1.7] text-[#A3ABB8]">
              The agent can ask. The mandate decides what is allowed.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((p) => (
              <article key={p.number} className="border-t border-white/15 pt-5">
                <div className="flex items-center justify-between text-[#46D9A4]">
                  <span className="font-mono text-[11px]">{p.number}</span>
                  {p.icon}
                </div>
                <h3 className="mt-6 text-[18px] font-semibold tracking-[-0.02em] text-white">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#A3ABB8]">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
