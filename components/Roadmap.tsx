import Link from "next/link";
import { Container, Eyebrow } from "./Container";

type Stage = {
  tag: string;
  title: string;
  state: "live" | "next" | "later";
  items: string[];
};

const stages: Stage[] = [
  {
    tag: "Now",
    title: "Live on testnet",
    state: "live",
    items: [
      "Spending rules enforced by a NEAR contract",
      "Native NEAR and USDC on Base Sepolia",
      "Payment-request links and one-click Pay",
      "bridle-mcp for agents",
    ],
  },
  {
    tag: "Next",
    title: "Auditing",
    state: "next",
    items: [
      "Contract audit, done by the author in the open",
      "Findings and fixes published in the docs",
      "A separate executor account",
      "On-chain payment requests",
    ],
  },
  {
    tag: "Then",
    title: "Mainnet",
    state: "next",
    items: [
      "Launch on NEAR mainnet once the audit is done",
      "Real assets, with limits kept small at first",
    ],
  },
  {
    tag: "Later",
    title: "More chains",
    state: "later",
    items: [
      "Solana signing",
      "More chains and assets behind the same rule",
    ],
  },
];

const dot: Record<Stage["state"], string> = {
  live: "bg-accent dark:bg-accent-dark border-accent dark:border-accent-dark",
  next: "bg-white dark:bg-dark-card border-accent dark:border-accent-dark",
  later: "bg-white dark:bg-dark-card border-line dark:border-dark-border",
};

export function Roadmap() {
  return (
    <Container className="pb-20 pt-16 sm:pb-28 sm:pt-24">
      <section id="roadmap" aria-labelledby="roadmap-title">
        <Eyebrow>Roadmap</Eyebrow>
        <h2 id="roadmap-title" className="max-w-[680px] text-[clamp(29px,4.4vw,50px)] font-semibold leading-[1.06] tracking-display text-ink dark:text-white">
          Where Bridle is going.
        </h2>
        <p className="mt-4 max-w-[560px] text-[16px] leading-[1.65] text-mute dark:text-dark-mute">
          These are plans, in order, without dates. What works today and what it still trusts are written out in the{" "}
          <Link href="/docs#status" className="text-accent underline underline-offset-4 dark:text-accent-dark">docs</Link>.
        </p>

        <ol className="relative mt-12 grid gap-5 sm:mt-16 md:grid-cols-4">
          <span aria-hidden className="absolute left-[11px] top-3 bottom-3 w-px bg-line dark:bg-dark-border md:left-3 md:right-3 md:top-[11px] md:h-px md:w-auto md:bottom-auto" />
          {stages.map((s, i) => (
            <li key={s.title} data-reveal-item style={{ "--i": i } as React.CSSProperties} className="relative pl-9 md:pl-0 md:pt-9">
              <span aria-hidden className={`absolute left-0 top-1 h-[23px] w-[23px] rounded-full border-2 md:top-0 ${dot[s.state]}`} />
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">{s.tag}</p>
              <h3 className="mt-1.5 text-[19px] font-semibold tracking-heading text-ink dark:text-white">{s.title}</h3>
              <ul className="mt-3 space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="text-[14px] leading-[1.55] text-mute dark:text-dark-mute">{it}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
