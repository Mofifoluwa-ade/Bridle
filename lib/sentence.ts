// Plain-language parsing for spending rules and sample payments.
// Pure functions, no imports from the app, so they can be tested on their own.
// Nothing here is sent anywhere: the result only fills in the form fields,
// and the existing validation and contract rules still decide what is allowed.

export type SentenceChain = "Base" | "Solana";

export type RuleDraft = {
  perTx?: string;
  daily?: string;
  threshold?: string;
  windowMin?: string;
  days?: string;
  chains?: SentenceChain[];
  recipientCount?: number;
};

export type Understood = { key: keyof RuleDraft; label: string };

const AMT = String.raw`\$?\s?(\d[\d,]*(?:\.\d+)?)\s?(?:usdc|usd|dollars?)?`;
const NUM_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const clean = (n: string) => n.replace(/,/g, "");
const first = (t: string, patterns: RegExp[]): string | undefined => {
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return m[1];
  }
  return undefined;
};

function chainsIn(t: string): SentenceChain[] {
  if (/\bboth (?:chains|networks)\b/.test(t)) return ["Base", "Solana"];
  const found: { c: SentenceChain; i: number }[] = [];
  const b = t.search(/\bbase\b/);
  const s = t.search(/\bsolana\b|\bsol\b/);
  if (b >= 0) found.push({ c: "Base", i: b });
  if (s >= 0) found.push({ c: "Solana", i: s });
  return found.sort((x, y) => x.i - y.i).map((f) => f.c);
}

/** "Up to $50 a day, to three approved recipients. Pause anything over $20." */
export function parseRule(input: string): { draft: RuleDraft; understood: Understood[] } {
  const t = input.toLowerCase();
  const draft: RuleDraft = {};
  const understood: Understood[] = [];

  const daily = first(t, [
    new RegExp(`${AMT}\\s*(?:a|per|each|every)\\s*day\\b`),
    new RegExp(`${AMT}\\s*/\\s*day\\b`),
    new RegExp(`daily\\s*(?:cap|limit|budget|max(?:imum)?)\\s*(?:of|is|:)?\\s*${AMT}`),
    new RegExp(`${AMT}\\s*daily\\b`),
  ]);
  if (daily) { draft.daily = clean(daily); understood.push({ key: "daily", label: `$${clean(daily)} a day` }); }

  const perTx = first(t, [
    new RegExp(`${AMT}\\s*(?:per|a)\\s*(?:single\\s*)?(?:payment|transaction|transfer|tx|send)\\b`),
    new RegExp(`${AMT}\\s*(?:at a time|each(?!\\s+day))`),
    new RegExp(`(?:max(?:imum)?|at most|no more than)\\s*${AMT}\\s*(?:per|a|for each)\\s*(?:payment|transaction|transfer)`),
  ]);
  if (perTx) { draft.perTx = clean(perTx); understood.push({ key: "perTx", label: `$${clean(perTx)} per payment` }); }

  const threshold = first(t, [
    new RegExp(`(?:pause|hold|review|flag|wait on|check)[^.;]{0,30}?(?:over|above|more than|larger than|greater than|exceeding|beyond)\\s*${AMT}`),
    new RegExp(`(?:over|above|more than|exceeding)\\s*${AMT}[^.;]{0,30}?(?:pause|wait|review|hold|flag)`),
  ]);
  if (threshold) { draft.threshold = clean(threshold); understood.push({ key: "threshold", label: `Pause over $${clean(threshold)}` }); }

  const unit = (n: string, u: string) => (/^h/.test(u) ? Number(n) * 60 : Number(n));
  const win =
    t.match(/(?:for|wait|hold|window of|review(?:ed)? for)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)\b/) ||
    t.match(/(\d+)[- ]?(minutes?|mins?|hours?|hrs?)\s*(?:challenge|review|pause|window|wait|hold)/);
  if (win) {
    const m = unit(win[1], win[2]);
    draft.windowMin = String(m);
    understood.push({ key: "windowMin", label: m % 60 === 0 && m >= 60 ? `${m / 60} h review` : `${m} min review` });
  }

  const days =
    first(t, [/(?:for|expires?\s*in|lasts?|valid for)\s*(\d+)\s*days?\b/, /(\d+)[- ]day\s*(?:rule|mandate|limit)/]) ||
    (/\b(?:for\s+)?a\s+week\b/.test(t) ? "7" : undefined);
  if (days) { draft.days = days; understood.push({ key: "days", label: `${days} days` }); }

  const chains = chainsIn(t);
  if (chains.length) { draft.chains = chains; understood.push({ key: "chains", label: chains.join(" · ") }); }

  const rc = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:approved\s+|allowed\s+|whitelisted\s+|trusted\s+)?(?:recipients?|addresses|payees)\b/);
  if (rc) {
    const n = /^\d+$/.test(rc[1]) ? Number(rc[1]) : NUM_WORDS[rc[1]];
    if (n >= 1 && n <= 10) { draft.recipientCount = n; understood.push({ key: "recipientCount", label: `${n} approved recipient${n === 1 ? "" : "s"}` }); }
  }
  return { draft, understood };
}

export type PaymentDraft = { amount?: string; chain?: SentenceChain; recipient?: string };

/** "Pay $240 to 0xAbc… on Solana" */
export function parsePayment(input: string): PaymentDraft {
  const out: PaymentDraft = {};
  const text = input.trim();
  const lower = text.toLowerCase();
  const evm = text.match(/\b0x[a-fA-F0-9]{40}\b/);
  const sol = text.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);
  if (evm) out.recipient = evm[0];
  else if (sol) out.recipient = sol[0];
  const withoutAddr = lower.replace(/0x[a-f0-9]{40}/g, " ").replace(/\b[1-9a-hj-np-za-km-z]{32,44}\b/g, " ");
  const amt =
    first(withoutAddr, [new RegExp(`(?:pay|send|transfer|wire)\\s*${AMT}`), /\$\s?(\d[\d,]*(?:\.\d+)?)/, new RegExp(`${AMT}\\s*(?:usdc|usd|dollars?)\\b`)]);
  if (amt) out.amount = clean(amt);
  const chains = chainsIn(withoutAddr);
  if (chains.length) out.chain = chains[0];
  else if (evm) out.chain = "Base";
  else if (sol) out.chain = "Solana";
  return out;
}
