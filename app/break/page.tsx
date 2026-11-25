import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import { BreakDemo } from "@/components/BreakDemo";
import { Container, Eyebrow } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = ogMeta({
  kind: "Live on testnet",
  title: "Break the Bridle",
  sub: "Play an attacker. Trick the agent with prompt injection and watch the contract refuse.",
  description: "Try prompt injections and rogue payments against a Bridle spending rule on testnet. A scripted agent falls for the trick, then the rule decides.",
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
            Below is a Bridle spending rule. Write a prompt injection for a scripted agent, or craft a rogue payment by hand, and see what the rule does. When the live testnet sandbox is on, every decision comes from the contract; if it is off, a local copy of the rules answers and the page says so.
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
