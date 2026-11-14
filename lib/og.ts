import type { Metadata } from "next";

export type OgInput = {
  /** Small label above the headline, e.g. "Pay request". */
  kind: string;
  title: string;
  sub?: string;
  /** Large figure shown on payment cards, e.g. "5 NEAR". */
  big?: string;
};

const clip = (s: string | undefined, n: number) => (s ?? "").slice(0, n);

export function ogUrl(i: OgInput): string {
  const q = new URLSearchParams();
  q.set("k", clip(i.kind, 40));
  q.set("t", clip(i.title, 90));
  if (i.sub) q.set("s", clip(i.sub, 140));
  if (i.big) q.set("b", clip(i.big, 24));
  return `/api/og?${q.toString()}`;
}

/** Page metadata with a generated link-preview image, so each screen shows its own card when shared. */
export function ogMeta(i: OgInput & { description?: string; path?: string; noindex?: boolean }): Metadata {
  const description = i.description ?? i.sub ?? "Steer your agents, don't trust them.";
  const title = `${i.title} — Bridle`;
  const img = [{ url: ogUrl(i), width: 1200, height: 630, alt: i.title }];
  return {
    title: i.title,
    description,
    ...(i.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, siteName: "Bridle", type: "website", ...(i.path ? { url: i.path } : {}), images: img },
    twitter: { card: "summary_large_image", title, description, images: [img[0].url] },
  };
}
