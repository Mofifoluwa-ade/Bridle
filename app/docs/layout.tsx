import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "Docs",
  title: "Bridle documentation",
  sub: "Everything about spending rules, payments and the contract.",
  noindex: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
