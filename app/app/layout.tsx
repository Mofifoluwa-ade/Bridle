import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";
import { AppShell } from "@/components/app/AppShell";
import { WalletProvider } from "@/components/app/WalletProvider";
import { TourProvider } from "@/components/app/SpotlightTour";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Bridle App",
  sub: "Policy-bound payments for AI agents.",
  description: "Steer your agents, don't trust them.",
  noindex: true,
});

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <TourProvider>
        <AppShell>{children}</AppShell>
      </TourProvider>
    </WalletProvider>
  );
}
