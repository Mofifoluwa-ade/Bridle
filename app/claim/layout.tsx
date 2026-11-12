import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Claim your payment",
  description: "Someone sent you NEAR. Claim it in a minute, no wallet needed.",
  robots: { index: false, follow: false },
};

/** Opened by people who may have no wallet and no account, so there is no app chrome and no wallet gate. */
export default function ClaimLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink dark:bg-dark-bg dark:text-white">
      <header className="border-b border-line dark:border-dark-border">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Bridle home">
            <LogoMark size={24} className="text-ink dark:text-white" />
            <Wordmark />
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-mute dark:border-dark-border dark:text-dark-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" />
            Testnet
          </span>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-14">{children}</main>
      <footer className="px-4 pb-8 text-center text-[12.5px] text-mute dark:text-dark-mute">Bridle · Test tokens only.</footer>
    </div>
  );
}
