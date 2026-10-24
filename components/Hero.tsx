import { Container, Eyebrow, PrimaryButton, SecondaryButton } from "./Container";
import { MandateCard } from "./MandateCard";

export function Hero() {
  return (
    <Container className="pb-28 pt-[72px]">
      <div id="top" className="flex flex-wrap items-center gap-16">
        <div className="min-w-0 flex-[1_1_440px]">
          <Eyebrow>Policy-bound agent payments</Eyebrow>
          <h1 className="text-[clamp(42px,6.2vw,72px)] font-semibold leading-[1.02] tracking-display">
            Steer your agents,
            <br />
            <span className="text-[#7A8494]">don&apos;t trust them.</span>
          </h1>
          <p className="mt-7 max-w-[480px] text-[19px] leading-[1.6] text-mute">
            Bridle lets an AI agent spend across chains without ever holding a
            key. You set the limits once, and a contract enforces them.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <PrimaryButton href="/app" large>
              Open app
            </PrimaryButton>
            <SecondaryButton href="#how">Read how it works</SecondaryButton>
          </div>
          <p className="mt-7 font-mono text-xs text-mute">
            Built on NEAR Chain Signatures and Intents
          </p>
        </div>

        <div className="min-w-0 max-w-[520px] flex-[1_1_400px]">
          <MandateCard />
        </div>
      </div>
    </Container>
  );
}
