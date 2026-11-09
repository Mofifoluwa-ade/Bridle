import Link from "next/link";
import { CodeBlock } from "./CopyButton";
import { Container, Eyebrow } from "./Container";

const config = `{
  "mcpServers": {
    "bridle": {
      "command": "npx",
      "args": ["-y", "bridle-mcp"],
      "env": {
        "BRIDLE_CONTRACT": "bridle.testnet"
      }
    }
  }
}`;

export function McpQuickStart() {
  return (
    <section id="mcp-quick-start" className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[440px] w-[440px] rounded-full border border-white/[0.07]" />
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-[310px] w-[310px] rounded-full border border-white/[0.07]" />
      <Container className="relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:gap-16">
        <div>
          <Eyebrow tone="dark">For builders · MCP</Eyebrow>
          <h2 className="max-w-[580px] text-[clamp(30px,4.6vw,52px)] font-semibold leading-[1.04] tracking-display text-white">
            Give your agent a way in. Not the keys to the vault.
          </h2>
          <p className="mt-5 max-w-[500px] text-[15.5px] sm:text-[17px] leading-[1.7] text-[#A3ABB8]">
            Connect Bridle to Claude, Cursor or any MCP-compatible client. Your agent can inspect its mandate, check a payment and propose one. The contract still decides.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/mcp"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-6 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Full MCP setup
              <span aria-hidden className="ml-2">↗</span>
            </Link>
            <a
              href="https://github.com/Mofifoluwa-ade/Bridle/tree/main/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center px-3 text-[14px] font-medium text-[#C4CAD4] underline underline-offset-4 decoration-[#48515E] hover:text-white"
            >
              Browse the server
            </a>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#828D9F]">
            Node.js 22.22.2+ · NEAR testnet · Open source
          </p>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-[#12161F] p-4 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#828D9F]">01 / Add to your MCP client</p>
              <p className="mt-1 text-sm font-semibold text-white">A small config. No clone required.</p>
            </div>
            <span className="rounded-full border border-[#46D9A4]/20 bg-[#46D9A4]/10 px-3 py-1 font-mono text-[10px] text-[#46D9A4]">stdio</span>
          </div>
          <div className="dark mt-4">
            <CodeBlock code={config} label="mcp.json" />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border-t border-white/10 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#46D9A4]">02 / Read</span>
              <p className="mt-1.5 text-[14px] font-semibold text-white">No agent key needed</p>
              <p className="mt-1 text-[12.5px] leading-[1.55] text-[#828D9F]">Explore mandates and dry-run a payment before proposing it.</p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#46D9A4]">03 / Propose</span>
              <p className="mt-1.5 text-[14px] font-semibold text-white">Restricted function-call key</p>
              <p className="mt-1 text-[12.5px] leading-[1.55] text-[#828D9F]">Add agent credentials only when you want it to submit proposals.</p>
            </div>
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-[11.5px] leading-[1.6] text-[#828D9F]">
            This connects to NEAR testnet. The MCP server has been tested against a mock RPC; live testnet use with a real agent key is not yet verified.
          </p>
        </div>
      </Container>
    </section>
  );
}
