import type { ReactNode } from "react";
import { Container, Eyebrow } from "./Container";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const principles: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "No key that can spend",
    body: "The agent uses a restricted function-call key to submit proposals. It cannot transfer funds or rewrite the mandate.",
    icon: (
      <Icon>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l9-9M17 6l3 3M4 4l16 16" />
      </Icon>
    ),
  },
  {
    title: "Rules live on-chain",
    body: "Every proposal is checked against the mandate by the contract — not by a prompt, a dashboard or the agent itself.",
    icon: (
      <Icon>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
      </Icon>
    ),
  },
  {
    title: "You keep the veto",
    body: "Payments over your threshold wait. Watchers can flag a proposal, and you keep the final say.",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9v6M14 9v6" />
      </Icon>
    ),
  },
  {
    title: "Execution stays open",
    body: "Once a proposal is ready, execution does not depend on one operator staying online.",
    icon: (
      <Icon>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </Icon>
    ),
  },
];

export function Principles() {
  return (
    <section className="relative overflow-hidden bg-ink text-[#F3F4F6]">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/[0.06]" />
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full border border-white/[0.06]" />
      <Container className="relative pb-20 sm:pb-28 pt-16 sm:pt-24">
        <section id="principles" aria-labelledby="principles-title">
          <Eyebrow tone="dark">The design principle</Eyebrow>
          <h2
            id="principles-title"
            className="max-w-[760px] text-[clamp(30px,4.5vw,50px)] font-semibold leading-[1.06] tracking-heading text-white"
          >
            Give the agent a job.
            <br />
            Keep the authority somewhere else.
          </h2>
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-9">
            {principles.map((p) => (
              <div key={p.title} className="group flex flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2A313C] text-[#46D9A4] transition-all duration-300 group-hover:border-[#46D9A4]/50 group-hover:bg-[#46D9A4]/[0.08]">
                  {p.icon}
                </div>
                <h3 className="mb-2 mt-5 text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-white leading-snug">
                  {p.title}
                </h3>
                <p className="text-[13.5px] sm:text-[14px] leading-[1.7] text-[#A3ABB8]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </section>
  );
}
