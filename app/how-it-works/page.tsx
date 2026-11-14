import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import Link from "next/link";
import { Container, Eyebrow, PrimaryButton } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = ogMeta({
  kind: "How it works",
  title: "One rule. Four fields. No keys.",
  sub: "How an owner-signed mandate bounds what an AI agent can spend.",
  description: "One mandate, four fields, no keys. How an owner-signed mandate bounds what an AI agent can spend, and what happens to every payment it proposes.",
});

const steps = [
  {
    n: "01",
    title: "You write the mandate",
    body: "A mandate is the rulebook for one agent. You set a per-payment cap, a daily cap, the chains and assets allowed, the recipients it may pay, a pause threshold for larger payments, and an expiry. You can write it as a sentence and sign it once. Raising a limit later waits out a delay, so a hijacked session cannot loosen it instantly.",
  },
  {
    n: "02",
    title: "The agent proposes",
    body: "The agent never holds a spend key. It sends four fields: chain, asset, amount and recipient. That is the only action it has. It cannot edit the mandate, add a recipient or sign anything itself.",
  },
  {
    n: "03",
    title: "The contract decides",
    body: "The contract checks the proposal against the mandate in a fixed order. A payment that passes is queued for signing. One that breaks a rule is refused, with the rule named. One over your pause threshold waits through a challenge window.",
  },
];

const outcomes = [
  { tag: "Ready", text: "Within every limit and under the pause threshold. Queued for signing." },
  { tag: "Waiting", text: "Over the pause threshold. Held for the challenge window while you or a watcher can step in." },
  { tag: "Flagged", text: "A watcher put up a bond to challenge it. It stops until you decide." },
  { tag: "Vetoed", text: "You said no. It never executes." },
  { tag: "Rejected", text: "Broke a rule: wrong chain or asset, recipient not approved, over a cap, or the mandate is revoked or expired." },
];

const checks = [
  "Mandate is not revoked or expired",
  "Agent bond is posted",
  "Chain is allowed",
  "Asset is allowed",
  "Recipient is on the approved list",
  "Amount is above zero",
  "Amount is within the per-payment cap",
  "Amount fits what is left of today's cap",
];

export default function HowItWorksPage() {
  return (
    <main>
      <Nav />
      <Container className="pt-14 sm:pt-24 pb-16 sm:pb-28">
        <Eyebrow>How it works</Eyebrow>
        <h1 className="max-w-[760px] text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] tracking-heading text-ink dark:text-white">
          One mandate. Four fields. No keys.
        </h1>
        <p className="mt-5 max-w-[640px] text-base sm:text-lg leading-[1.65] text-mute dark:text-dark-mute">
          Bridle lets an AI agent spend without holding a key. You set the limits, the agent proposes payments, and a
          contract on NEAR decides each one against your rules.
        </p>

        <ol className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-rule dark:border-dark-border pt-6 min-w-0">
              <span className="font-mono text-[13px] text-mute dark:text-dark-mute">{s.n}</span>
              <h2 className="mb-2.5 mt-3.5 text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
                {s.title}
              </h2>
              <p className="text-[15px] sm:text-base leading-[1.65] text-mute dark:text-dark-mute">{s.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-16 sm:mt-24" aria-labelledby="checks-title">
          <Eyebrow>What the contract checks</Eyebrow>
          <h2
            id="checks-title"
            className="max-w-[720px] text-[clamp(24px,3.4vw,38px)] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white"
          >
            Eight checks, always in this order
          </h2>
          <ol className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {checks.map((c, i) => (
              <li
                key={c}
                className="flex gap-3 border-t border-rule dark:border-dark-border pt-3 text-[15px] text-ink dark:text-white"
              >
                <span className="font-mono text-[13px] text-mute dark:text-dark-mute">{String(i + 1).padStart(2, "0")}</span>
                {c}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 sm:mt-24" aria-labelledby="outcomes-title">
          <Eyebrow>What happens to a payment</Eyebrow>
          <h2
            id="outcomes-title"
            className="max-w-[720px] text-[clamp(24px,3.4vw,38px)] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white"
          >
            Every proposal ends one of five ways
          </h2>
          <ul className="mt-8 divide-y divide-rule dark:divide-dark-border border-y border-rule dark:border-dark-border">
            {outcomes.map((o) => (
              <li key={o.tag} className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
                <span className="font-mono text-[13px] uppercase tracking-label text-ink dark:text-white">{o.tag}</span>
                <span className="text-[15px] leading-[1.6] text-mute dark:text-dark-mute">{o.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[640px] text-[15px] leading-[1.65] text-mute dark:text-dark-mute">
            Today Bridle runs on NEAR testnet. A ready payment is marked for signing; connecting cross-chain signing for
            Base and Solana is still in progress, and nothing here moves real funds yet.
          </p>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-5">
          <PrimaryButton href="/app">Write a mandate</PrimaryButton>
          <Link
            href="/docs"
            className="text-[15px] font-medium text-ink dark:text-white underline underline-offset-4 decoration-rule dark:decoration-dark-border hover:decoration-current"
          >
            Read the docs
          </Link>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
