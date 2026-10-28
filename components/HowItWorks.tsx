import { Container, Eyebrow } from "./Container";

const steps = [
  {
    n: "01",
    title: "You write the mandate",
    body: "Set a daily cap, a list of recipients and a pause threshold, in one sentence. You sign it once.",
  },
  {
    n: "02",
    title: "The agent proposes",
    body: "It sends four fields: chain, asset, amount and recipient. That is the only thing it can do.",
  },
  {
    n: "03",
    title: "The contract decides",
    body: "Allowed payments are signed. Anything else is refused, and large ones wait for your veto.",
  },
];

export function HowItWorks() {
  return (
    <Container className="pb-16 sm:pb-28 pt-14 sm:pt-24">
      <section id="how" aria-labelledby="how-title">
        <Eyebrow>How it works</Eyebrow>
        <h2
          id="how-title"
          className="max-w-[720px] text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white"
        >
          One mandate. Four fields. No keys.
        </h2>
        <ol className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-rule dark:border-dark-border pt-6 min-w-0">
              <span className="font-mono text-[13px] text-mute dark:text-dark-mute">{s.n}</span>
              <h3 className="mb-2.5 mt-3.5 text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
                {s.title}
              </h3>
              <p className="text-[15px] sm:text-base leading-[1.65] text-mute dark:text-dark-mute">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
