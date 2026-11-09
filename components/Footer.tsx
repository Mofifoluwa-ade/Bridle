import Link from "next/link";
import { Container } from "./Container";
import { Logo, LogoMark } from "./Logo";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/#principles", label: "Principles" },
      { href: "/#questions", label: "FAQ" },
      { href: "/docs", label: "Documentation" },
    ],
  },
  {
    title: "Build",
    links: [
      { href: "/mcp", label: "MCP setup" },
      { href: "/agents.md", label: "Agent guide" },
      { href: "/llms.txt", label: "LLMs.txt" },
      { href: "https://github.com/Mofifoluwa-ade/Bridle", label: "GitHub", external: true },
    ],
  },
  {
    title: "Use Bridle",
    links: [
      { href: "/app", label: "Open the app" },
      { href: "https://testnet.nearblocks.io/address/bridle.testnet", label: "NEAR testnet contract", external: true },
      { href: "mailto:usebridle@gmail.com", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0B0E14] text-white">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-52 h-[520px] w-[520px] rounded-full border border-white/[0.055]" />
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-32 h-[360px] w-[360px] rounded-full border border-white/[0.055]" />
      <Container className="relative">
        <div className="grid gap-12 border-b border-white/10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div className="max-w-[460px]">
            <Link href="/" aria-label="Bridle home" className="inline-flex rounded-md">
              <Logo className="text-white" />
            </Link>
            <h2 className="mt-8 max-w-[440px] text-[clamp(27px,4vw,42px)] font-semibold leading-[1.08] tracking-heading text-white">
              Autonomy deserves boundaries.
            </h2>
            <p className="mt-4 max-w-[390px] text-[14px] leading-[1.75] text-[#828D9F]">
              Policy-bound payments for AI agents. Let them do the work without handing over the authority.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2">
              <LogoMark size={16} strokeWidth={5} className="text-[#46D9A4]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A3ABB8]">Built on NEAR · Testnet v0.1</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-3 sm:gap-x-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#46D9A4]">{column.title}</h3>
                <ul className="mt-5 space-y-3.5">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      {item.external ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-[#A3ABB8] transition-colors hover:text-white">
                          {item.label}<span aria-hidden className="ml-1 text-[10px]">↗</span>
                        </a>
                      ) : (
                        <Link href={item.href} className="text-[13.5px] text-[#A3ABB8] transition-colors hover:text-white">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-[11.5px] text-[#687384] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Bridle. Open source, built in public.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono uppercase tracking-[0.09em]">
            <span>NEAR testnet</span>
            <span>Policy before payment</span>
            <a href="https://github.com/Mofifoluwa-ade/Bridle" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Source ↗</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
