import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import { BreakDemo } from "@/components/BreakDemo";
import { Container, Eyebrow } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = ogMeta({
  kind: "Live on testnet",
  title: "Break the Bridle",
  sub: "Play a rogue agent. Try to overspend, pay a stranger or switch chains.",
  description: "Play a rogue AI agent against a real Bridle spending rule on testnet. Try to overspend, pay a stranger or switch chains, and watch the contract refuse.",
});

export default function BreakPage() {
  return (
    <>
      <Nav />
      <main>
        <Container className="pb-24 pt-12 sm:pt-20">
          <Eyebrow>Live on testnet</Eyebrow>
          <h1 className="max-w-3xl text-[36px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">Try to break the Bridle.</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-mute dark:text-dark-mute">
            Below is a real spending rule on the Bridle contract. You are the agent, and you are trying to get a payment through that the rule should never allow. Every attempt goes to the contract, and every answer, with the rule that decided it, is shown here and recorded on-chain.
          </p>
          <div className="mt-10">
            <BreakDemo />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
