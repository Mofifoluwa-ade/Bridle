import { Container, Eyebrow } from "./Container";

const works = [
  "A NEAR contract that enforces recipients, caps, review thresholds and a veto.",
  "Native NEAR payments from a balance the owner funds and can take back.",
  "USDC on Base Sepolia through NEAR Chain Signatures, verified end to end.",
  "bridle-mcp on npm: read-only without a key, proposals with a restricted one.",
];
const notYet = [
  "Solana signing. It is planned, not built.",
  "Mainnet. Everything runs on testnets with test assets.",
  "An audit. The contract has not been audited.",
  "Removing every trust assumption. You still trust the NEAR signing network and the executor that broadcasts.",
];

export function HonestEdges() {
  return (
    <Container className="pb-20 pt-16 sm:pb-28 sm:pt-24">
      <section id="honest-edges" aria-labelledby="edges-title">
        <Eyebrow>Honest edges</Eyebrow>
        <h2 id="edges-title" className="max-w-[680px] text-[clamp(29px,4.4vw,50px)] font-semibold leading-[1.06] tracking-display text-ink dark:text-white">
          What works today, and what does not.
        </h2>
        <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2">
          <div data-reveal-item style={{ "--i": 0 } as React.CSSProperties} className="rounded-[22px] border border-accent/25 bg-white p-6 dark:border-accent-dark/25 dark:bg-dark-card sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">Works today</p>
            <ul className="mt-5 space-y-4">
              {works.map((w) => (
                <li key={w} className="flex gap-3 text-[15px] leading-[1.6] text-ink dark:text-white">
                  <span aria-hidden className="mt-0.5 text-accent dark:text-accent-dark">✓</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal-item style={{ "--i": 1 } as React.CSSProperties} className="rounded-[22px] border border-line bg-white p-6 dark:border-dark-border dark:bg-dark-card sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">Not yet, or not claimed</p>
            <ul className="mt-5 space-y-4">
              {notYet.map((w) => (
                <li key={w} className="flex gap-3 text-[15px] leading-[1.6] text-mute dark:text-dark-mute">
                  <span aria-hidden className="mt-0.5">–</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Container>
  );
}
