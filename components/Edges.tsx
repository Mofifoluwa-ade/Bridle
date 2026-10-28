import { Container, Eyebrow } from "./Container";

const edges = [
  {
    title: "Transfers only",
    body: "No arbitrary contract calls yet. Every payment is a plain stablecoin transfer.",
  },
  {
    title: "Stablecoin limits",
    body: "Caps are set in stablecoin amounts, so there is no price oracle to trust.",
  },
  {
    title: "A shared trust assumption",
    body: "Signing relies on the Chain Signatures network, and Bridle does not remove that trust.",
  },
];

export function Edges() {
  return (
    <Container className="pb-10 pt-16 sm:pt-[104px]">
      <section id="edges" aria-labelledby="edges-title">
        <Eyebrow>Honest edges</Eyebrow>
        <h2
          id="edges-title"
          className="max-w-[720px] text-[clamp(28px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white"
        >
          Clear about what version one doesn&apos;t do.
        </h2>
        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {edges.map((e) => (
            <div
              key={e.title}
              className="rounded-[20px] border border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 sm:p-7 shadow-sm transition-colors min-w-0"
            >
              <h3 className="mb-2 text-lg sm:text-xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
                {e.title}
              </h3>
              <p className="text-[14.5px] sm:text-base leading-[1.65] text-mute dark:text-dark-mute">{e.body}</p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
