import Link from "next/link";
import { CodeBlock } from "./CopyButton";
import { Container, Eyebrow } from "./Container";

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

export function McpQuickStart() {
  return (
    <section id="mcp-quick-start" className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute -right-36 -top-44 h-[480px] w-[480px] rounded-full border border-white/[0.07]" />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-[320px] w-[320px] rounded-full border border-white/[0.07]" />
      <Container className="relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <Eyebrow tone="dark">For builders · MCP</Eyebrow>
          <h2 className="max-w-[560px] text-[clamp(30px,4.5vw,50px)] font-semibold leading-[1.04] tracking-display text-white">
            Give your agent a route into Bridle.
          </h2>
          <p className="mt-5 max-w-[490px] text-[15px] sm:text-[17px] leading-[1.7] text-[#A3ABB8]">
            Install the MCP server with npx. Your agent can inspect mandates, check a payment and submit a proposal. The contract remains the authority.
          </p>
          <ul className="mt-7 space-y-3 text-[13px] sm:text-sm text-[#C5CBD4]">
            <li className="flex gap-3"><span className="font-mono text-[#46D9A4]">01</span><span>Node.js 22.22.2 or newer</span></li>
            <li className="flex gap-3"><span className="font-mono text-[#46D9A4]">02</span><span>Read-only tools work without an agent key</span></li>
            <li className="flex gap-3"><span className="font-mono text-[#46D9A4]">03</span><span>Use a restricted function-call key for proposals</span></li>
          </ul>
          <Link href="/mcp" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline underline-offset-4 decoration-white/30 hover:decoration-white">
            Full MCP setup guide <span aria-hidden>↗</span>
          </Link>
        </div>
        <div className="min-w-0">
          <CodeBlock code={clientConfig} label="MCP client configuration" />
          <p className="mt-4 max-w-[620px] text-xs leading-relaxed text-[#828D9F]">
            For read-only access, omit BRIDLE_AGENT_ACCOUNT and BRIDLE_AGENT_KEY. For proposals, use a NEAR function-call key restricted to propose_payment on the Bridle contract. Never paste a secret key into an agent prompt or commit it to source control.
          </p>
        </div>
      </Container>
    </section>
  );
}
