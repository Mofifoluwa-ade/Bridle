import { Container } from "./Container";
import { LogoMark, Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line dark:border-dark-border text-ink dark:text-white transition-colors">
      <Container className="flex flex-wrap items-center justify-between gap-4 pb-10 pt-8">
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <Wordmark className="text-[17px]" />
        </div>
        <span className="text-[13.5px] text-mute dark:text-dark-mute">
          Built for the NEAR Build Beyond Boundaries hackathon, 2026
        </span>
      </Container>
    </footer>
  );
}
