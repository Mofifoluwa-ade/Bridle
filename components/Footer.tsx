import Link from "next/link";
import { Container } from "./Container";
import { LogoMark, Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line dark:border-dark-border text-ink dark:text-white transition-colors">
      <Container className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 pt-6 sm:pb-10 sm:pt-8">
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <Wordmark className="text-[17px]" />
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[13px] text-mute dark:text-dark-mute">
          <Link href="/docs" className="hover:text-ink dark:hover:text-white transition-colors">
            Documentation
          </Link>
          <Link href="/app" className="hover:text-ink dark:hover:text-white transition-colors">
            Launch App
          </Link>
          <a
            href="https://testnet.nearblocks.io/address/bridle.testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink dark:hover:text-white transition-colors"
          >
            Contract
          </a>
        </div>
        <span className="text-[12.5px] sm:text-[13.5px] text-mute dark:text-dark-mute">
          Built for the NEAR Build Beyond Boundaries hackathon, 2026
        </span>
      </Container>
    </footer>
  );
}
