import { Container, Eyebrow, PrimaryButton, SecondaryButton } from "./Container";
import { MandateCard } from "./MandateCard";

export function Hero() {
  return (
    <Container className="relative pb-20 sm:pb-28 pt-10 sm:pt-[76px]">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-accent/[0.055] blur-3xl dark:bg-accent-dark/[0.06]" />
      <div id="top" className="relative flex flex-wrap items-center gap-10 lg:gap-16">
        <div className="w-full lg:flex-[1_1_440px] min-w-0">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line dark:border-dark-border bg-white/80 dark:bg-dark-card/80 px-3.5 py-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-30 dark:bg-accent-dark" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent dark:bg-accent-dark" />
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-mute dark:text-dark-mute">
              NEAR testnet · Policy-bound agent payments
            </span>
          </div>
          <Eyebrow>Autonomy, with boundaries</Eyebrow>
          <h1 className="max-w-[700px] text-[clamp(36px,6.2vw,72px)] font-semibold leading-[1.015] tracking-display text-ink dark:text-white">
            Let your agents work.
            <br />
            <span className="text-[#7A8494] dark:text-[#9BA3AF]">Keep spending in bounds.</span>
          </h1>
          <p className="mt-5 sm:mt-7 max-w-[500px] text-[17px] sm:text-[19px] leading-[1.65] text-mute dark:text-dark-mute">
            Bridle gives an AI agent a restricted way to propose payments. A contract checks every request against the mandate you signed — before anything can move.
          </p>
          <div className="mt-7 sm:mt-9 flex flex-wrap gap-3">
            <PrimaryButton href="/app" large>
              Create a mandate
              <span aria-hidden className="ml-2">↗</span>
            </PrimaryButton>
            <SecondaryButton href="/mcp">Connect an agent</SecondaryButton>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-line dark:border-dark-border pt-5 text-[12px] sm:text-[13px] text-mute dark:text-dark-mute">
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" /> Rules enforced on-chain</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" /> Agent cannot move funds</span>
            <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" /> Owner keeps control</span>
          </div>
        </div>

        <div className="w-full max-w-[520px] lg:flex-[1_1_400px] min-w-0">
          <MandateCard />
        </div>
      </div>
    </Container>
  );
}
