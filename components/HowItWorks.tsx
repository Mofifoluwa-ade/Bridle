import Link from "next/link";
import { Container, Eyebrow } from "./Container";

const steps = [
  {
    n: "01",
    title: "You set the mandate",
    body: "Choose a supported network and asset, approve recipients, and set per-payment, daily and review limits. You sign the rules on NEAR.",
    note: "Owner-defined authority",
  },
  {
    n: "02",
    title: "Your agent proposes",
    body: "The agent submits a payment request through MCP using a restricted function-call key. It cannot add recipients, raise limits or change the mandate.",
    note: "A narrow proposal interface",
  },
  {
    n: "03",
    title: "Bridle checks and executes",
    body: "The contract clears, holds or blocks the request. NEAR payments use the mandate's funded balance; Base USDC uses NEAR Chain Signatures and an executor.",
    note: "Policy enforced on-chain",
  },
];

export function HowItWorks() {
  return (
    <Container className="pb-20 sm:pb-28 pt-14 sm:pt-24">
      <section id="how" aria-labelledby="how-title">
        <Eyebrow>How it works</Eyebrow>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="how-title" className="max-w-[700px] text-[clamp(29px,4.2vw,48px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white">
            A boundary the agent cannot negotiate.
          </h2>
          <p className="max-w-[310px] text-sm leading-relaxed text-mute dark:text-dark-mute">
            One policy layer. Different execution paths for each supported network.
          </p>
        </div>
        <ol className="mt-10 sm:mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="group rounded-[20px] border border-line bg-white p-6 sm:p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-dark-border dark:bg-dark-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-mute dark:text-dark-mute">{step.n}</span>
                <span className="h-px w-12 bg-rule transition-all group-hover:w-20 dark:bg-dark-border" />
              </div>
              <h3 className="mt-8 text-xl sm:text-[22px] font-semibold tracking-[-0.025em] text-ink dark:text-white">{step.title}</h3>
              <p className="mt-3 text-[14px] sm:text-[15px] leading-[1.7] text-mute dark:text-dark-mute">{step.body}</p>
              <p className="mt-7 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.11em] text-accent dark:border-dark-border dark:text-accent-dark">{step.note}</p>
            </li>
          ))}
        </ol>
        <Link href="/how-it-works" className="mt-9 inline-flex items-center gap-2 text-[14px] font-semibold text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border">
          Explore the full payment lifecycle <span aria-hidden>↗</span>
        </Link>
      </section>
    </Container>
  );
}
