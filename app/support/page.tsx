import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Support — Bridle", description: "Get help with Bridle setup, agent connections and security concerns." };

export default function SupportPage() {
  return <main><Nav /><Container className="pt-14 pb-20 sm:pt-20 sm:pb-28">
    <p className="font-mono text-xs uppercase tracking-widest text-accent">Help and security</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink dark:text-white">Support</h1>
    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-mute dark:text-dark-mute">For help connecting an AI app, understanding a mandate, reporting a bug or raising a security concern, email the Bridle maintainer.</p>
    <a href="mailto:usebridle@gmail.com" className="mt-7 inline-flex rounded-full border border-line px-5 py-3 text-sm font-medium text-ink hover:bg-paper dark:border-dark-border dark:text-white dark:hover:bg-white/5">usebridle@gmail.com</a>
    <div className="mt-12 grid max-w-3xl gap-7 sm:grid-cols-2">
      <section><h2 className="text-lg font-semibold text-ink dark:text-white">Include in a support request</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-mute dark:text-dark-mute"><li>The page or MCP tool you were using</li><li>What you expected and what happened</li><li>The approximate time and relevant proposal ID</li><li>Your browser and AI client version, if relevant</li></ul></section>
      <section><h2 className="text-lg font-semibold text-ink dark:text-white">Security reports</h2><p className="mt-3 text-sm leading-6 text-mute dark:text-dark-mute">Please report suspected vulnerabilities privately by email. Do not include seed phrases, private keys, agent-link tokens, OAuth tokens or other credentials. A proposal ID or redacted transaction hash is usually sufficient to begin triage.</p></section>
    </div>
    <p className="mt-12 text-sm text-mute dark:text-dark-mute">Read the <Link className="underline underline-offset-4" href="/privacy">Privacy policy</Link> and <Link className="underline underline-offset-4" href="/terms">Terms of service</Link>.</p>
  </Container><Footer /></main>;
}
