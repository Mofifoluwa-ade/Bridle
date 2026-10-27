"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { CONFIG } from "@/lib/config";

// --- Tab Code Snippets ---
const CODE_SNIPPETS = {
  schema: `{
  "name": "propose_payment",
  "description": "Propose a cross-chain payment. The Bridle smart contract verifies spending rules before signing.",
  "parameters": {
    "type": "object",
    "properties": {
      "mandate_id": {
        "type": "integer",
        "description": "The ID of the active spending rule created by your owner"
      },
      "chain": {
        "type": "string",
        "enum": ["Base", "Solana"],
        "description": "The destination blockchain network"
      },
      "asset": {
        "type": "string",
        "enum": ["USDC"],
        "description": "The currency to send (testnet USDC)"
      },
      "amount": {
        "type": "string",
        "description": "Amount in token smallest units (1 USDC = 1000000)"
      },
      "recipient": {
        "type": "string",
        "description": "Approved recipient wallet address on the destination chain"
      }
    },
    "required": ["mandate_id", "chain", "asset", "amount", "recipient"]
  }
}`,

  python: `import requests
import json

NEAR_RPC = "https://test.rpc.fastnear.com"
CONTRACT_ID = "bridle.testnet"

def propose_payment(agent_account_id, private_key_ed25519, mandate_id, chain, amount_usdc, recipient):
    """
    Calls the Bridle contract on NEAR Testnet to propose a payment.
    The agent supplies only 4 simple fields. Bridle checks limits on-chain.
    """
    # 1 USDC = 1,000,000 smallest units (6 decimals)
    amount_units = str(int(amount_usdc * 1_000_000))
    
    args = {
        "mandate_id": mandate_id,
        "chain": chain,
        "asset": "USDC",
        "amount": amount_units,
        "recipient": recipient
    }
    
    print(f"Agent proposing {amount_usdc} USDC on {chain} to {recipient}...")
    # Submit via NEAR transaction with prepaid gas (100 TGas)
    # If limits are exceeded or recipient is unapproved, transaction reverts immediately.
    return {"status": "submitted", "args": args}

# Example usage:
# propose_payment("myagent.testnet", "ed25519:...", 1, "Base", 15.0, "0x71C...b87")
`,

  typescript: `import { connect, keyStores, KeyPair } from "near-api-js";

const CONTRACT_ID = "bridle.testnet";
const NETWORK_ID = "testnet";

export async function proposePayment({
  agentAccountId,
  agentPrivateKey,
  mandateId,
  chain,
  amountUsdc,
  recipient,
}: {
  agentAccountId: string;
  agentPrivateKey: string;
  mandateId: number;
  chain: "Base" | "Solana";
  amountUsdc: number;
  recipient: string;
}) {
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(
    NETWORK_ID,
    agentAccountId,
    KeyPair.fromString(agentPrivateKey)
  );

  const near = await connect({
    networkId: NETWORK_ID,
    keyStore,
    nodeUrl: "https://test.rpc.fastnear.com",
  });

  const account = await near.account(agentAccountId);

  // 1 USDC = 1,000,000 smallest units (6 decimals)
  const amountUnits = Math.round(amountUsdc * 1_000_000).toString();

  const outcome = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "propose_payment",
    args: {
      mandate_id: mandateId,
      chain,
      asset: "USDC",
      amount: amountUnits,
      recipient,
    },
    gas: "100000000000000", // 100 Tgas
    attachedDeposit: "0",
  });

  console.log("Proposal recorded:", outcome.transaction.hash);
  return outcome;
}
`,

  langchain: `import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Register Bridle as a standard tool in LangChain, ElizaOS, or OpenAI Agents:
export const bridlePaymentTool = new DynamicStructuredTool({
  name: "send_payment",
  description:
    "Sends a payment through Bridle. Safe to call: contract enforces spending limits and allowlists.",
  schema: z.object({
    mandate_id: z.number().describe("Your assigned rule ID"),
    chain: z.enum(["Base", "Solana"]).describe("Target chain"),
    amount_usdc: z.number().describe("Dollar amount in USDC, e.g. 10.5"),
    recipient: z.string().describe("Approved destination address"),
  }),
  func: async ({ mandate_id, chain, amount_usdc, recipient }) => {
    // Calls Bridle propose_payment contract method
    return \`Payment request for \${amount_usdc} USDC submitted to Bridle.\`;
  },
});
`,

  cli: `# Quick test via NEAR CLI:
near contract call-function as-transaction bridle.testnet propose_payment \\
  json-args '{"mandate_id":1,"chain":"Base","asset":"USDC","amount":"10000000","recipient":"0x000000000000000000000000000000000000dEaD"}' \\
  prepaid-gas '100 Tgas' attached-deposit '0 NEAR' \\
  sign-as myagent.testnet network-config testnet sign-with-keychain send
`,
};

// --- Navigation Items ---
const NAV_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { id: "overview", label: "Overview & What is Bridle" },
      { id: "quickstart", label: "3-Minute Quickstart" },
      { id: "core-concepts", label: "Core Concepts Simplified" },
    ],
  },
  {
    title: "AI Agent Integration",
    items: [
      { id: "agent-architecture", label: "How Agents Spend (Zero Keys)" },
      { id: "tool-schema", label: "Agent Tool Schema" },
      { id: "code-examples", label: "Python, TS & LangChain Code" },
    ],
  },
  {
    title: "Spending Rules & Limits",
    items: [
      { id: "spending-rules", label: "Rule Structure & Caps" },
      { id: "approved-recipients", label: "Approved Recipients" },
      { id: "delayed-loosening", label: "Instant Tightening vs Delay" },
    ],
  },
  {
    title: "Safety & Community Watch",
    items: [
      { id: "review-delay", label: "Review Delay & Safety Pause" },
      { id: "security-deposit", label: "Security Deposits (Bond)" },
      { id: "reviewer-rewards", label: "Reviewer Rewards & Economics" },
      { id: "emergency-freeze", label: "Emergency Freeze & Veto" },
    ],
  },
  {
    title: "Smart Contract Reference",
    items: [
      { id: "contract-overview", label: "Contract Details & Network" },
      { id: "owner-methods", label: "Owner Methods" },
      { id: "agent-methods", label: "Agent Methods" },
      { id: "reviewer-methods", label: "Reviewer & Public Methods" },
      { id: "view-queries", label: "Read-Only View Queries" },
    ],
  },
  {
    title: "Reference & FAQ",
    items: [
      { id: "threat-model", label: "Safety Guarantees" },
      { id: "error-codes", label: "Error Messages & Fixes" },
      { id: "faq", label: "Frequently Asked Questions" },
    ],
  },
];

export default function DocsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeCodeTab, setActiveCodeTab] = useState<keyof typeof CODE_SNIPPETS>("schema");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bridle_theme") as "light" | "dark" | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      } else if (document.documentElement.classList.contains("dark")) {
        setTheme("dark");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("bridle_theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Scrollspy to update active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    const ids = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return NAV_SECTIONS;
    const q = searchQuery.toLowerCase();
    return NAV_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      ),
    })).filter((sec) => sec.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-paper dark:bg-dark-bg text-ink dark:text-dark-text transition-colors">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-line dark:border-dark-border bg-white/90 dark:bg-dark-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-mute dark:text-dark-mute hover:bg-paper dark:hover:bg-dark-card-hover"
              aria-label="Toggle navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2.5 text-ink dark:text-white">
              <LogoMark size={24} />
              <Wordmark className="text-[19px]" />
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border border-line dark:border-dark-border bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute">
                Documentation
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-mono rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3.5 py-1.5 pl-8 text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
              <svg
                className="absolute left-2.5 top-2 text-mute dark:text-dark-mute"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-ink text-white dark:bg-white dark:text-ink hover:opacity-90 transition-opacity"
            >
              Launch App
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Sticky Sidebar Nav */}
          <aside
            className={`lg:col-span-3 lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6 pr-2 ${
              mobileMenuOpen
                ? "fixed inset-0 top-16 z-30 bg-white dark:bg-dark-card p-6 overflow-y-auto block"
                : "hidden lg:block"
            }`}
          >
            <div className="block lg:hidden mb-4">
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-mono rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3.5 py-2 text-ink dark:text-white"
              />
            </div>

            {filteredSections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-mute dark:text-dark-mute">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            active
                              ? "bg-accent/10 text-accent dark:text-[#46D9A4] font-semibold"
                              : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="pt-6 border-t border-line dark:border-dark-border space-y-2">
              <Link
                href="/app/agent"
                className="block text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
              >
                Test Console &rarr;
              </Link>
              <a
                href="https://testnet.nearblocks.io/address/bridle.testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
              >
                NEAR Testnet Explorer &rarr;
              </a>
            </div>
          </aside>

          {/* Center Main Documentation */}
          <main className="lg:col-span-9 space-y-16">
            
            {/* HERO / OVERVIEW */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border border-line dark:border-dark-border bg-white dark:bg-dark-card text-accent dark:text-[#46D9A4]">
                <span>Near Testnet: bridle.testnet</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-heading text-ink dark:text-white">
                Bridle Documentation
              </h1>
              <p className="text-lg leading-relaxed text-mute dark:text-dark-mute max-w-3xl">
                Bridle is an on-chain safety harness that lets AI agents pay for APIs, compute, and services across blockchains without ever touching or holding a private key.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <p className="font-mono text-xs uppercase text-accent dark:text-[#46D9A4] font-semibold">Zero Keys</p>
                  <p className="mt-1 text-xs text-mute dark:text-dark-mute">
                    Your agent never handles private keys. Prompt injection cannot drain your funds.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <p className="font-mono text-xs uppercase text-accent dark:text-[#46D9A4] font-semibold">Hard Contract Rules</p>
                  <p className="mt-1 text-xs text-mute dark:text-dark-mute">
                    You set spending limits once on NEAR. The contract strictly validates every transfer.
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <p className="font-mono text-xs uppercase text-accent dark:text-[#46D9A4] font-semibold">Multi-Chain Signing</p>
                  <p className="mt-1 text-xs text-mute dark:text-dark-mute">
                    Executes transfers to Base (EVM) and Solana using NEAR Chain Signatures MPC.
                  </p>
                </div>
              </div>
            </section>

            {/* 3-MINUTE QUICKSTART */}
            <section id="quickstart" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Get Started
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  3-Minute Quickstart
                </h2>
              </div>
              <p className="text-sm text-mute dark:text-dark-mute leading-relaxed">
                Follow these 4 simple steps to connect an AI agent to Bridle on NEAR Testnet:
              </p>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-xs font-mono font-bold">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-ink dark:text-white">
                      Connect your owner wallet
                    </h3>
                  </div>
                  <p className="text-xs text-mute dark:text-dark-mute pl-9">
                    Open the <Link href="/app" className="underline text-accent dark:text-[#46D9A4]">Bridle App</Link> and connect your testnet NEAR account (e.g. yourname.testnet).
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-xs font-mono font-bold">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-ink dark:text-white">
                      Create a spending rule for your AI agent
                    </h3>
                  </div>
                  <p className="text-xs text-mute dark:text-dark-mute pl-9">
                    Navigate to <Link href="/app/mandates/new" className="underline text-accent dark:text-[#46D9A4]">New Rule</Link>. Enter your agent&apos;s NEAR address (e.g. agent.testnet), specify approved recipient addresses on Base or Solana, and choose daily and per-payment caps (e.g. $25 per payment, $50 per day).
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-xs font-mono font-bold">
                      3
                    </span>
                    <h3 className="text-sm font-semibold text-ink dark:text-white">
                      Deposit security funds (Agent bond)
                    </h3>
                  </div>
                  <p className="text-xs text-mute dark:text-dark-mute pl-9">
                    The agent deposits testnet NEAR as a security deposit (e.g. 1 NEAR). This deposit stays locked to guarantee honest behavior and can be withdrawn whenever the rule is retired.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white dark:bg-white dark:text-ink text-xs font-mono font-bold">
                      4
                    </span>
                    <h3 className="text-sm font-semibold text-ink dark:text-white">
                      Send a test payment from the agent
                    </h3>
                  </div>
                  <p className="text-xs text-mute dark:text-dark-mute pl-9">
                    Use our <Link href="/app/agent" className="underline text-accent dark:text-[#46D9A4]">Test Console</Link> or the Python / TypeScript SDK code below. The contract validates all limits, pausing or approving transactions in real time.
                  </p>
                </div>
              </div>
            </section>

            {/* CORE CONCEPTS SIMPLIFIED */}
            <section id="core-concepts" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Vocabulary
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Core Concepts in Plain English
                </h2>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line dark:border-dark-border font-mono text-mute dark:text-dark-mute bg-paper dark:bg-dark-bg">
                    <tr>
                      <th className="p-4">Concept</th>
                      <th className="p-4">What it means</th>
                      <th className="p-4">Why it matters</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line dark:divide-dark-border">
                    <tr>
                      <td className="p-4 font-semibold text-ink dark:text-white">Spending Rule (Mandate)</td>
                      <td className="p-4 text-mute dark:text-dark-mute">The boundary signed by the owner defining max spends and allowed recipients.</td>
                      <td className="p-4 text-mute dark:text-dark-mute">The contract blocks any request outside these bounds.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-ink dark:text-white">Review Delay (Challenge Window)</td>
                      <td className="p-4 text-mute dark:text-dark-mute">A short cooling period (e.g. 10 minutes) for payments exceeding a pause threshold.</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Gives you time to review or cancel payments before they finalize.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-ink dark:text-white">Security Deposit (Bond)</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Testnet NEAR deposited by the agent to enable high-value proposals.</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Slashed if the agent acts maliciously, rewarding the reviewer who caught it.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-ink dark:text-white">Reviewer (Watcher)</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Any community participant who inspects pending paused transactions.</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Earns 40% of the agent&apos;s security deposit for discovering bad behavior.</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-ink dark:text-white">Emergency Freeze (Revoke)</td>
                      <td className="p-4 text-mute dark:text-dark-mute">A one-click action that immediately stops the agent from making any further payments.</td>
                      <td className="p-4 text-mute dark:text-dark-mute">Executes instantly on the blockchain to protect all funds.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* AI AGENT ARCHITECTURE */}
            <section id="agent-architecture" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Architecture
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  How AI Agents Spend (Zero Private Keys)
                </h2>
              </div>
              <p className="text-sm text-mute dark:text-dark-mute leading-relaxed">
                When an AI agent runs autonomously, giving it a raw private key is a dangerous security liability. A single prompt injection or bug can siphon all stored assets.
              </p>

              <div className="p-6 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  The Bridle Security Model
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-accent dark:text-[#46D9A4]">1. Agent Proposes</p>
                    <p className="text-mute dark:text-dark-mute">
                      The agent submits only 4 simple fields: chain, asset, amount, and recipient. It never builds transaction calldata.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-accent dark:text-[#46D9A4]">2. Contract Evaluates</p>
                    <p className="text-mute dark:text-dark-mute">
                      The NEAR smart contract checks daily caps, per-transaction caps, allowlists, and cooling delays. Reverts if violated.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-accent dark:text-[#46D9A4]">3. MPC Signatures</p>
                    <p className="text-mute dark:text-dark-mute">
                      NEAR Chain Signatures threshold network signs the raw transaction bytes and broadcasts them to Base or Solana.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* AGENT TOOL SCHEMA & CODE EXAMPLES */}
            <section id="tool-schema" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Developer Integration
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Agent Tool Schema & Code Examples
                </h2>
              </div>
              <p className="text-sm text-mute dark:text-dark-mute leading-relaxed">
                Provide this tool definition to OpenAI models, Claude, LangChain, or custom agents. The agent uses function calling to propose payments safely.
              </p>

              {/* Code Tab Switcher */}
              <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-line dark:border-dark-border px-4 py-2.5 bg-paper dark:bg-dark-bg">
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        ["schema", "JSON Schema"],
                        ["python", "Python SDK"],
                        ["typescript", "TypeScript / Node"],
                        ["langchain", "LangChain Tool"],
                        ["cli", "NEAR CLI"],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setActiveCodeTab(k)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors ${
                          activeCodeTab === k
                            ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold"
                            : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(CODE_SNIPPETS[activeCodeTab], activeCodeTab)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white border border-line dark:border-dark-border bg-white dark:bg-dark-card transition-colors"
                  >
                    {copiedKey === activeCodeTab ? (
                      <span className="text-accent dark:text-[#46D9A4]">Copied</span>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="p-5 overflow-x-auto bg-[#0E1116] text-[#E5E7EB]">
                  <pre className="font-mono text-xs leading-relaxed whitespace-pre">
                    {CODE_SNIPPETS[activeCodeTab]}
                  </pre>
                </div>
              </div>
            </section>

            {/* SPENDING RULES & LIMITS */}
            <section id="spending-rules" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Rule Enforcement
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Spending Limits & Allowed Recipients
                </h2>
              </div>
              <p className="text-sm text-mute dark:text-dark-mute leading-relaxed">
                Every spending rule defines boundaries that are enforced by smart contract logic:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Per-Payment Limit
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    The maximum amount the agent can send in a single transaction (e.g. $25 USDC). Any proposal requesting more than this amount is instantly rejected by the smart contract.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Daily Limit
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    The maximum cumulative amount the agent can spend in a single day (e.g. $50 USDC). The internal counter automatically resets at 00:00 UTC daily.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Pause Payments Above Threshold
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    Amounts under this threshold execute immediately. Amounts above this threshold enter a safety review delay, requiring the agent&apos;s security deposit and giving you time to review.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Approved Recipients Only
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    The agent can only send money to addresses on your approved recipient list. Any request to an unknown or unlisted address is stopped and logged immediately.
                  </p>
                </div>
              </div>

              {/* Delayed Loosening */}
              <div id="delayed-loosening" className="p-6 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-3">
                <div className="flex items-center gap-2 text-accent dark:text-[#46D9A4]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Asymmetric Security: Delayed Loosening, Instant Tightening
                  </h3>
                </div>
                <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                  To protect your funds against compromised sessions or stolen credentials, Bridle implements asymmetric rule changes:
                </p>
                <ul className="text-xs text-mute dark:text-dark-mute space-y-2 list-disc pl-5">
                  <li>
                    <strong className="text-ink dark:text-white">Tightening limits or stopping a rule takes effect immediately:</strong> Lowering caps, shortening pause thresholds, or freezing a rule happens in the exact block you sign.
                  </li>
                  <li>
                    <strong className="text-ink dark:text-white">Loosening limits requires a safety delay:</strong> Raising a spending cap or adding new recipients is queued for one challenge window delay. This ensures an attacker cannot steal access and flash-drain funds before you notice.
                  </li>
                </ul>
              </div>
            </section>

            {/* SAFETY & COMMUNITY WATCH */}
            <section id="review-delay" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Safety System
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Review Delay, Security Deposits & Community Watch
                </h2>
              </div>
              <p className="text-sm text-mute dark:text-dark-mute leading-relaxed">
                Bridle pairs human oversight with economic incentives so payments can run safely without requiring human intervention on every single micro-payment.
              </p>

              {/* Economic Model Breakdown */}
              <div id="reviewer-rewards" className="p-6 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Game-Theoretic Reviewer Economics
                </h3>
                <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                  Anyone in the community can monitor paused transactions on the <Link href="/app/watch" className="underline text-accent dark:text-[#46D9A4]">Watch</Link> page. To prevent false alarms and self-dealing attacks, the economics are strictly balanced:
                </p>

                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-ink dark:text-white">Reporting Fee</p>
                    <p className="text-mute dark:text-dark-mute">
                      A reviewer stakes 10% of the agent bond to flag a payment. This stops spamming of false flags.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-accent dark:text-[#46D9A4]">Owner Confirms Flag</p>
                    <p className="text-mute dark:text-dark-mute">
                      The agent&apos;s bond is slashed: <strong>40% to reviewer</strong>, <strong>30% to owner</strong>, and <strong>30% burned</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border space-y-1">
                    <p className="font-mono font-semibold text-ink dark:text-white">Dismissed Flag</p>
                    <p className="text-mute dark:text-dark-mute">
                      If the owner dismisses a false report, the reviewer&apos;s stake is forfeited directly to the agent.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-accent/5 dark:bg-accent/10 space-y-1 text-xs">
                  <p className="font-semibold text-accent dark:text-[#46D9A4]">Fail-Closed Safety Guarantee</p>
                  <p className="text-mute dark:text-dark-mute">
                    If a payment is flagged as suspicious and the owner takes no action, the payment expires unexecuted. The system always prefers a missed payment over an unauthorized transfer.
                  </p>
                </div>
              </div>

              {/* Emergency Freeze */}
              <div id="emergency-freeze" className="p-6 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-3">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Emergency Freeze & One-Click Veto
                </h3>
                <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                  As the owner, you always hold ultimate authority:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg space-y-1">
                    <strong className="text-ink dark:text-white">One-Click Payment Cancellation</strong>
                    <p className="text-mute dark:text-dark-mute">
                      You can cancel any paused payment before the review delay expires with zero penalty.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-paper dark:bg-dark-bg space-y-1">
                    <strong className="text-ink dark:text-white">Emergency Rule Freeze</strong>
                    <p className="text-mute dark:text-dark-mute">
                      Freezing a rule immediately and permanently revokes the agent&apos;s ability to request any further transactions.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SMART CONTRACT REFERENCE */}
            <section id="contract-overview" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  API Reference
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Smart Contract Reference (NEAR Testnet)
                </h2>
              </div>

              <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-3 text-xs">
                <div className="grid sm:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-mute dark:text-dark-mute">Contract ID: </span>
                    <strong className="text-ink dark:text-white">{CONFIG.contractId || "bridle.testnet"}</strong>
                  </div>
                  <div>
                    <span className="text-mute dark:text-dark-mute">Network: </span>
                    <strong className="text-ink dark:text-white">NEAR Testnet</strong>
                  </div>
                  <div>
                    <span className="text-mute dark:text-dark-mute">RPC Endpoint: </span>
                    <span className="text-ink dark:text-white">{CONFIG.rpc}</span>
                  </div>
                  <div>
                    <span className="text-mute dark:text-dark-mute">Explorer: </span>
                    <a
                      href={`${CONFIG.explorer}/address/${CONFIG.contractId || "bridle.testnet"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent dark:text-[#46D9A4] underline"
                    >
                      View on NearBlocks &rarr;
                    </a>
                  </div>
                </div>
              </div>

              {/* Owner Methods */}
              <div id="owner-methods" className="space-y-3">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Owner Methods
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line dark:border-dark-border font-mono text-mute dark:text-dark-mute bg-paper dark:bg-dark-bg">
                      <tr>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Arguments</th>
                        <th className="p-3.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-border font-mono">
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">create_mandate</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">agent, chains, assets, recipients, per_tx_cap, daily_cap, cooling_threshold, challenge_window, bond, expiry</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Creates a new spending rule with caps and allowlists.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">veto</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">proposal_id</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Cancels a pending payment proposal before its window finishes.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">resolve_flag</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">proposal_id, confirmed (bool)</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Confirms suspicious activity (slashes agent) or dismisses it.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">update_limits</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">mandate_id, per_tx_cap, daily_cap, cooling_threshold, challenge_window</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Applies tighter limits now, queues looser limits.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">revoke</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">mandate_id</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Immediately stops the spending rule forever.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Agent Methods */}
              <div id="agent-methods" className="space-y-3">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Agent Methods
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line dark:border-dark-border font-mono text-mute dark:text-dark-mute bg-paper dark:bg-dark-bg">
                      <tr>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Arguments</th>
                        <th className="p-3.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-border font-mono">
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">post_bond</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">mandate_id (attached deposit in NEAR)</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Deposits the required security deposit to activate the rule.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">propose_payment</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">mandate_id, chain, asset, amount, recipient</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Requests a payment. Evaluated against all spending rules.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">withdraw_bond</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">mandate_id</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Withdraws security deposit when a mandate is expired or revoked.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviewer & Public Methods */}
              <div id="reviewer-methods" className="space-y-3">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Reviewer & Public Methods
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line dark:border-dark-border font-mono text-mute dark:text-dark-mute bg-paper dark:bg-dark-bg">
                      <tr>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Caller</th>
                        <th className="p-3.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-border font-mono">
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">flag(proposal_id)</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Any Watcher</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Flags a pending payment as suspicious (requires 10% bond stake).</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">execute(proposal_id)</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Anyone</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Clears a proposal after its review delay successfully expires.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">expire_flag(proposal_id)</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Anyone</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Safely closes an unanswered flag after the owner response window.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">apply_pending_limits</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Anyone</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Applies queued limit increases once their delay has passed.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">timeout_signing(proposal_id)</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Anyone</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Expires any proposal stuck in Signing for over 1 hour to release agent bond.</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 font-bold text-ink dark:text-white">report_failure(proposal_id, reason)</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">Executor</td>
                        <td className="p-3.5 font-sans text-mute dark:text-dark-mute">Reports execution failure on destination chain, cancelling proposal and refunding budget.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Methods */}
              <div id="view-queries" className="space-y-3">
                <h3 className="text-sm font-semibold text-ink dark:text-white">
                  Read-Only View Queries (No Gas / No Wallet Required)
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-line dark:border-dark-border text-mute dark:text-dark-mute bg-paper dark:bg-dark-bg">
                      <tr>
                        <th className="p-3.5">View Function</th>
                        <th className="p-3.5">Parameters</th>
                        <th className="p-3.5">Returns</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-dark-border">
                      <tr>
                        <td className="p-3.5 text-accent dark:text-[#46D9A4]">get_mandate</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">&#123; mandate_id: number &#125;</td>
                        <td className="p-3.5 text-ink dark:text-white">Mandate object or null</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 text-accent dark:text-[#46D9A4]">list_mandates_for</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">&#123; account_id: string, from, limit &#125;</td>
                        <td className="p-3.5 text-ink dark:text-white">List of Mandates</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 text-accent dark:text-[#46D9A4]">get_proposal</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">&#123; proposal_id: number &#125;</td>
                        <td className="p-3.5 text-ink dark:text-white">Proposal details &amp; status</td>
                      </tr>
                      <tr>
                        <td className="p-3.5 text-accent dark:text-[#46D9A4]">list_proposals</td>
                        <td className="p-3.5 text-mute dark:text-dark-mute">&#123; mandate_id, from, limit &#125;</td>
                        <td className="p-3.5 text-ink dark:text-white">Array of Proposals</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ERROR CODES & FIXES */}
            <section id="error-codes" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Troubleshooting
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Common Error Messages &amp; Fixes
                </h2>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-1">
                  <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    &quot;recipient not in allowlist&quot;
                  </p>
                  <p className="text-xs text-mute dark:text-dark-mute">
                    <strong>Cause:</strong> The agent attempted to pay an address not registered in the spending rule&apos;s approved list.
                    <br />
                    <strong>Fix:</strong> Add the recipient to your approved list when editing the spending rule.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-1">
                  <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    &quot;per_tx_cap exceeded&quot;
                  </p>
                  <p className="text-xs text-mute dark:text-dark-mute">
                    <strong>Cause:</strong> The proposed payment amount is higher than the max allowed per payment.
                    <br />
                    <strong>Fix:</strong> Lower the payment amount or update the spending limit from the rule details screen.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-1">
                  <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    &quot;daily_cap exceeded&quot;
                  </p>
                  <p className="text-xs text-mute dark:text-dark-mute">
                    <strong>Cause:</strong> Total spending today has reached the 24-hour limit.
                    <br />
                    <strong>Fix:</strong> Wait until 00:00 UTC for the counter to reset, or increase the daily cap.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-1">
                  <p className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                    &quot;insufficient agent bond posted&quot;
                  </p>
                  <p className="text-xs text-mute dark:text-dark-mute">
                    <strong>Cause:</strong> Over-threshold payments require a security deposit before requests are accepted.
                    <br />
                    <strong>Fix:</strong> Switch to the agent wallet account and call <code className="font-mono">post_bond</code> (available via the test console banner).
                  </p>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section id="faq" className="scroll-mt-24 space-y-6">
              <div className="space-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-accent dark:text-[#46D9A4] font-semibold">
                  Frequently Asked Questions
                </p>
                <h2 className="text-2xl font-semibold text-ink dark:text-white">
                  Got Questions? We Have Answers.
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Can my AI agent steal my funds if it gets hacked or prompt injected?
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    No. The AI agent never receives private keys. All payment requests pass through the smart contract on NEAR, which checks strict limits on every proposal. An agent cannot create arbitrary transactions, alter destinations, or exceed caps.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    What happens if I am asleep when a suspicious payment is requested?
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    If an over-threshold payment is flagged as suspicious by a community reviewer and you take no action, it automatically expires unexecuted. Funds remain safely in your account. The system fails closed.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Why are payments settled in USDC instead of volatile tokens?
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    Stablecoins allow precise arithmetic in integer units without relying on volatile price oracles that could be manipulated. In future releases, multi-asset options will be introduced.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card space-y-2">
                  <h3 className="text-sm font-semibold text-ink dark:text-white">
                    Which blockchains are supported?
                  </h3>
                  <p className="text-xs text-mute dark:text-dark-mute leading-relaxed">
                    Bridle coordinates payments on NEAR Testnet and signs transactions for Base Sepolia (EVM) and Solana Devnet using NEAR Chain Signatures MPC.
                  </p>
                </div>
              </div>
            </section>

            {/* Bottom Call to Action */}
            <div className="p-8 rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-ink dark:text-white">
                  Ready to test your agent?
                </h3>
                <p className="text-xs text-mute dark:text-dark-mute">
                  Launch the app, create your first spending rule, and run a test payment in under 2 minutes.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/app"
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-ink text-white dark:bg-white dark:text-ink hover:opacity-90 transition-opacity"
                >
                  Open Bridle App &rarr;
                </Link>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
