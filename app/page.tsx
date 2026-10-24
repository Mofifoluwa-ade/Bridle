import { Cta } from "@/components/Cta";
import { Edges } from "@/components/Edges";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";
import { Principles } from "@/components/Principles";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <Principles />
      <Edges />
      <Cta />
      <Footer />
    </main>
  );
}
