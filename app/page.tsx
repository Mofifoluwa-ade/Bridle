import { Cta } from "@/components/Cta";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { McpQuickStart } from "@/components/McpQuickStart";
import { Nav } from "@/components/Nav";
import { Principles } from "@/components/Principles";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <main>
      <Nav />
      <ScrollReveal><Hero /></ScrollReveal>
      <ScrollReveal delay={70}><HowItWorks /></ScrollReveal>
      <ScrollReveal><Principles /></ScrollReveal>
      <ScrollReveal delay={60}><McpQuickStart /></ScrollReveal>
      <ScrollReveal><Faq /></ScrollReveal>
      <ScrollReveal delay={50}><Cta /></ScrollReveal>
      <Footer />
    </main>
  );
}
