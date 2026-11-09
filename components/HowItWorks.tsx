import Link from "next/link";
import { Container, Eyebrow } from "./Container";

const steps = [
  {
    n: "01",
    title: "You define the boundary",
    body: "Choose the chains, assets and recipients an agent may use. Set per-payment and daily caps, plus a threshold for extra review. Then sign the mandate.",
  },
  {
    n: "02",
    title: "The agent makes a request",
    body: "The agent submits four fields: chain, asset, amount and recipient. Its restricted function-call key can propose — it cannot transfer funds or change your rules.",
  },
  {
    n: "03",
    title: "The contract enforces it",
    body: "The NEAR contract checks the request against your mandate. It can clear, hold or reject the proposal, with the rule behind the decision.",
  },
];

export function HowItWorks() {
  return (
    <Container className="pb-20 sm:pb-28 pt-14 sm:pt-24">
      <section id="how" aria-labelledby="how-title">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2
              id="how-title"
              className="max-w-[720px] text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white"
            >
              One mandate. Four fields. Rules on-chain.
            </h2>
          </div>
          <Link
            href="/how-it-works"
            className="mb-1 text-[14px] font-medium text-ink dark:text-white underline underline-offset-4 decoration-rule dark:decoration-dark-border hover:decoration-current"
          >
            Explore the full flow ↗
          </Link>
        </div>
        <ol className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {steps.map((s) => (
            <li key={s.n} className="group relative min-w-0 overflow-hidden rounded-[22px] border border-line dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/[0.04] dark:hover:shadow-black/20">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px] tracking-[0.12em] text-accent dark:text-accent-dark">{s.n}</span>
                <span aria-hidden className="text-[22px] text-rule transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 dark:text-dark-border">↗</span>
              </div>
              <h3 className="mb-3 mt-9 text-xl sm:text-[22px] font-semibold tracking-[-0.025em] text-ink dark:text-white">
                {s.title}
              </h3>
              <p className="text-[14.5px] sm:text-[15px] leading-[1.7] text-mute dark:text-dark-mute">{s.body}</p>
              <div aria-hidden className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-500 group-hover:w-full dark:bg-accent-dark" />
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
