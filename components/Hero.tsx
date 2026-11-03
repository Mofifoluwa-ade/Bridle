import { AGENT_PROMPT } from "@/lib/agentPrompt";
import { CopyPromptButton } from "./CopyButton";
import { Container, Eyebrow, SecondaryButton } from "./Container";
import { MandateCard } from "./MandateCard";

export function Hero() {
  return (
    <Container className="pb-16 sm:pb-28 pt-8 sm:pt-[72px]">
      <div id="top" className="flex flex-wrap items-center gap-10 lg:gap-16">
        <div className="w-full lg:flex-[1_1_440px] min-w-0">
          <Eyebrow>Policy-bound agent payments</Eyebrow>
          <h1 className="text-[clamp(32px,6.2vw,72px)] font-semibold leading-[1.04] tracking-display text-ink dark:text-white">
            Steer your agents,
            <br />
            <span className="text-[#7A8494] dark:text-[#9BA3AF]">don&apos;t trust them.</span>
          </h1>
          <p className="mt-5 sm:mt-7 max-w-[480px] text-[17px] sm:text-[19px] leading-[1.6] text-mute dark:text-dark-mute">
            Bridle lets an AI agent spend across chains without ever holding a
            key. You set the limits once, and a contract enforces them.
          </p>
          <div className="mt-7 sm:mt-9 flex flex-wrap gap-3">
            <CopyPromptButton text={AGENT_PROMPT} label="Copy agent prompt" />
            <SecondaryButton href="/app">Open app</SecondaryButton>
          </div>
          <p className="mt-4 max-w-[480px] text-[14px] leading-[1.6] text-mute dark:text-dark-mute">
            Paste it into Claude, Cursor or any agent. It tells the agent how to work inside your limits.{" "}
            <a href="/mcp" className="font-medium text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border">
              See what it sets up
            </a>
          </p>
          <p className="mt-6 sm:mt-7 font-mono text-xs text-mute dark:text-dark-mute">
            Built on NEAR · Signs through NEAR Chain Signatures
          </p>
        </div>

        <div className="w-full max-w-[520px] lg:flex-[1_1_400px] min-w-0">
          <MandateCard />
        </div>
      </div>
    </Container>
  );
}
