import Link from "next/link";
import { Container } from "./Container";
import { LogoMark, Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line text-ink transition-colors dark:border-dark-border dark:text-white">
      <Container className="flex flex-col items-start justify-between gap-4 pb-8 pt-6 sm:flex-row sm:items-center sm:pb-10 sm:pt-8">
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <Wordmark className="text-[17px]" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-mute dark:text-dark-mute sm:gap-6">
          <Link href="/docs" className="transition-colors hover:text-ink dark:hover:text-white">Documentation</Link>
          <Link href="/mcp" className="transition-colors hover:text-ink dark:hover:text-white">For agents</Link>
          <Link href="/brand" className="transition-colors hover:text-ink dark:hover:text-white">Brand guidelines</Link>
          <Link href="/app" className="transition-colors hover:text-ink dark:hover:text-white">Launch App</Link>
          <a href="https://testnet.nearblocks.io/address/bridle.testnet" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink dark:hover:text-white">Contract (NEAR testnet · v0.1)</a>
        </div>
        <span className="text-[12.5px] text-mute dark:text-dark-mute sm:text-[13.5px]">Built on NEAR · Testnet · Open source</span>
      </Container>
    </footer>
  );
}
