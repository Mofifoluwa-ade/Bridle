import type { Metadata } from "next";
import PayClient from "./PayClient";
import { ogMeta } from "@/lib/og";
import { parseRequest } from "@/lib/request";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Each pay link carries its own preview: who is asking and, when set, how much. */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined)) ?? null;
  const r = parseRequest(one);
  if (!r.ok) return ogMeta({ kind: "Payment request", title: "Pay with Bridle", sub: "Send NEAR in a few taps.", noindex: true });
  return ogMeta({
    kind: "Payment request",
    big: r.amount ? `${r.amount} NEAR` : undefined,
    title: r.amount ? `to ${r.to}` : `${r.to} is asking for a payment`,
    sub: r.memo || "Pay in a few taps. Test tokens only.",
    description: r.amount ? `${r.to} asked you for ${r.amount} NEAR.` : `${r.to} sent you a payment link.`,
    noindex: true,
  });
}

export default function Page() {
  return <PayClient />;
}
