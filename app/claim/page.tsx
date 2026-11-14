import type { Metadata } from "next";
import ClaimClient from "./ClaimClient";
import { ogMeta } from "@/lib/og";
import { cleanMemo } from "@/lib/request";

type SP = Promise<Record<string, string | string[] | undefined>>;

/**
 * The claim secret lives after the # and never reaches the server, so the preview cannot show the amount.
 * It shows the note instead.
 */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const m = Array.isArray(sp.m) ? sp.m[0] : sp.m;
  const memo = cleanMemo(m ?? "");
  return ogMeta({
    kind: "Payment for you",
    title: "Someone sent you NEAR",
    sub: memo ? `“${memo}”` : "Claim it in a minute. No wallet needed.",
    description: "Someone sent you NEAR. Claim it in a minute, no wallet needed.",
    noindex: true,
  });
}

export default function Page() {
  return <ClaimClient />;
}
