"use client";

import { useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/Container";
import { LogoMark, Wordmark } from "@/components/Logo";

type Swatch = { name: string; value: string; note: string; text?: string };

const palette: { title: string; description: string; swatches: Swatch[] }[] = [
  {
    title: "Core",
    description: "The foundation. Use these surfaces to keep the interface quiet and legible.",
    swatches: [
      { name: "Ink", value: "#0E1116", note: "Primary text and dark surfaces", text: "#FFFFFF" },
      { name: "Paper", value: "#F6F7F9", note: "Default light canvas", text: "#0E1116" },
      { name: "White", value: "#FFFFFF", note: "Cards and elevated surfaces", text: "#0E1116" },
    ],
  },
  {
    title: "Neutrals",
    description: "A restrained scale for hierarchy, borders and supporting information.",
    swatches: [
      { name: "Mute", value: "#5B6470", note: "Secondary text", text: "#FFFFFF" },
      { name: "Haze", value: "#7A8494", note: "Quiet supporting text", text: "#0E1116" },
      { name: "Rule", value: "#C9CFD8", note: "Strong dividers", text: "#0E1116" },
      { name: "Line", value: "#E3E6EB", note: "Subtle borders", text: "#0E1116" },
      { name: "Night", value: "#2A313C", note: "Deep neutral", text: "#FFFFFF" },
      { name: "Dim", value: "#A3ABB8", note: "Disabled and tertiary UI", text: "#0E1116" },
    ],
  },
  {
    title: "Accent and status",
    description: "Emerald is functional, not decorative. Alert and caution colors only appear when needed.",
    swatches: [
      { name: "Emerald", value: "#0A7C59", note: "Active and approved", text: "#FFFFFF" },
      { name: "Emerald dark", value: "#46D9A4", note: "Accent on dark surfaces", text: "#0E1116" },
      { name: "Emerald tint", value: "#E7F2EE", note: "Soft approved background", text: "#0E1116" },
      { name: "Alert", value: "#B42318", note: "Blocked or destructive", text: "#FFFFFF" },
      { name: "Alert tint", value: "#FDECEA", note: "Soft alert background", text: "#0E1116" },
      { name: "Caution", value: "#B54708", note: "Review and attention", text: "#FFFFFF" },
      { name: "Caution tint", value: "#FEF3E2", note: "Soft caution background", text: "#0E1116" },
    ],
  },
  {
    title: "Dark surfaces",
    description: "Use this surface scale for the dark theme. Preserve contrast between cards and the page.",
    swatches: [
      { name: "Dark background", value: "#0B0E14", note: "App canvas", text: "#F6F7F9" },
      { name: "Dark card", value: "#12161F", note: "Raised surfaces", text: "#F6F7F9" },
      { name: "Card hover", value: "#171D28", note: "Interactive surface", text: "#F6F7F9" },
      { name: "Dark border", value: "#1E2532", note: "Dark theme dividers", text: "#F6F7F9" },
      { name: "Dark subtle", value: "#181F2C", note: "Nested surfaces", text: "#F6F7F9" },
    ],
  },
];

const sections = [
  ["identity", "Identity"],
  ["logo", "Logo"],
  ["color", "Color"],
  ["type", "Typography"],
  ["interface", "Interface"],
  ["voice", "Voice"],
  ["applications", "Applications"],
];

function SectionHeading({ index, eyebrow, title, copy }: { index: string; eyebrow: string; title: string; copy: string }) {
  return (
    <div className="mb-8 grid gap-3 md:grid-cols-[150px_1fr] md:gap-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">{index} / {eyebrow}</p>
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink dark:text-white sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-mute dark:text-dark-mute">{copy}</p>
      </div>
    </div>
  );
}

function CopySwatch({ swatch }: { swatch: Swatch }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(swatch.value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={`Copy ${swatch.name} color ${swatch.value}`} className="group overflow-hidden rounded-xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-dark-border dark:bg-dark-card">
      <div className="h-24 sm:h-28" style={{ backgroundColor: swatch.value }} />
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink dark:text-white">{swatch.name}</span>
          <span className="font-mono text-[10px] text-mute dark:text-dark-mute">{copied ? "Copied" : "Copy"}</span>
        </div>
        <p className="mt-1 font-mono text-xs text-mute dark:text-dark-mute">{swatch.value}</p>
        <p className="mt-2 min-h-8 text-xs leading-5 text-mute dark:text-dark-mute">{swatch.note}</p>
      </div>
    </button>
  );
}

export function BrandGuide() {
  return (
    <main className="min-h-screen bg-paper text-ink dark:bg-dark-bg dark:text-dark-text">
      <Nav />
      <Container>
        <div className="border-b border-line pb-10 pt-10 dark:border-dark-border sm:pb-14 sm:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute dark:border-dark-border dark:text-dark-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> Brand system / 01
            </span>
            <span className="font-mono text-[11px] text-mute dark:text-dark-mute">Version 1.0 · November 2026</span>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald dark:text-emerald-dark">The Bridle identity</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-ink dark:text-white sm:text-7xl">
                Control, with room to move.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-mute dark:text-dark-mute">
                A practical guide to how Bridle looks, sounds and behaves. Built for every surface where the brand meets a person.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#color" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:opacity-85 dark:bg-white dark:text-ink">Explore the system <span className="ml-2">↓</span></a>
                <a href="https://github.com/Mofifoluwa-ade/Bridle/blob/main/BRAND_GUIDELINES.md" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink transition hover:bg-white dark:border-dark-border dark:text-white dark:hover:bg-dark-card">Read source guide ↗</a>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-ink p-7 text-white sm:p-10">
              <div className="absolute -right-10 -top-12 h-56 w-56 rounded-full border border-white/10" />
              <div className="absolute -right-1 top-8 h-40 w-40 rounded-full border border-white/10" />
              <div className="relative">
                <LogoMark size={62} strokeWidth={3.5} />
                <p className="mt-12 max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em]">Steer your agents.<br />Don’t trust them.</p>
                <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">Set the limits once. Let the contract enforce them. Keep the veto.</p>
                <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                  <span>Bridle / Identity</span><span>01 — 07</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-12 py-12 lg:grid-cols-[180px_1fr] lg:gap-16 lg:py-16">
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">On this page</p>
            <nav aria-label="Brand guideline sections" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {sections.map(([id, label], i) => (
                <a key={id} href={`#${id}`} className="shrink-0 rounded-lg px-3 py-2 text-sm text-mute transition hover:bg-white hover:text-ink dark:text-dark-mute dark:hover:bg-dark-card dark:hover:text-white">
                  <span className="mr-2 font-mono text-[10px] text-emerald dark:text-emerald-dark">0{i + 1}</span>{label}
                </a>
              ))}
            </nav>
            <div className="mt-8 hidden border-t border-line pt-5 text-xs leading-5 text-mute dark:border-dark-border dark:text-dark-mute lg:block">
              Use this page as the source of truth for Bridle brand decisions.
            </div>
          </aside>

          <div className="min-w-0 space-y-20 sm:space-y-24">
            <section id="identity" className="scroll-mt-8">
              <SectionHeading index="01" eyebrow="Foundation" title="A brand built around direction." copy="Bridle is the brand of steering. It gives agents room to act while keeping the boundaries clear, checkable and owned by people." />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["The idea", "A bridle does not stop the horse. It guides its direction. That is the relationship between people, agents and policy."],
                  ["The promise", "Owners set the limits. The contract enforces them. Owners keep the veto."],
                  ["The audience", "Developers and teams building agents that need to move money without receiving unrestricted authority."],
                  ["The principle", "Agents can propose. Rules decide. Every action should be attributable and explainable."],
                ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-white p-5 dark:border-dark-border dark:bg-dark-card"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-mute dark:text-dark-mute">{body}</p></div>)}
              </div>
              <div className="mt-5 rounded-xl bg-[#E7F2EE] p-6 text-[#0E1116] dark:bg-[#172B25] dark:text-white sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#0A7C59] dark:text-[#46D9A4]">Brand personality</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <div><p className="text-2xl font-semibold tracking-tight">Calm</p><p className="mt-1 text-sm leading-6 opacity-70">Never alarmed. Space, restraint and quiet confidence.</p></div>
                  <div><p className="text-2xl font-semibold tracking-tight">Exact</p><p className="mt-1 text-sm leading-6 opacity-70">Names the number, the rule and the limit.</p></div>
                  <div><p className="text-2xl font-semibold tracking-tight">Candid</p><p className="mt-1 text-sm leading-6 opacity-70">States capabilities and limitations without spin.</p></div>
                </div>
              </div>
            </section>

            <section id="logo" className="scroll-mt-8">
              <SectionHeading index="02" eyebrow="Signature" title="A mark made from a single line." copy="The Bridle mark is a vertical guide line with two open rings. It is simple, geometric and recognizable at small sizes. Use the supplied mark; do not redraw it." />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex min-h-64 items-center justify-center rounded-xl bg-white p-8 text-ink dark:bg-dark-card dark:text-white">
                  <div className="text-center"><div className="flex items-center justify-center gap-3"><LogoMark size={64} strokeWidth={3.5} /><Wordmark className="text-4xl" /></div><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">Primary lockup / light</p></div>
                </div>
                <div className="flex min-h-64 items-center justify-center rounded-xl bg-ink p-8 text-white">
                  <div className="text-center"><div className="flex items-center justify-center gap-3"><LogoMark size={64} strokeWidth={3.5} /><Wordmark className="text-4xl" /></div><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Primary lockup / dark</p></div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">Do</p><ul className="mt-3 space-y-2 text-sm leading-6 text-mute dark:text-dark-mute"><li>• Keep the mark and wordmark proportions intact.</li><li>• Use Ink on light surfaces and White on dark surfaces.</li><li>• Give the mark clear space around every side.</li><li>• Use the standalone mark for compact placements.</li></ul></div>
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">Don’t</p><ul className="mt-3 space-y-2 text-sm leading-6 text-mute dark:text-dark-mute"><li>• Stretch, rotate or redraw the mark.</li><li>• Add shadows, gradients or outlines.</li><li>• Place it over busy photography.</li><li>• Add horse imagery, reins or clip-art motifs.</li></ul></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <a href="/bridle-mark.svg" className="rounded-full border border-line px-4 py-2 font-medium hover:bg-white dark:border-dark-border dark:hover:bg-dark-card" download>Download SVG mark ↗</a>
                <a href="https://github.com/Mofifoluwa-ade/Bridle/blob/main/BRAND_GUIDELINES.md" target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 font-medium hover:bg-white dark:border-dark-border dark:hover:bg-dark-card">Source specifications ↗</a>
              </div>
            </section>

            <section id="color" className="scroll-mt-8">
              <SectionHeading index="03" eyebrow="Palette" title="Quiet by default. Clear when it matters." copy="Ink and Paper do most of the work. Emerald signals active or approved states. Alert and caution colors are reserved for meaningful status changes. Select any swatch to copy its HEX value." />
              <div className="space-y-9">
                {palette.map((group) => <div key={group.title}><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><h3 className="text-lg font-semibold">{group.title}</h3><p className="max-w-md text-xs leading-5 text-mute dark:text-dark-mute">{group.description}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{group.swatches.map((swatch) => <CopySwatch key={swatch.name} swatch={swatch} />)}</div></div>)}
              </div>
              <p className="mt-5 text-xs leading-5 text-mute dark:text-dark-mute">Color is never the only status cue. Pair every state color with a plain-language label or icon.</p>
            </section>

            <section id="type" className="scroll-mt-8">
              <SectionHeading index="04" eyebrow="Typography" title="Human in the headline. Precise in the detail." copy="Instrument Sans carries the brand's voice. JetBrains Mono is reserved for values, identifiers, labels and technical detail." />
              <div className="overflow-hidden rounded-xl border border-line bg-white dark:border-dark-border dark:bg-dark-card">
                <div className="border-b border-line p-6 dark:border-dark-border sm:p-8">
                  <div className="flex flex-wrap justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald dark:text-emerald-dark">Instrument Sans / Display</span><span className="font-mono text-xs text-mute dark:text-dark-mute">Semibold · Tight tracking</span></div>
                  <p className="mt-8 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">Rules decide.</p>
                  <p className="mt-4 max-w-xl text-base leading-7 text-mute dark:text-dark-mute">Use for headlines, section titles and high-level product statements. Keep sentences short and confident.</p>
                </div>
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="border-b border-line p-6 dark:border-dark-border md:border-b-0 md:border-r sm:p-8"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald dark:text-emerald-dark">Instrument Sans / Body</span><p className="mt-6 text-xl font-medium leading-8">Set the limits once. Let the contract enforce them.</p><p className="mt-3 text-sm leading-6 text-mute dark:text-dark-mute">Body copy should be clear, compact and easy to scan.</p></div>
                  <div className="p-6 sm:p-8"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-emerald dark:text-emerald-dark">JetBrains Mono / Data</span><p className="mt-6 font-mono text-xl leading-8">USDC 250.00</p><p className="mt-3 font-mono text-xs leading-6 text-mute dark:text-dark-mute">0x71C...9A2F · 24h limit · TESTNET</p><p className="mt-3 text-sm leading-6 text-mute dark:text-dark-mute">Use for amounts, addresses, timestamps, code and compact labels.</p></div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[["Display","48–72 px","Hero and page titles"],["Heading","24–36 px","Section and card titles"],["Body","14–18 px","Explanations and interface copy"]].map(([a,b,c])=><div key={a} className="rounded-xl border border-line p-4 dark:border-dark-border"><p className="text-xs text-mute dark:text-dark-mute">{a}</p><p className="mt-2 font-mono text-sm">{b}</p><p className="mt-1 text-xs text-mute dark:text-dark-mute">{c}</p></div>)}
              </div>
            </section>

            <section id="interface" className="scroll-mt-8">
              <SectionHeading index="05" eyebrow="Product language" title="The interface should feel governed." copy="Bridle's product UI is a system of clear surfaces, deliberate spacing and explicit states. Components should explain what is happening and what happens next." />
              <div className="rounded-xl border border-line bg-white p-5 dark:border-dark-border dark:bg-dark-card sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Mandate overview</p><p className="mt-1 text-xs text-mute dark:text-dark-mute">Updated just now</p></div><span className="rounded-full bg-[#E7F2EE] px-3 py-1.5 text-xs font-medium text-[#0A7C59] dark:bg-[#172B25] dark:text-[#46D9A4]">Active</span></div>
                <div className="mt-7 grid gap-6 sm:grid-cols-3">
                  <div><p className="text-xs text-mute dark:text-dark-mute">Daily allowance</p><p className="mt-2 font-mono text-2xl">$250.00</p><p className="mt-1 text-xs text-mute dark:text-dark-mute">$84.00 remaining</p></div>
                  <div><p className="text-xs text-mute dark:text-dark-mute">Per-payment cap</p><p className="mt-2 font-mono text-2xl">$50.00</p><p className="mt-1 text-xs text-mute dark:text-dark-mute">Maximum per proposal</p></div>
                  <div><p className="text-xs text-mute dark:text-dark-mute">Review threshold</p><p className="mt-2 font-mono text-2xl">$20.00</p><p className="mt-1 text-xs text-mute dark:text-dark-mute">Owner review required</p></div>
                </div>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#E3E6EB] dark:bg-[#1E2532]"><div className="h-full w-2/3 rounded-full bg-[#0A7C59] dark:bg-[#46D9A4]" /></div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5 dark:border-dark-border"><span className="rounded-full border border-line px-3 py-1.5 text-xs dark:border-dark-border">3 approved recipients</span><span className="rounded-full border border-line px-3 py-1.5 text-xs dark:border-dark-border">NEAR testnet</span></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">Layout principles</p><ul className="mt-3 space-y-2 text-sm leading-6 text-mute dark:text-dark-mute"><li>• Align content to a consistent grid.</li><li>• Use whitespace to establish hierarchy.</li><li>• Keep cards and borders quiet.</li><li>• Use rounded corners consistently, not decoratively.</li></ul></div>
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">State principles</p><ul className="mt-3 space-y-2 text-sm leading-6 text-mute dark:text-dark-mute"><li>• Show status as a word, not color alone.</li><li>• Explain why a payment is blocked.</li><li>• Distinguish proposed, waiting and executed.</li><li>• Keep errors calm and actionable.</li></ul></div>
              </div>
            </section>

            <section id="voice" className="scroll-mt-8">
              <SectionHeading index="06" eyebrow="Voice and tone" title="Say the rule. Skip the theatre." copy="Bridle sounds like a precise, unhurried colleague. It states the rule, names the limit and never raises its voice." />
              <div className="overflow-hidden rounded-xl border border-line dark:border-dark-border">
                <div className="grid grid-cols-[1fr_1fr] bg-white text-xs font-semibold dark:bg-dark-card"><div className="p-4 text-mute dark:text-dark-mute">Avoid</div><div className="border-l border-line p-4 dark:border-dark-border">Write</div></div>
                {[
                  ["Military-grade AI guard keeps your funds 100% safe","Up to $50 a day, to three approved recipients."],
                  ["Transaction rejected!","Blocked. Recipient not on the list."],
                  ["Trustless agent wallet","An agent wallet with no key to steal."],
                  ["No data yet","Waiting for the agent."],
                  ["Your agent was hacked","The agent tried to overspend. Blocked."],
                ].map(([bad,good])=><div key={bad} className="grid grid-cols-[1fr_1fr] border-t border-line bg-paper text-sm dark:border-dark-border dark:bg-dark-bg"><div className="p-4 leading-6 text-mute dark:text-dark-mute">{bad}</div><div className="border-l border-line p-4 font-medium leading-6 dark:border-dark-border">{good}</div></div>)}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">Use</p><p className="mt-3 text-sm leading-7 text-mute dark:text-dark-mute">Mandate · propose · veto · revoke · limit · approved recipient · blocked · waiting · frozen</p></div>
                <div className="rounded-xl border border-line p-5 dark:border-dark-border"><p className="text-sm font-semibold">Avoid</p><p className="mt-3 text-sm leading-7 text-mute dark:text-dark-mute">Trustless · unhackable · guaranteed · 100% safe · revolutionary · next-gen · seamless</p></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-mute dark:text-dark-mute">Mechanics: sentence case everywhere. Keep sentences short. Use whole dollars in rules and two decimals in activity feeds. No exclamation marks in product states.</p>
            </section>

            <section id="applications" className="scroll-mt-8">
              <SectionHeading index="07" eyebrow="In the wild" title="One identity. Every touchpoint." copy="The same principles should hold across product, developer resources and public communication. Adapt the format, not the character." />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-ink p-6 text-white sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Website / Product</p><p className="mt-10 text-3xl font-semibold leading-tight tracking-[-0.04em]">Agents can propose.<br />Rules decide.</p><p className="mt-4 max-w-xs text-sm leading-6 text-white/60">Set the limits once. Let the contract enforce them.</p></div>
                <div className="rounded-xl border border-line bg-white p-6 dark:border-dark-border dark:bg-dark-card sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">Social / Developer</p><p className="mt-10 text-2xl font-semibold leading-tight tracking-[-0.04em]">Give agents a mandate, not a blank cheque.</p><p className="mt-4 text-sm leading-6 text-mute dark:text-dark-mute">Explain one idea at a time. Be specific about what is live, what is in testnet and what is still being built.</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-line p-5 dark:border-dark-border sm:p-7">
                <p className="text-sm font-semibold">The honest-edges rule</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-mute dark:text-dark-mute">Never imply that Bridle removes every trust assumption or makes funds risk-free. Describe the actual contract rules, supported chains and current environment. If a capability is not verified, say so.</p>
              </div>
            </section>

            <div className="rounded-2xl bg-[#0E1116] p-7 text-white sm:p-10">
              <div className="flex items-center gap-3"><LogoMark size={34} /><Wordmark className="text-xl" /></div>
              <p className="mt-8 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">Keep the direction clear. Keep the rules visible.</p>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
                <p className="text-xs text-white/50">Bridle brand guidelines · Version 1.0</p>
                <Link href="/" className="text-sm font-medium text-white transition hover:text-[#46D9A4]">Back to Bridle ↗</Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
