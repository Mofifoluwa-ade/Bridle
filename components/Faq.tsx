import { Container, Eyebrow } from "./Container";

const REPO = "https://github.com/Mofifoluwa-ade/Bridle";
const issue = (title: string, body: string) =>
  `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

const faqs = [
  {
    q: "Why does the agent not hold a key?",
    a: "An agent with a key is one prompt injection away from an empty wallet. With Bridle the agent sends four fields: chain, asset, amount and recipient. The contract checks them against the mandate you signed, builds the transaction itself and asks for the signature. Signing for Base and Solana is still being connected in this version.",
  },
  {
    q: "What can the agent actually do?",
    a: "Propose a payment. That is all. It cannot change the mandate, add a recipient or raise a limit. Anything outside the mandate is blocked, and the block names the rule.",
  },
  {
    q: "What happens when a payment is blocked?",
    a: "It is recorded with the rule that stopped it, and you can see it in the feed. Nothing moves.",
  },
  {
    q: "What if I am offline?",
    a: "Payments above your threshold wait out a challenge window. A payment a watcher flags never runs unless you dismiss the flag. If you say nothing, it expires and the funds stay put. The failure mode is a missed payment, never a lost one.",
  },
  {
    q: "What is a watcher, and why the bond?",
    a: "A watcher is anyone who can flag a large payment while it waits. Flagging costs a small bond, forfeited if you dismiss the flag, so spam costs money. If you confirm a flag, the agent's bond is slashed: 40% to the watcher, 30% to you, 30% burned. You can also veto any payment for free.",
  },
  {
    q: "Who pays gas on Base and Solana?",
    a: "Not settled in this version. Each derived address needs gas on its own chain. We are weighing an owner top-up against a relayer.",
  },
  {
    q: "What does Bridle not cover?",
    a: "A bad address on your own allowlist, a contract bug, and failure of the Chain Signatures network, which Bridle does not remove trust in. The contract has not been audited, so use test funds only.",
  },
  {
    q: "Is it live?",
    a: "On NEAR testnet, version 0.1, with test tokens only. You can write a rule, test payments against it and watch the policy decide.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <Container className="pb-10 pt-16 sm:pt-[104px]">
      <section id="questions" aria-labelledby="questions-title">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Eyebrow>Questions</Eyebrow>
        <h2
          id="questions-title"
          className="max-w-[720px] text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white"
        >
          Asked often. Answered plainly.
        </h2>

        <div className="mt-10 sm:mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="divide-y divide-line dark:divide-dark-border rounded-[20px] border border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-sm transition-colors">
            {faqs.map((f) => (
              <details key={f.q} className="group px-5 sm:px-7 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-[16px] sm:text-[17px] font-semibold tracking-[-0.015em] text-ink dark:text-white">
                  {f.q}
                  <span
                    aria-hidden
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line dark:border-dark-border text-mute dark:text-dark-mute transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-6 pr-10 text-[14.5px] sm:text-base leading-[1.65] text-mute dark:text-dark-mute">{f.a}</p>
              </details>
            ))}
          </div>

          <aside className="rounded-[20px] border border-line dark:border-dark-border bg-paper dark:bg-dark-card p-5 sm:p-7 transition-colors">
            <h3 className="text-lg sm:text-xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
              Ask a question or send feedback
            </h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-mute dark:text-dark-mute">
              Something unclear, or something we got wrong? Tell us. Questions that come up more than once land in the list on the left.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <a
                href={issue("Question: ", "What would you like to know?\n\n")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink px-5 text-[15px] font-semibold text-white shadow-sm transition-opacity hover:opacity-85 dark:bg-white dark:text-ink"
              >
                Ask a question
              </a>
              <a
                href={issue("Feedback: ", "What worked, what did not, and what is missing?\n\n")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-rule px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-white dark:border-dark-border dark:text-white dark:hover:bg-white/10"
              >
                Send feedback
              </a>
            </div>
            <p className="mt-4 text-xs text-mute dark:text-dark-mute">Opens a public GitHub issue, so it needs a GitHub account.</p>
          </aside>
        </div>
      </section>
    </Container>
  );
}
