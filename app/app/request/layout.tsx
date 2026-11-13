import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Ask for a payment",
  sub: "Make a link or QR code that anyone can pay.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
