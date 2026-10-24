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
    title: "No key to steal",
    body: "The agent never holds a key. Signing authority lives in a contract that follows only your mandate.",
    icon: (
      <Icon>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l9-9M17 6l3 3M4 4l16 16" />
      </Icon>
    ),
  },
  {
    title: "The contract builds every transaction",
    body: "The agent cannot slip in extra instructions, because it never writes the transaction itself.",
    icon: (
      <Icon>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
      </Icon>
    ),
  },
  {
    title: "You keep the veto",
    body: "Large payments wait. A watcher can flag them, and nothing flagged moves unless you say so.",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9v6M14 9v6" />
      </Icon>
    ),
  },
  {
    title: "Anyone can execute",
    body: "Once a payment is approved, anyone can send it. Nothing depends on one operator staying online.",
    icon: (
      <Icon>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </Icon>
    ),
  },
];

export function Principles() {
  return (
    <div className="bg-ink text-[#F3F4F6]">
      <Container className="pb-28 pt-[104px]">
        <section id="principles" aria-labelledby="principles-title">
          <Eyebrow tone="dark">Principles</Eyebrow>
          <h2
            id="principles-title"
            className="max-w-[720px] text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-white"
          >
            Built so the agent can&apos;t talk its way out.
          </h2>
          <div className="mt-[72px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-x-16 gap-y-14">
            {principles.map((p) => (
              <div key={p.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-night text-[#F3F4F6]">
                  {p.icon}
                </div>
                <h3 className="mb-2.5 mt-[22px] text-[22px] font-semibold tracking-[-0.02em] text-white">
                  {p.title}
                </h3>
                <p className="text-base leading-[1.65] text-dim">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
