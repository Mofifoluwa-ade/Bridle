import type { Metadata } from "next";
import { BrandGuide } from "./BrandGuide";

export const metadata: Metadata = {
  title: "Brand guidelines — Bridle",
  description:
    "The visual identity, language and design principles behind Bridle.",
  alternates: { canonical: "/brand" },
};

export default function BrandPage() {
  return <BrandGuide />;
}
