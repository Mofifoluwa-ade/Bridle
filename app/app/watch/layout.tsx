import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "App",
  title: "Watch",
  sub: "Live feed of every payment your agents attempt.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
