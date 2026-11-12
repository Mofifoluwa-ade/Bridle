import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { WalletButton } from "@/components/app/AppShell";
import { WalletProvider } from "@/components/app/WalletProvider";
import { LogoMark, Wordmark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Pay on Bridle",
  description: "A payment request on NEAR. Check the details, then pay.",
};

/**
 * Pay links are opened by people who may never have used Bridle, so this page lives outside the app:
 * no sidebar, no dashboard, just who is being paid and one button.
 */
export default function PayLayout({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <div className="flex min-h-screen flex-col bg-paper text-ink dark:bg-dark-bg dark:text-white">
        <header className="border-b border-line dark:border-dark-border">
          <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Bridle home">
              <LogoMark size={24} className="text-ink dark:text-white" />
              <Wordmark />
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-mute dark:border-dark-border dark:text-dark-mute sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" />
                Testnet
              </span>
              <WalletButton />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-14">{children}</main>
        <footer className="px-4 pb-8 text-center text-[12.5px] text-mute dark:text-dark-mute">
          Bridle · Steer your agents, don&rsquo;t trust them. Test tokens only.
        </footer>
      </div>
    </WalletProvider>
  );
}
