import { Container, PrimaryButton, SecondaryButton } from "./Container";
import { LogoMark } from "./Logo";

// Set these once the demo post and spec are public.
const DEMO_URL = "#top"; // e.g. your X demo post
const SPEC_URL = "#how"; // e.g. your published spec

export function Cta() {
  return (
    <Container className="pb-20 sm:pb-36 pt-16 sm:pt-[120px] text-center">
      <section id="cta" aria-labelledby="cta-title">
        <LogoMark size={40} className="mx-auto text-accent" />
        <h2
          id="cta-title"
          className="mx-auto mt-6 sm:mt-7 max-w-[760px] text-[clamp(32px,5.4vw,64px)] font-semibold leading-[1.04] tracking-display text-ink dark:text-white"
        >
          Give your agent a bridle.
        </h2>
        <p className="mx-auto mt-4 sm:mt-[22px] max-w-[460px] text-[17px] sm:text-[19px] leading-[1.6] text-mute dark:text-dark-mute">
          Set the limits once. Let it work.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/app" large>
            Open app
          </PrimaryButton>
          <SecondaryButton href="#how">Read how it works</SecondaryButton>
        </div>
      </section>
    </Container>
  );
}
