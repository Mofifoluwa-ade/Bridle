import type { Metadata } from "next";
import Link from "next/link";
import { BrandSwatch } from "@/components/BrandSwatch";
import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { LogoMark, Wordmark } from "@/components/Logo";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Brand guidelines",
  description:
    "How Bridle looks and sounds: the line, the mark, the colours, the type and the voice. Steer your agents, don't trust them.",
  alternates: { canonical: "/brand" },
};

const sections = [
  ["essence", "Essence"],
  ["personality", "Personality"],
  ["voice", "Voice"],
  ["logo", "Logo"],
  ["colour", "Colour"],
  ["type", "Type"],
  ["interface", "Interface"],
  ["in-use", "In use"],
] as const;

type Swatch = { name: string; hex: string; use: string; dark?: boolean };
const palette: { title: string; note: string; swatches: Swatch[] }[] = [
  {
    title: "Core",
    note: "Ink and paper do most of the work.",
    swatches: [
      { name: "Ink", hex: "#0E1116", use: "Text, dark surfaces, the primary button.", dark: true },
      { name: "Paper", hex: "#F6F7F9", use: "The page background." },
      { name: "White", hex: "#FFFFFF", use: "Cards on paper." },
    ],
  },
  {
    title: "Neutrals",
    note: "For hierarchy, borders and supporting text.",
    swatches: [
      { name: "Mute", hex: "#5B6470", use: "Secondary text.", dark: true },
      { name: "Haze", hex: "#7A8494", use: "Quiet supporting text." },
      { name: "Dim", hex: "#A3ABB8", use: "Disabled and tertiary text." },
      { name: "Rule", hex: "#C9CFD8", use: "Dividers and outlines." },
      { name: "Line", hex: "#E3E6EB", use: "Hairlines on cards." },
      { name: "Night", hex: "#2A313C", use: "Raised surfaces on ink.", dark: true },
    ],
  },
  {
    title: "Accent and status",
    note: "Emerald marks what is allowed or active. Red and amber appear only when something is blocked or waiting.",
    swatches: [
      { name: "Emerald", hex: "#0A7C59", use: "The accent on light: active, approved, links.", dark: true },
      { name: "Emerald on dark", hex: "#46D9A4", use: "The accent on ink." },
      { name: "Emerald tint", hex: "#E7F2EE", use: "Background of approved and active labels." },
      { name: "Alert", hex: "#B42318", use: "Blocked. Never for decoration.", dark: true },
      { name: "Alert tint", hex: "#FDECEA", use: "Background of blocked labels." },
      { name: "Caution", hex: "#B54708", use: "Waiting for review.", dark: true },
      { name: "Caution tint", hex: "#FEF3E2", use: "Background of review labels." },
    ],
  },
  {
    title: "Dark theme",
    note: "Keep the contrast between cards and the page.",
    swatches: [
      { name: "Dark background", hex: "#0B0E14", use: "The app canvas.", dark: true },
      { name: "Dark card", hex: "#12161F", use: "Raised surfaces.", dark: true },
      { name: "Card hover", hex: "#171D28", use: "Interactive surfaces.", dark: true },
      { name: "Dark subtle", hex: "#181F2C", use: "Nested surfaces.", dark: true },
      { name: "Dark border", hex: "#1E2532", use: "Dividers in the dark theme.", dark: true },
    ],
  },
];

const traits = [
  { t: "Calm", m: "Reads as something under control, never alarmed.", s: "Generous space, one accent colour, alert colours only when something needs attention." },
  { t: "Exact", m: "Names the number, the rule and the limit.", s: "Stablecoin amounts, plain-language rules, monospace type for values." },
  { t: "Candid", m: "States its limits openly.", s: "An honest-edges section, no overclaiming, a label on any simulated interface." },
];

const principles = [
  { t: "Say the rule, not the feeling.", m: "“Up to $50 a day” beats “stay safe”." },
  { t: "Plain over clever.", m: "Short sentences, under about 20 words. Favour the verbs that match the product: set, sign, propose, veto, revoke." },
  { t: "Be candid about limits.", m: "If version one does not do something, say so. “Transfers only” is a feature of honesty." },
  { t: "Stay calm under attack.", m: "When something is blocked, say what and why. No exclamation marks and no alarm words." },
];

const rewrites = [
  ["Military-grade AI guard keeps your funds 100% safe", "Up to $50 a day, to three approved recipients."],
  ["Transaction rejected!", "Blocked. Recipient not on the list."],
  ["Trustless agent wallet", "An agent wallet with no key to steal."],
  ["No data yet", "Waiting for the agent."],
  ["Your agent was hacked", "The agent tried to overspend. Blocked."],
];

const useWords = ["mandate", "propose", "veto", "revoke", "limit", "bond", "approved recipient", "steer", "agent", "contract", "payment", "transfer", "blocked", "waiting", "frozen"];
const avoidWords = ["trustless", "unhackable", "guaranteed", "100% safe", "revolutionary", "AI-powered", "next-gen", "seamless", "drained", "rugged", "exploited", "nuked"];

const contexts = [
  ["Landing page", "Confident and spare", "Steer your agents, don’t trust them."],
  ["Product interface", "Neutral and exact", "Waiting for your veto. Above the $20 threshold."],
  ["Blocked or frozen states", "Calm and specific", "Agent frozen. Every pending payment is cancelled."],
  ["Social posts", "Plain, one idea per post", "Your AI agent doesn’t need your private key. It needs a bridle."],
  ["Docs and README", "Candid", "v1 limits: transfers only, stablecoin caps, one trust assumption."],
] as const;

const card = "rounded-[20px] border border-line bg-white p-6 dark:border-dark-border dark:bg-dark-card";
const sub = "text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white";
const micro = "font-mono text-[10px] uppercase tracking-[0.13em]";

function Heading({ n, eyebrow, title, copy }: { n: string; eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-10 grid gap-3 md:grid-cols-[130px_1fr] md:gap-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute dark:text-dark-mute">{n} / {eyebrow}</p>
      <div>
        <h2 className="text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white">{title}</h2>
        {copy && <p className="mt-4 max-w-[640px] text-[16px] leading-[1.7] text-mute dark:text-dark-mute">{copy}</p>}
      </div>
    </div>
  );
}

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-paper text-ink dark:bg-dark-bg dark:text-dark-text">
      <Nav />
      <Container>
        {/* Hero */}
        <div className="border-b border-line pb-12 pt-10 dark:border-dark-border sm:pb-16 sm:pt-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute dark:border-dark-border dark:text-dark-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-accent-dark" /> Brand guidelines
            </span>
            <span className="font-mono text-[11px] text-mute dark:text-dark-mute">Last updated November 2026</span>
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-[clamp(40px,7vw,76px)] font-semibold leading-[1] tracking-display text-ink dark:text-white">
                Steer your agents,
                <br />
                <span className="text-haze dark:text-dark-mute">don’t trust them.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-mute dark:text-dark-mute">
                How Bridle looks and sounds. Use this page when you write about Bridle, build with it or draw next to it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#colour" className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-85 dark:bg-white dark:text-ink">
                  Jump to colour <span aria-hidden className="ml-2">↓</span>
                </a>
                <a href="#logo" className="inline-flex min-h-[44px] items-center rounded-full border border-rule px-5 text-[14px] font-semibold text-ink transition-colors hover:bg-white dark:border-dark-border dark:text-white dark:hover:bg-dark-card">
                  Download the logo
                </a>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] bg-ink p-7 text-white sm:p-10">
              <div aria-hidden className="absolute -right-10 -top-12 h-56 w-56 rounded-full border border-white/10" />
              <div aria-hidden className="absolute -right-1 top-8 h-40 w-40 rounded-full border border-white/10" />
              <div className="relative">
                <LogoMark size={60} strokeWidth={3.5} />
                <p className="mt-12 max-w-sm text-[28px] font-semibold leading-[1.15] tracking-heading">
                  You set the limits once.
                  <br />
                  The contract enforces them.
                </p>
                <p className="mt-4 max-w-xs text-[14px] leading-[1.6] text-white/60">You keep the veto.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-12 py-12 lg:grid-cols-[180px_1fr] lg:gap-16 lg:py-16">
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <p className={`mb-4 ${micro} text-mute dark:text-dark-mute`}>On this page</p>
            <nav aria-label="On this page" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {sections.map(([id, label], i) => (
                <a key={id} href={`#${id}`} className="shrink-0 rounded-lg px-3 py-2 text-[14px] text-mute transition-colors hover:bg-white hover:text-ink dark:text-dark-mute dark:hover:bg-dark-card dark:hover:text-white">
                  <span className="mr-2 font-mono text-[10px] text-accent dark:text-accent-dark">0{i + 1}</span>
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-24 sm:space-y-28">
            {/* 01 Essence */}
            <section id="essence" className="scroll-mt-8">
              <Heading n="01" eyebrow="Essence" title="Bridle is the brand of steering." copy="It makes agent autonomy safe by putting a clear, checkable limit around what an agent can do." />
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["What it is", "A NEAR contract that lets an AI agent spend across chains without holding a key, inside a mandate the owner signs once."],
                  ["Who it is for", "Developers and teams who want agents to move money and need to cap the downside, and anyone who must grasp the idea in one glance."],
                  ["The promise", "You set the limits once, the contract enforces them, and you keep the veto."],
                  ["What “Bridle” means", "A bridle does not stop a horse. It lets the rider set the direction while the horse does the work. Here the agent does the work, and your rules set where it can go."],
                ].map(([k, v]) => (
                  <div key={k} className={card}>
                    <p className={`${micro} text-accent dark:text-accent-dark`}>{k}</p>
                    <p className="mt-3 text-[16px] leading-[1.65]">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 max-w-[640px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
                What the brand is not: hype, fear or cute. It avoids drain-and-rug language, horse clipart and anything that sounds like a promise of safety it cannot keep.
              </p>
            </section>

            {/* 02 Personality */}
            <section id="personality" className="scroll-mt-8">
              <Heading n="02" eyebrow="Personality" title="Calm, exact, candid." />
              <div className="rounded-[20px] bg-accent-tint p-6 text-ink dark:bg-[#172B25] dark:text-white sm:p-8">
                <div className="grid gap-8 sm:grid-cols-3">
                  {traits.map((t) => (
                    <div key={t.t}>
                      <p className="text-[26px] font-semibold tracking-[-0.03em]">{t.t}</p>
                      <p className="mt-2 text-[15px] leading-[1.6]">{t.m}</p>
                      <p className="mt-3 border-t border-black/10 pt-3 text-[13.5px] leading-[1.6] opacity-70 dark:border-white/15">{t.s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 03 Voice */}
            <section id="voice" className="scroll-mt-8">
              <Heading n="03" eyebrow="Voice" title="A precise, unhurried colleague." copy="Bridle states the rule, names the limit and never raises its voice." />
              <ol className="grid gap-x-10 gap-y-8 md:grid-cols-2">
                {principles.map((p, i) => (
                  <li key={p.t} className="border-t border-rule pt-5 dark:border-dark-border">
                    <span className="font-mono text-[12px] text-mute dark:text-dark-mute">0{i + 1}</span>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em]">{p.t}</h3>
                    <p className="mt-2 text-[15px] leading-[1.65] text-mute dark:text-dark-mute">{p.m}</p>
                  </li>
                ))}
              </ol>

              <h3 className={`mt-16 ${sub}`}>Before and after</h3>
              <div className="mt-5 overflow-hidden rounded-[20px] border border-line bg-white dark:border-dark-border dark:bg-dark-card">
                <div className={`hidden grid-cols-2 border-b border-line px-6 py-3 ${micro} text-mute dark:border-dark-border dark:text-dark-mute sm:grid`}>
                  <span>Instead of</span>
                  <span>Write</span>
                </div>
                {rewrites.map(([bad, good]) => (
                  <div key={bad} className="grid gap-1 border-b border-line px-6 py-4 last:border-b-0 dark:border-dark-border sm:grid-cols-2 sm:gap-6">
                    <p className="text-[15px] text-mute line-through decoration-rule dark:text-dark-mute dark:decoration-dark-border">{bad}</p>
                    <p className="text-[15px] font-medium">{good}</p>
                  </div>
                ))}
              </div>

              <h3 className={`mt-16 ${sub}`}>Words</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className={card}>
                  <p className={`${micro} text-accent dark:text-accent-dark`}>Use</p>
                  <p className="mt-4 flex flex-wrap gap-2">
                    {useWords.map((w) => (
                      <span key={w} className="rounded-full bg-accent-tint px-3 py-1.5 text-[13px] font-medium text-accent dark:bg-accent-tint/15 dark:text-accent-dark">{w}</span>
                    ))}
                  </p>
                </div>
                <div className={card}>
                  <p className={`${micro} text-bad`}>Avoid</p>
                  <p className="mt-4 flex flex-wrap gap-2">
                    {avoidWords.map((w) => (
                      <span key={w} className="rounded-full bg-bad-tint px-3 py-1.5 text-[13px] font-medium text-bad dark:bg-bad-tint/15">{w}</span>
                    ))}
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-[680px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
                Bridle does not remove trust in the signing network, so any claim of “trustless” would contradict the product’s own limits. They are written out in the <Link href="/docs#status" className="underline underline-offset-4">docs</Link>.
              </p>

              <h3 className={`mt-16 ${sub}`}>Tone by context</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contexts.map(([where, tone, ex]) => (
                  <div key={where} className={card}>
                    <p className={`${micro} text-mute dark:text-dark-mute`}>{where}</p>
                    <p className="mt-2 text-[14px] font-semibold">{tone}</p>
                    <p className="mt-4 border-t border-line pt-4 text-[16px] leading-[1.5] tracking-[-0.01em] dark:border-dark-border">{ex}</p>
                  </div>
                ))}
              </div>

              <h3 className={`mt-16 ${sub}`}>Mechanics</h3>
              <ul className="mt-5 max-w-[680px] space-y-3 text-[15px] leading-[1.65] text-mute dark:text-dark-mute">
                <li>Sentence case everywhere, including buttons and headings.</li>
                <li>“Bridle” is always capitalised.</li>
                <li>Rules use whole dollars (“$50 a day”). Feed amounts show two decimals ($18.00).</li>
                <li>Values, addresses and amounts are set in monospace.</li>
              </ul>
            </section>

            {/* 04 Logo */}
            <section id="logo" className="scroll-mt-8">
              <Heading n="04" eyebrow="Logo" title="One line, two rings." copy="The mark is a single vertical line with two rings: a bridle seen side on. It takes the colour of the text around it. Use the supplied files and do not redraw it." />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid h-56 place-items-center rounded-[22px] border border-line bg-white text-ink">
                  <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in ink on white" />
                </div>
                <div className="grid h-56 place-items-center rounded-[22px] bg-ink text-white">
                  <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in white on ink" />
                </div>
                <div className="grid h-56 place-items-center rounded-[22px] bg-accent text-white">
                  <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in white on emerald" />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className={card}>
                  <p className={`${micro} text-mute dark:text-dark-mute`}>With the wordmark</p>
                  <div className="mt-5 flex items-center gap-3 text-ink dark:text-white">
                    <LogoMark size={36} strokeWidth={4.5} />
                    <Wordmark className="text-[26px]" />
                  </div>
                  <p className="mt-5 text-[14px] leading-[1.65] text-mute dark:text-dark-mute">Set the name in Instrument Sans, semibold, with tight tracking. Always capitalised.</p>
                </div>
                <div className={card}>
                  <p className={`${micro} text-mute dark:text-dark-mute`}>Small sizes</p>
                  <div className="mt-5 flex items-end gap-6 text-ink dark:text-white">
                    <LogoMark size={48} strokeWidth={4.5} />
                    <LogoMark size={32} strokeWidth={5} />
                    <LogoMark size={20} strokeWidth={6} />
                  </div>
                  <p className="mt-5 text-[14px] leading-[1.65] text-mute dark:text-dark-mute">Use a heavier stroke as the mark gets small, so the rings stay open.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className={card}>
                  <p className={`${micro} text-accent dark:text-accent-dark`}>Do</p>
                  <ul className="mt-4 space-y-2.5 text-[14.5px] leading-[1.6]">
                    <li>Use ink, white or emerald, on a background that keeps the strokes clear.</li>
                    <li>Leave space around the mark, at least the width of one ring.</li>
                    <li>Keep the rings and line as drawn.</li>
                  </ul>
                </div>
                <div className={card}>
                  <p className={`${micro} text-bad`}>Do not</p>
                  <ul className="mt-4 space-y-2.5 text-[14.5px] leading-[1.6] text-mute dark:text-dark-mute">
                    <li>Add a horse, a leash, reins or any other illustration.</li>
                    <li>Stretch, rotate, outline or add effects to the mark.</li>
                    <li>Place it over busy photography, or recolour it outside the palette.</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  ["/bridle-mark.svg", "Mark (SVG)"],
                  ["/logo.png", "Logo (PNG)"],
                  ["/bridle-og-final.png", "Social image (PNG)"],
                ].map(([href, label]) => (
                  <a key={href} href={href} download className="inline-flex min-h-[44px] items-center rounded-full border border-rule px-5 text-[14px] font-semibold transition-colors hover:bg-white dark:border-dark-border dark:hover:bg-dark-card">
                    {label} <span aria-hidden className="ml-2">↓</span>
                  </a>
                ))}
              </div>
            </section>

            {/* 05 Colour */}
            <section id="colour" className="scroll-mt-8">
              <Heading n="05" eyebrow="Colour" title="One accent. Alerts only when needed." copy="Mostly ink, paper and grey. Click any swatch to copy its value." />
              <div className="space-y-10">
                {palette.map((g) => (
                  <div key={g.title}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                      <h3 className="text-[18px] font-semibold">{g.title}</h3>
                      <p className="max-w-md text-[13px] leading-[1.5] text-mute dark:text-dark-mute">{g.note}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {g.swatches.map((s) => (
                        <BrandSwatch key={s.name} name={s.name} hex={s.hex} use={s.use} dark={s.dark} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 max-w-[680px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
                Contrast, measured against WCAG: ink on paper 17.6:1, emerald on paper 4.8:1, emerald on white 5.2:1, mute on paper 5.6:1, and emerald-on-dark on ink 10.6:1. Do not rely on colour alone: every status also carries a word.
              </p>
            </section>

            {/* 06 Type */}
            <section id="type" className="scroll-mt-8">
              <Heading n="06" eyebrow="Type" title="Instrument Sans for words. JetBrains Mono for values." />
              <div className="grid gap-4 md:grid-cols-2">
                <div className={card}>
                  <p className={`${micro} text-mute dark:text-dark-mute`}>Instrument Sans · 400 500 600 700</p>
                  <p className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-display">Aa</p>
                  <p className="mt-3 text-[26px] font-semibold leading-[1.1] tracking-heading">Steer your agents.</p>
                  <p className="mt-3 text-[16px] leading-[1.65] text-mute dark:text-dark-mute">Headings are semibold with tight tracking. Body text is regular at a generous line height.</p>
                </div>
                <div className={card}>
                  <p className={`${micro} text-mute dark:text-dark-mute`}>JetBrains Mono · 400 500</p>
                  <p className="mt-5 font-mono text-[44px] leading-[1.02]">Aa</p>
                  <p className="mt-3 font-mono text-[20px]">$18.00 → 0x71C…b87</p>
                  <p className="mt-3 text-[16px] leading-[1.65] text-mute dark:text-dark-mute">For amounts, addresses, hashes, rules and small uppercase labels.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[["Display", "48–72 px", "Hero and page titles"], ["Heading", "24–36 px", "Section and card titles"], ["Body", "14–18 px", "Explanations and interface copy"]].map(([a, b, c]) => (
                  <div key={a} className="rounded-[16px] border border-line p-4 dark:border-dark-border">
                    <p className="text-[12px] text-mute dark:text-dark-mute">{a}</p>
                    <p className="mt-2 font-mono text-[14px]">{b}</p>
                    <p className="mt-1 text-[12px] text-mute dark:text-dark-mute">{c}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 07 Interface */}
            <section id="interface" className="scroll-mt-8">
              <Heading n="07" eyebrow="Interface" title="The interface should feel governed." copy="Clear surfaces, deliberate spacing and explicit states. Each component says what is happening and what happens next." />
              <div className={`${card} sm:p-7`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold">Spending rule</p>
                    <p className="mt-1 text-[12px] text-mute dark:text-dark-mute">Example only, with made-up numbers</p>
                  </div>
                  <span className="rounded-full bg-accent-tint px-3 py-1.5 text-[12px] font-medium text-accent dark:bg-accent-tint/15 dark:text-accent-dark">Active</span>
                </div>
                <div className="mt-7 grid gap-6 sm:grid-cols-3">
                  <div><p className="text-[12px] text-mute dark:text-dark-mute">Daily limit</p><p className="mt-2 font-mono text-[24px]">$250.00</p><p className="mt-1 text-[12px] text-mute dark:text-dark-mute">$84.00 left today</p></div>
                  <div><p className="text-[12px] text-mute dark:text-dark-mute">Per-payment cap</p><p className="mt-2 font-mono text-[24px]">$50.00</p><p className="mt-1 text-[12px] text-mute dark:text-dark-mute">Most one payment can be</p></div>
                  <div><p className="text-[12px] text-mute dark:text-dark-mute">Review threshold</p><p className="mt-2 font-mono text-[24px]">$20.00</p><p className="mt-1 text-[12px] text-mute dark:text-dark-mute">Above this, you can veto</p></div>
                </div>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-line dark:bg-dark-border"><div className="h-full w-2/3 rounded-full bg-accent dark:bg-accent-dark" /></div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5 dark:border-dark-border">
                  <span className="rounded-full border border-line px-3 py-1.5 text-[12px] dark:border-dark-border">3 approved recipients</span>
                  <span className="rounded-full border border-line px-3 py-1.5 text-[12px] dark:border-dark-border">NEAR testnet</span>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className={card}>
                  <p className="text-[14px] font-semibold">Layout</p>
                  <ul className="mt-3 space-y-2 text-[14px] leading-[1.6] text-mute dark:text-dark-mute">
                    <li>Align content to a consistent grid.</li>
                    <li>Use whitespace to set hierarchy.</li>
                    <li>Keep cards and borders quiet.</li>
                    <li>Use rounded corners consistently, not decoratively.</li>
                  </ul>
                </div>
                <div className={card}>
                  <p className="text-[14px] font-semibold">States</p>
                  <ul className="mt-3 space-y-2 text-[14px] leading-[1.6] text-mute dark:text-dark-mute">
                    <li>Show status as a word, not colour alone.</li>
                    <li>Explain why a payment is blocked.</li>
                    <li>Keep proposed, waiting and executed distinct.</li>
                    <li>Keep errors calm and actionable.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 08 In use */}
            <section id="in-use" className="scroll-mt-8">
              <Heading n="08" eyebrow="In use" title="Say what it does not do." copy="One character across product, docs and posts. Adapt the format, not the voice." />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] bg-ink p-6 text-white sm:p-8">
                  <p className={`${micro} text-white/45`}>Website</p>
                  <p className="mt-10 text-[30px] font-semibold leading-[1.1] tracking-heading">Steer your agents,<br />don’t trust them.</p>
                  <p className="mt-4 max-w-xs text-[14px] leading-[1.6] text-white/60">You set the limits once. The contract enforces them.</p>
                </div>
                <div className={`${card} sm:p-8`}>
                  <p className={`${micro} text-mute dark:text-dark-mute`}>Social and developer posts</p>
                  <p className="mt-10 text-[24px] font-semibold leading-[1.2] tracking-heading">Your AI agent doesn’t need your private key. It needs a bridle.</p>
                  <p className="mt-4 text-[14px] leading-[1.6] text-mute dark:text-dark-mute">One idea per post. Be specific about what is live, what runs on a testnet and what is still planned.</p>
                </div>
              </div>
              <div className={`mt-4 ${card} sm:p-7`}>
                <p className="text-[14px] font-semibold">The honest-edges rule</p>
                <p className="mt-2 max-w-2xl text-[14.5px] leading-[1.65] text-mute dark:text-dark-mute">
                  Never claim more than the product does. Say when something runs on a testnet, when a feature is planned and not built, and which trust assumptions remain. Anything that shows a simulated interface carries a label saying so.
                </p>
              </div>
            </section>
          </div>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
