import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Settings",
  sub: "Wallet and preferences.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
