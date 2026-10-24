import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { WalletProvider } from "@/components/app/WalletProvider";
import { TourProvider } from "@/components/app/SpotlightTour";

export const metadata: Metadata = {
  title: "Bridle App • Policy-Bound Payments",
  description: "Steer your agents, don't trust them.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <TourProvider>
        <AppShell>{children}</AppShell>
      </TourProvider>
    </WalletProvider>
  );
}
