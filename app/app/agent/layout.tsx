import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Test your agent",
  sub: "Send a test payment as your agent and watch the rule decide.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
