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
    <Container className="pb-28 pt-24">
      <section id="how" aria-labelledby="how-title">
        <Eyebrow>How it works</Eyebrow>
        <h2
          id="how-title"
          className="max-w-[720px] text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading"
        >
          One mandate. Four fields. No keys.
        </h2>
        <ol className="mt-16 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-rule pt-6">
              <span className="font-mono text-[13px] text-mute">{s.n}</span>
              <h3 className="mb-2.5 mt-3.5 text-2xl font-semibold tracking-[-0.02em]">
                {s.title}
              </h3>
              <p className="text-base leading-[1.65] text-mute">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}
