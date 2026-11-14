import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import Link from "next/link";
import { CodeBlock, CopyPromptButton } from "@/components/CopyButton";
import { Container, Eyebrow } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { AGENT_PROMPT } from "@/lib/agentPrompt";

export const metadata: Metadata = ogMeta({
  kind: "MCP server",
  title: "Give your agent a spending rule over MCP",
  sub: "Read limits, check a payment, propose one. Owner actions are never exposed.",
  description: "Let an AI agent read its spending limits, check a payment and propose one through MCP. Owner actions are deliberately not exposed.",
});

const tools = [
  ["list_mandates", "Find the mandates that name you as the agent."],
  ["get_mandate", "Caps, what is left today, review threshold, approved recipients."],
  ["check_payment", "Dry run: allowed, held for review, or blocked, and which rule decides. Sends nothing."],
  ["propose_payment", "Propose a payment. The contract decides. Needs the agent key."],
  ["get_proposal", "Where one proposal stands, and why."],
  ["list_proposals", "Recent proposals for a mandate."],
];

const env = [
  ["BRIDLE_CONTRACT", "Yes", "The NEAR account the contract is deployed to, e.g. bridle.testnet."],
  ["BRIDLE_AGENT_ACCOUNT", "To propose", "The agent's NEAR account."],
  ["BRIDLE_AGENT_KEY", "To propose", "ed25519 secret key for that account. Read only when a payment is proposed."],
  ["BRIDLE_RPC", "No", "Defaults to https://test.rpc.fastnear.com."],
];

const clientConfig = `{
  "mcpServers": {
    "bridle": {
      "command": "npx",
      "args": ["-y", "bridle-mcp"],
      "env": {
        "BRIDLE_CONTRACT": "bridle.testnet",
        "BRIDLE_AGENT_ACCOUNT": "your-agent.testnet",
        "BRIDLE_AGENT_KEY": "ed25519:..."
      }
    }
  }
}`;

const claudeCode = `claude mcp add bridle \\
  -e BRIDLE_CONTRACT=bridle.testnet \\
  -e BRIDLE_AGENT_ACCOUNT=your-agent.testnet \\
  -e BRIDLE_AGENT_KEY=ed25519:... \\
  -- npx -y bridle-mcp`;

const h2 = "text-[clamp(24px,3.4vw,38px)] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white";
const body = "text-[15px] sm:text-base leading-[1.65] text-mute dark:text-dark-mute";
const link = "font-medium text-ink underline underline-offset-4 decoration-rule hover:decoration-current dark:text-white dark:decoration-dark-border";

export default function McpPage() {
  return (
    <main>
      <Nav />
      <Container className="pt-14 sm:pt-24 pb-16 sm:pb-28">
        <Eyebrow>For agents</Eyebrow>
        <h1 className="max-w-[760px] text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] tracking-heading text-ink dark:text-white">
          Give your agent a mandate, over MCP
        </h1>
        <p className={`mt-5 max-w-[640px] text-base sm:text-lg ${body}`}>
          The Bridle MCP server lets an agent read its limits, check a payment before sending it, and propose it. The
          contract decides. Its restricted function-call key can submit proposals to Bridle, but cannot transfer funds.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <CopyPromptButton text={AGENT_PROMPT} label="Copy agent prompt" />
          <a href="/agents.md" className={`text-[15px] ${link}`}>
            Read it as markdown
          </a>
        </div>

        <nav aria-label="MCP setup guide" className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "Install the server", "See the client configuration", "#install-title"],
            ["02", "Choose agent tools", "Understand what each tool can do", "#tools-title"],
            ["03", "Review the guardrails", "See what keys and limits allow", "#limits-title"],
          ].map(([number, title, description, href]) => (
            <a key={number} href={href} className="rounded-2xl border border-line dark:border-dark-border bg-white/70 dark:bg-dark-card/70 p-4 transition-colors hover:border-accent/50">
              <span className="font-mono text-[10px] text-accent dark:text-[#46D9A4]">{number}</span>
              <span className="mt-2 block text-sm font-semibold text-ink dark:text-white">{title}</span>
              <span className="mt-1 block text-xs text-mute dark:text-dark-mute">{description} →</span>
            </a>
          ))}
        </nav>

        <section className="mt-16 sm:mt-20" aria-labelledby="prompt-title">
          <h2 id="prompt-title" className={h2}>What the prompt says</h2>
          <p className={`mt-4 max-w-[640px] ${body}`}>
            This is exactly what the button copies. Paste it into your agent, then set up the server below.
          </p>
          <div className="mt-6">
            <CodeBlock code={AGENT_PROMPT} label="Agent prompt" wrap />
          </div>
        </section>

        <section className="mt-16 sm:mt-20" aria-labelledby="install-title">
          <h2 id="install-title" className={h2}>Set it up</h2>
          <p className={`mt-4 max-w-[640px] ${body}`}>
            The server is the npm package <code className="font-mono text-[13px]">bridle-mcp</code>. It runs locally over stdio and needs Node 22.22.2 or newer. There is nothing to install or build: your client runs it with <code className="font-mono text-[13px]">npx</code>.
          </p>
          <div className="mt-6 grid gap-4">
            <CodeBlock code={clientConfig} label="Claude Desktop, Cursor, most MCP clients" />
            <CodeBlock code={claudeCode} label="Or: Claude Code" />
          </div>
          <p className={`mt-5 max-w-[640px] ${body}`}>
            Without the agent account and key the server is read-only: everything but <code className="font-mono text-[13px]">propose_payment</code> still works. To run from source instead, see the{" "}
            <a className={link} href="https://github.com/Mofifoluwa-ade/Bridle/tree/main/mcp" target="_blank" rel="noopener noreferrer">repo</a>.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-[14.5px]">
              <thead>
                <tr className="border-b border-rule dark:border-dark-border font-mono text-xs uppercase tracking-label text-mute dark:text-dark-mute">
                  <th className="py-2 pr-4 font-medium">Variable</th>
                  <th className="py-2 pr-4 font-medium">Needed</th>
                  <th className="py-2 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {env.map(([k, n, d]) => (
                  <tr key={k} className="border-b border-line dark:border-dark-border align-top">
                    <td className="py-3 pr-4 font-mono text-[13px] text-ink dark:text-white">{k}</td>
                    <td className="py-3 pr-4 text-mute dark:text-dark-mute">{n}</td>
                    <td className="py-3 text-mute dark:text-dark-mute">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 sm:mt-20" aria-labelledby="tools-title">
          <h2 id="tools-title" className={h2}>Six tools</h2>
          <ul className="mt-6 divide-y divide-rule dark:divide-dark-border border-y border-rule dark:border-dark-border">
            {tools.map(([name, desc]) => (
              <li key={name} className="grid gap-1 py-4 sm:grid-cols-[190px_1fr] sm:gap-6">
                <span className="font-mono text-[13.5px] text-ink dark:text-white">{name}</span>
                <span className={`text-[15px] ${body}`}>{desc}</span>
              </li>
            ))}
          </ul>
          <p className={`mt-5 max-w-[640px] ${body}`}>
            Amounts are decimal USDC (<code className="font-mono text-[13px]">18.50</code>). The server converts to the contract&apos;s smallest unit.
          </p>
        </section>

        <section className="mt-16 sm:mt-20" aria-labelledby="limits-title">
          <h2 id="limits-title" className={h2}>What an agent cannot do</h2>
          <p className={`mt-4 max-w-[680px] ${body}`}>
            There are no tools to create, loosen, revoke or veto a mandate, flag a payment, or withdraw a bond. Those
            are owner actions, and a test fails if one is ever added. An agent cannot widen its own limits, add a
            recipient, or send to anyone off the approved list.
          </p>
          <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white">The agent key</h3>
          <p className={`mt-3 max-w-[680px] ${body}`}>
            <code className="font-mono text-[13px]">propose_payment</code> is a NEAR transaction signed by the agent
            account. Use a function-call access key limited to <code className="font-mono text-[13px]">propose_payment</code> on
            the Bridle contract: it identifies the agent and cannot move funds. Put it in the MCP config yourself, not
            in a chat.
          </p>
          <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-ink dark:text-white">Where this stands</h3>
          <p className={`mt-3 max-w-[680px] ${body}`}>
            Bridle runs on NEAR testnet. The server is tested against a mock chain and has not yet been run with a
            real agent key against the live contract. A cleared payment is reported as &quot;cleared&quot;, not
            &quot;paid&quot;: Base signing is built and Solana is planned.
          </p>
        </section>

        <section className="mt-16 sm:mt-20" aria-labelledby="more-title">
          <h2 id="more-title" className={h2}>For machines and for reading</h2>
          <ul className={`mt-5 grid gap-2 ${body}`}>
            <li><a className={link} href="/agents.md">/agents.md</a>: setup, tools, amounts and rules on one page</li>
            <li><a className={link} href="/bridle-agent-skill.md">/bridle-agent-skill.md</a>: how an agent should behave inside a mandate</li>
            <li><a className={link} href="/llms.txt">/llms.txt</a>: index for agents</li>
            <li><a className={link} href="https://github.com/Mofifoluwa-ade/Bridle/tree/main/mcp" target="_blank" rel="noopener noreferrer">Server source</a> on GitHub</li>
            <li><Link className={link} href="/docs">Docs</Link>: the tool schema and rules</li>
          </ul>
        </section>
      </Container>
      <Footer />
    </main>
  );
}
