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
    <Container className="pb-10 pt-[104px]">
      <section id="edges" aria-labelledby="edges-title">
        <Eyebrow>Honest edges</Eyebrow>
        <h2
          id="edges-title"
          className="max-w-[720px] text-[clamp(30px,4.2vw,46px)] font-semibold leading-[1.08] tracking-heading"
        >
          Clear about what version one doesn&apos;t do.
        </h2>
        <div className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {edges.map((e) => (
            <div
              key={e.title}
              className="rounded-[20px] border border-line bg-white p-7"
            >
              <h3 className="mb-2.5 text-xl font-semibold tracking-[-0.02em]">
                {e.title}
              </h3>
              <p className="text-base leading-[1.65] text-mute">{e.body}</p>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
