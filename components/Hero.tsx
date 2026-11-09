import { Container, Eyebrow, PrimaryButton, SecondaryButton } from "./Container";
import { MandateCard } from "./MandateCard";

export function Hero() {
  return (
    <Container className="relative pb-20 sm:pb-28 pt-8 sm:pt-16">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-accent/[0.055] blur-3xl dark:bg-accent-dark/[0.06]" />
      <div id="top" className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-16">
        <div className="min-w-0">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-2 shadow-sm dark:border-dark-border dark:bg-dark-card/80">
            <span className="h-2 w-2 rounded-full bg-accent dark:bg-accent-dark" />
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-mute dark:text-dark-mute">
              NEAR testnet · Base Sepolia
            </span>
          </div>
          <Eyebrow>Policy-bound payments for autonomous agents</Eyebrow>
          <h1 className="max-w-[700px] text-[clamp(38px,6.2vw,74px)] font-semibold leading-[1.015] tracking-display text-ink dark:text-white">
            Let agents act.
            <br />
            <span className="text-[#7A8494] dark:text-[#9BA3AF]">Keep authority yours.</span>
          </h1>
          <p className="mt-5 sm:mt-7 max-w-[520px] text-[17px] sm:text-[19px] leading-[1.65] text-mute dark:text-dark-mute">
            Give an agent a spending mandate, not a blank cheque. Bridle checks each proposal against rules you signed on NEAR — before a payment can execute.
          </p>
          <div className="mt-7 sm:mt-9 flex flex-wrap gap-3">
            <PrimaryButton href="/app/mandates/new" large>
              Create a mandate <span aria-hidden className="ml-2">↗</span>
            </PrimaryButton>
            <SecondaryButton href="/mcp">Connect an agent</SecondaryButton>
          </div>
          <p className="mt-6 max-w-[520px] text-[13px] leading-[1.65] text-mute dark:text-dark-mute">
            The agent uses a restricted function-call key to propose payments. It cannot change your mandate or transfer funds directly.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute dark:border-dark-border dark:text-dark-mute">
            <span>NEAR native payments</span>
            <span>Base USDC via Chain Signatures</span>
            <span>Solana planned</span>
          </div>
        </div>
        <div className="w-full min-w-0 lg:pl-2">
          <MandateCard />
        </div>
      </div>
    </Container>
  );
}
