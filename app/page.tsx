import { Compare } from "@/components/Compare";
import { Cta } from "@/components/Cta";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Roadmap } from "@/components/Roadmap";
import { HowSticky } from "@/components/HowSticky";
import { McpQuickStart } from "@/components/McpQuickStart";
import { Nav } from "@/components/Nav";
import { Principles } from "@/components/Principles";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <main>
      <ScrollProgress />
      <Nav />
      <Hero />
      <ScrollReveal><Compare /></ScrollReveal>
      <HowSticky />
      <ScrollReveal stagger><Principles /></ScrollReveal>
      <ScrollReveal stagger><Roadmap /></ScrollReveal>
      <ScrollReveal delay={60}><McpQuickStart /></ScrollReveal>
      <ScrollReveal><Faq /></ScrollReveal>
      <ScrollReveal delay={40}><Cta /></ScrollReveal>
      <Footer />
    </main>
  );
}
