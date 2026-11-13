import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Your spending rules",
  sub: "Limits, approved recipients and live activity for each rule.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
