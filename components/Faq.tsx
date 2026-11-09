import { Container, Eyebrow } from "./Container";

const EMAIL = "usebridle@gmail.com";
const mail = (subject: string, body: string) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const faqs = [
  {
    q: "What can an agent's key do?",
    a: "The MCP server uses a restricted NEAR function-call key to submit propose_payment calls. It cannot transfer funds, change a mandate or withdraw a balance. Read-only tools and payment checks work without that key.",
  },
  {
    q: "Which networks and assets are supported?",
    a: "NEAR-native payments are made from a balance funded by the mandate owner. Base USDC transfers have been verified on Base Sepolia through NEAR Chain Signatures and the executor. Solana support is planned, not implemented. NEAR-native mandates are NEAR-only so their spending limits stay denominated in NEAR.",
  },
  {
    q: "What happens when a payment is outside the rules?",
    a: "The contract blocks the proposal and records the rule that stopped it. The owner can inspect the attempt in the app. A blocked proposal is not a payment, and the agent should not retry it with a different recipient or amount.",
  },
  {
    q: "What happens when a payment needs review?",
    a: "A proposal above the mandate's threshold waits through its challenge window. A watcher can flag it and the owner can veto it. A flagged proposal does not execute unless the owner dismisses the flag.",
  },
  {
    q: "How do I connect an agent?",
    a: "Install bridle-mcp with npx in an MCP-compatible client. Node.js 22.22.2 or newer is required. The server is read-only without agent credentials; proposing requires a function-call key restricted to propose_payment. The full configuration is on the MCP setup page.",
  },
  {
    q: "Is Bridle handling real funds?",
    a: "No. The current deployment targets NEAR testnet and Base Sepolia. Use test assets only. The contracts and execution flow have not been presented as audited production infrastructure.",
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
    <Container className="pb-12 pt-16 sm:pt-24">
      <section id="questions" aria-labelledby="questions-title">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Eyebrow>FAQ</Eyebrow>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="questions-title" className="max-w-[650px] text-[clamp(29px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white">
            Clear answers. No security theatre.
          </h2>
          <a href={mail("Bridle question", "What would you like to know?\n\n")} className="text-sm font-semibold text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border">
            Ask us a question ↗
          </a>
        </div>
        <div className="mt-9 divide-y divide-line rounded-[20px] border border-line bg-white shadow-sm dark:divide-dark-border dark:border-dark-border dark:bg-dark-card">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 sm:px-7 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-[15px] sm:text-[16px] font-semibold tracking-[-0.015em] text-ink dark:text-white">
                {f.q}
                <span aria-hidden className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-line text-mute transition-transform group-open:rotate-45 dark:border-dark-border dark:text-dark-mute">+</span>
              </summary>
              <p className="max-w-[820px] pb-6 pr-8 text-[14px] sm:text-[15px] leading-[1.7] text-mute dark:text-dark-mute">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
