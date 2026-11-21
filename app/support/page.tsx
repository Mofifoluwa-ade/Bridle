import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = ogMeta({
  kind: "Support",
  title: "Bridle support",
  sub: "Help with connecting agents, understanding mandates and reporting issues.",
  description: "Contact Bridle support or report a technical issue.",
});

const link = "font-medium text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border";

export default function SupportPage() {
  return (
    <main>
      <Nav />
      <Container className="pt-14 sm:pt-24 pb-20 sm:pb-28">
        <Eyebrow>Help & support</Eyebrow>
        <h1 className="max-w-[720px] text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] tracking-heading text-ink dark:text-white">
          Need a hand with Bridle?
        </h1>
        <p className="mt-5 max-w-[620px] text-base sm:text-lg leading-[1.65] text-mute dark:text-dark-mute">
          For help connecting an AI app, understanding an agent mandate, or reporting a problem, contact the Bridle team.
        </p>
        <div className="mt-10 grid max-w-[760px] gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-line bg-white/70 p-5 dark:border-dark-border dark:bg-dark-card/70">
            <h2 className="text-base font-semibold text-ink dark:text-white">Email support</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute dark:text-dark-mute">Send a description of the issue and the MCP tool or page involved.</p>
            <a className={`mt-4 inline-flex ${link}`} href="mailto:usebridle@gmail.com">usebridle@gmail.com</a>
          </section>
          <section className="rounded-2xl border border-line bg-white/70 p-5 dark:border-dark-border dark:bg-dark-card/70">
            <h2 className="text-base font-semibold text-ink dark:text-white">Report a technical issue</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute dark:text-dark-mute">For reproducible bugs or feature requests, use the public GitHub issue tracker.</p>
            <a className={`mt-4 inline-flex ${link}`} href="https://github.com/Mofifoluwa-ade/Bridle/issues" target="_blank" rel="noopener noreferrer">Open GitHub issues ↗</a>
          </section>
        </div>
        <p className="mt-8 max-w-[680px] text-sm leading-relaxed text-mute dark:text-dark-mute">
          Never include private keys, seed phrases, agent links, OAuth access tokens, or refresh tokens in a support request. For connection instructions, see the <Link className={link} href="/mcp">MCP setup guide</Link>. Read the <Link className={link} href="/privacy">Privacy policy</Link> and <Link className={link} href="/terms">Terms of service</Link>. Report suspected security issues privately by email, not on GitHub.
        </p>
      </Container>
      <Footer />
    </main>
  );
}
