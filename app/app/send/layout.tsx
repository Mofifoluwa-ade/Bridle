import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Send a payment",
  sub: "Pay a NEAR account or make a claim link anyone can open.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
