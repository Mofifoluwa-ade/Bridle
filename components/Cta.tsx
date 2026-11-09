import Link from "next/link";
import { Container, PrimaryButton, SecondaryButton } from "./Container";
import { LogoMark } from "./Logo";

export function Cta() {
  return (
    <Container className="pb-20 sm:pb-32 pt-16 sm:pt-28">
      <section id="cta" aria-labelledby="cta-title" className="relative overflow-hidden rounded-[28px] border border-line dark:border-dark-border bg-white dark:bg-dark-card px-6 py-12 sm:px-12 sm:py-16 text-center shadow-sm">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-3xl dark:bg-accent-dark/[0.08]" />
        <div className="relative">
          <LogoMark size={42} strokeWidth={4} className="mx-auto text-accent dark:text-accent-dark" />
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">Your agent. Your rules.</p>
          <h2
            id="cta-title"
            className="mx-auto mt-4 max-w-[760px] text-[clamp(32px,5.4vw,62px)] font-semibold leading-[1.04] tracking-display text-ink dark:text-white"
          >
            Let it act.
            <br />
            Not outside the lines.
          </h2>
          <p className="mx-auto mt-5 max-w-[460px] text-[16px] sm:text-[18px] leading-[1.65] text-mute dark:text-dark-mute">
            Start with a mandate on NEAR testnet. Keep the limits yours from the first proposal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PrimaryButton href="/app" large>
              Create a mandate
            </PrimaryButton>
            <SecondaryButton href="/mcp">Set up MCP</SecondaryButton>
          </div>
          <Link href="/how-it-works" className="mt-6 inline-flex text-[13px] font-medium text-mute underline underline-offset-4 decoration-rule hover:text-ink dark:text-dark-mute dark:decoration-dark-border dark:hover:text-white">
            Read how Bridle works
          </Link>
        </div>
      </section>
    </Container>
  );
}
