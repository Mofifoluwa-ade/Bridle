import type { Metadata } from "next";
import { BrandSwatch } from "@/components/BrandSwatch";
import { Container, Eyebrow } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { LogoMark } from "@/components/Logo";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Brand guidelines",
  description:
    "How Bridle looks and sounds: the line, the mark, the colours, the type and the voice. Steer your agents, don't trust them.",
};

const toc = [
  ["essence", "Essence"],
  ["personality", "Personality"],
  ["voice", "Voice"],
  ["logo", "Logo"],
  ["colour", "Colour"],
  ["type", "Type"],
  ["honest", "Honest edges"],
] as const;

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

const h2 = "text-[clamp(28px,4vw,44px)] font-semibold leading-[1.08] tracking-heading text-ink dark:text-white";
const lead = "mt-4 max-w-[640px] text-[16px] sm:text-[17px] leading-[1.7] text-mute dark:text-dark-mute";
const card = "rounded-[20px] border border-line bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card";

export default function BrandPage() {
  return (
    <main>
      <Nav />
      <Container className="pb-12 pt-14 sm:pb-20 sm:pt-24">
        <Eyebrow>Brand guidelines</Eyebrow>
        <h1 className="max-w-[820px] text-[clamp(36px,6vw,72px)] font-semibold leading-[1.02] tracking-display text-ink dark:text-white">
          Steer your agents,
          <br />
          <span className="text-[#7A8494] dark:text-[#9BA3AF]">don’t trust them.</span>
        </h1>
        <p className={lead}>
          How Bridle looks and sounds. Use this page when you write about Bridle, build with it or draw next to it. Last updated November 2026.
        </p>
        <nav aria-label="On this page" className="mt-10 flex flex-wrap gap-2">
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-paper dark:border-dark-border dark:bg-dark-card dark:text-white dark:hover:bg-dark-card-hover">
              {label}
            </a>
          ))}
        </nav>
      </Container>

      {/* Essence */}
      <Container className="py-12 sm:py-16">
        <section id="essence" aria-labelledby="essence-title" className="scroll-mt-24">
          <Eyebrow>Essence</Eyebrow>
          <h2 id="essence-title" className={h2}>Bridle is the brand of steering.</h2>
          <p className={lead}>It makes agent autonomy safe by putting a clear, checkable limit around what an agent can do.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              ["What it is", "A NEAR contract that lets an AI agent spend across chains without holding a key, inside a mandate the owner signs once."],
              ["Who it is for", "Developers and teams who want agents to move money and need to cap the downside, and anyone who must grasp the idea in one glance."],
              ["The promise", "You set the limits once, the contract enforces them, and you keep the veto."],
              ["Why “Bridle”", "A leash only restrains, but a bridle steers. Humans are the steering wheel and the agent is the engine. It was also chosen over “Leash” because an established LEASH token already exists."],
            ].map(([k, v]) => (
              <div key={k} className={card}>
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">{k}</p>
                <p className="mt-3 text-[16px] leading-[1.65] text-ink dark:text-white">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[640px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
            What the brand is not: hype, fear or cute. It avoids drain-and-rug language, horse clipart and anything that sounds like a promise of safety it cannot keep.
          </p>
        </section>
      </Container>

      {/* Personality */}
      <Container className="py-12 sm:py-16">
        <section id="personality" aria-labelledby="personality-title" className="scroll-mt-24">
          <Eyebrow>Personality</Eyebrow>
          <h2 id="personality-title" className={h2}>Calm, exact, candid.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {traits.map((t) => (
              <div key={t.t} className={card}>
                <h3 className="text-[22px] font-semibold tracking-[-0.025em] text-ink dark:text-white">{t.t}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-ink dark:text-white">{t.m}</p>
                <p className="mt-4 border-t border-line pt-4 text-[13.5px] leading-[1.6] text-mute dark:border-dark-border dark:text-dark-mute">{t.s}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* Voice */}
      <Container className="py-12 sm:py-16">
        <section id="voice" aria-labelledby="voice-title" className="scroll-mt-24">
          <Eyebrow>Voice</Eyebrow>
          <h2 id="voice-title" className={h2}>A precise, unhurried colleague.</h2>
          <p className={lead}>Bridle states the rule, names the limit and never raises its voice.</p>

          <ol className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.t} className="border-t border-rule pt-5 dark:border-dark-border">
                <span className="font-mono text-[12px] text-mute dark:text-dark-mute">0{i + 1}</span>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-ink dark:text-white">{p.t}</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-mute dark:text-dark-mute">{p.m}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-16 text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white">Before and after</h3>
          <div className="mt-5 overflow-hidden rounded-[20px] border border-line bg-white dark:border-dark-border dark:bg-dark-card">
            <div className="hidden grid-cols-2 border-b border-line px-6 py-3 font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:border-dark-border dark:text-dark-mute sm:grid">
              <span>Instead of</span>
              <span>Write</span>
            </div>
            {rewrites.map(([bad, good]) => (
              <div key={bad} className="grid gap-1 border-b border-line px-6 py-4 last:border-b-0 dark:border-dark-border sm:grid-cols-2 sm:gap-6">
                <p className="text-[15px] text-mute line-through decoration-rule dark:text-dark-mute dark:decoration-dark-border">{bad}</p>
                <p className="text-[15px] font-medium text-ink dark:text-white">{good}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-16 text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white">Words</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">Use</p>
              <p className="mt-4 flex flex-wrap gap-2">
                {useWords.map((w) => (
                  <span key={w} className="rounded-full bg-[#E7F2EE] px-3 py-1.5 text-[13px] font-medium text-[#0A7C59] dark:bg-accent-tint dark:text-[#46D9A4]">{w}</span>
                ))}
              </p>
            </div>
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-bad">Avoid</p>
              <p className="mt-4 flex flex-wrap gap-2">
                {avoidWords.map((w) => (
                  <span key={w} className="rounded-full bg-[#FDECEA] px-3 py-1.5 text-[13px] font-medium text-[#B42318] dark:bg-bad-tint/15 dark:text-bad">{w}</span>
                ))}
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-[680px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
            Bridle does not remove trust in the signing network, so any claim of “trustless” would contradict the product’s own honest-edges page.
          </p>

          <h3 className="mt-16 text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white">Tone by context</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contexts.map(([where, tone, ex]) => (
              <div key={where} className={card}>
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">{where}</p>
                <p className="mt-2 text-[14px] font-semibold text-ink dark:text-white">{tone}</p>
                <p className="mt-4 border-t border-line pt-4 text-[16px] leading-[1.5] tracking-[-0.01em] text-ink dark:border-dark-border dark:text-white">{ex}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-16 text-[22px] font-semibold tracking-[-0.02em] text-ink dark:text-white">Mechanics</h3>
          <ul className="mt-5 max-w-[680px] space-y-3 text-[15px] leading-[1.65] text-mute dark:text-dark-mute">
            <li>Sentence case everywhere, including buttons and headings.</li>
            <li>“Bridle” is always capitalised.</li>
            <li>Rules use whole dollars (“$50 a day”). Feed amounts show two decimals ($18.00).</li>
            <li>Values, addresses and amounts are set in monospace.</li>
          </ul>
        </section>
      </Container>

      {/* Logo */}
      <Container className="py-12 sm:py-16">
        <section id="logo" aria-labelledby="logo-title" className="scroll-mt-24">
          <Eyebrow>Logo</Eyebrow>
          <h2 id="logo-title" className={h2}>One line, two rings.</h2>
          <p className={lead}>The mark is a single vertical line with two rings: a bridle seen side on. It takes the colour of the text around it.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="grid h-56 place-items-center rounded-[22px] border border-line bg-white text-ink">
              <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in ink on white" />
            </div>
            <div className="grid h-56 place-items-center rounded-[22px] bg-ink text-white">
              <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in white on ink" />
            </div>
            <div className="grid h-56 place-items-center rounded-[22px] bg-[#0A7C59] text-white">
              <LogoMark size={88} strokeWidth={4.5} title="Bridle mark in white on emerald" />
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">With the wordmark</p>
              <div className="mt-5 flex items-center gap-3 text-ink dark:text-white">
                <LogoMark size={36} strokeWidth={4.5} />
                <span className="text-[26px] font-semibold tracking-[-0.03em]">Bridle</span>
              </div>
              <p className="mt-5 text-[14px] leading-[1.65] text-mute dark:text-dark-mute">Set the name in Instrument Sans, semibold, with tight tracking. Always capitalised.</p>
            </div>
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">Small sizes</p>
              <div className="mt-5 flex items-end gap-6 text-ink dark:text-white">
                <LogoMark size={48} strokeWidth={4.5} />
                <LogoMark size={32} strokeWidth={5} />
                <LogoMark size={20} strokeWidth={6} />
              </div>
              <p className="mt-5 text-[14px] leading-[1.65] text-mute dark:text-dark-mute">Use a heavier stroke as the mark gets small, so the rings stay open.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent dark:text-accent-dark">Do</p>
              <ul className="mt-4 space-y-2.5 text-[14.5px] leading-[1.6] text-ink dark:text-white">
                <li>Use ink, white or emerald, on a background that keeps the strokes clear.</li>
                <li>Leave space around the mark, at least the width of one ring.</li>
                <li>Keep the rings and line as drawn.</li>
              </ul>
            </div>
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-bad">Do not</p>
              <ul className="mt-4 space-y-2.5 text-[14.5px] leading-[1.6] text-mute dark:text-dark-mute">
                <li>Add a horse, a leash or any other illustration.</li>
                <li>Stretch, rotate, outline or add effects to the mark.</li>
                <li>Recolour it outside the palette below.</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              ["/bridle-mark.svg", "Mark (SVG)"],
              ["/logo.png", "Logo (PNG)"],
              ["/bridle-og-final.png", "Social image (PNG)"],
            ].map(([href, label]) => (
              <a key={href} href={href} download className="inline-flex min-h-[44px] items-center rounded-full border border-rule px-5 text-[14px] font-semibold text-ink transition-colors hover:bg-white dark:border-dark-border dark:text-white dark:hover:bg-dark-card">
                {label} <span aria-hidden className="ml-2">↓</span>
              </a>
            ))}
          </div>
        </section>
      </Container>

      {/* Colour */}
      <Container className="py-12 sm:py-16">
        <section id="colour" aria-labelledby="colour-title" className="scroll-mt-24">
          <Eyebrow>Colour</Eyebrow>
          <h2 id="colour-title" className={h2}>One accent. Alerts only when needed.</h2>
          <p className={lead}>Mostly ink, paper and grey. Emerald marks what is allowed or active. Red and amber appear only when something is blocked or waiting. Click a swatch to copy its value.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <BrandSwatch name="Ink" hex="#0E1116" use="Text, dark surfaces, the primary button." dark />
            <BrandSwatch name="Paper" hex="#F6F7F9" use="The page background." />
            <BrandSwatch name="White" hex="#FFFFFF" use="Cards on paper." />
            <BrandSwatch name="Emerald" hex="#0A7C59" use="The accent on light: active, approved, links." dark />
            <BrandSwatch name="Emerald on dark" hex="#46D9A4" use="The accent on ink." />
            <BrandSwatch name="Mute" hex="#5B6470" use="Secondary text." dark />
            <BrandSwatch name="Rule" hex="#C9CFD8" use="Dividers and outlines." />
            <BrandSwatch name="Line" hex="#E3E6EB" use="Hairlines on cards." />
            <BrandSwatch name="Alert" hex="#B42318" use="Blocked. Never for decoration." dark />
            <BrandSwatch name="Caution" hex="#B54708" use="Waiting for review." dark />
            <BrandSwatch name="Emerald tint" hex="#E7F2EE" use="Background of approved and active labels." />
            <BrandSwatch name="Night" hex="#2A313C" use="Raised surfaces on ink." dark />
          </div>
          <p className="mt-6 max-w-[680px] text-[14px] leading-[1.7] text-mute dark:text-dark-mute">
            Contrast, measured against WCAG: ink on paper 17.6:1, emerald on paper 4.8:1, emerald on white 5.2:1, mute on paper 5.6:1, and emerald-on-dark on ink 10.6:1. Do not rely on colour alone: every status also carries a word.
          </p>
        </section>
      </Container>

      {/* Type */}
      <Container className="py-12 sm:py-16">
        <section id="type" aria-labelledby="type-title" className="scroll-mt-24">
          <Eyebrow>Type</Eyebrow>
          <h2 id="type-title" className={h2}>Instrument Sans for words. JetBrains Mono for values.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">Instrument Sans · 400 500 600 700</p>
              <p className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-display text-ink dark:text-white">Aa</p>
              <p className="mt-3 text-[26px] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white">Steer your agents.</p>
              <p className="mt-3 text-[16px] leading-[1.65] text-mute dark:text-dark-mute">Headings are semibold with tight tracking. Body text is regular at a generous line height.</p>
            </div>
            <div className={card}>
              <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-mute dark:text-dark-mute">JetBrains Mono · 400 500</p>
              <p className="mt-5 font-mono text-[44px] leading-[1.02] text-ink dark:text-white">Aa</p>
              <p className="mt-3 font-mono text-[20px] text-ink dark:text-white">$18.00 → 0x71C…b87</p>
              <p className="mt-3 text-[16px] leading-[1.65] text-mute dark:text-dark-mute">For amounts, addresses, hashes, rules and small uppercase labels.</p>
            </div>
          </div>
        </section>
      </Container>

      {/* Honest edges */}
      <Container className="pb-20 pt-12 sm:pb-28 sm:pt-16">
        <section id="honest" aria-labelledby="honest-title" className="scroll-mt-24">
          <Eyebrow>Honest edges</Eyebrow>
          <h2 id="honest-title" className={h2}>Say what it does not do.</h2>
          <p className={lead}>
            Never claim more than the product does. Say when something runs on a testnet, when a feature is planned and not built, and which trust assumptions remain. Anything that shows a simulated interface carries a label saying so.
          </p>
        </section>
      </Container>
      <Footer />
    </main>
  );
}
