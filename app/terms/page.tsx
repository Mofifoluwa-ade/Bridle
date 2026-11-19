import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Terms — Bridle", description: "Draft terms for use of the Bridle website, app and agent connector." };

const sections = [
  ["1. Draft status and acceptance", "This page is a draft for review, not a finalized agreement. The operator must complete the effective date, governing-law and dispute provisions and obtain appropriate legal review before treating it as binding or submitting it to a public directory."],
  ["2. What Bridle does", "Bridle is experimental software for defining owner-signed spending mandates and allowing an agent to inspect those mandates, check payment eligibility and submit payment proposals. The contract and configured executor determine whether a proposal is blocked, held for review, cleared or executed. A cleared proposal is not proof that funds moved; verify execution using the proposal status and destination transaction receipt."],
  ["3. Testnet-only and experimental service", "The current public deployment is for test networks, including NEAR testnet and Base Sepolia. Test tokens have no intended real-world monetary value. Solana execution is planned and is not currently supported. The software and smart contracts are experimental, unaudited unless expressly stated otherwise, and may contain defects, interruptions or security vulnerabilities. Do not use Bridle to manage funds you cannot afford to lose, and do not assume testnet behavior guarantees mainnet safety."],
  ["4. Your responsibilities", "You are responsible for understanding every mandate before signing it, checking recipients and limits, protecting your wallet and agent credentials, reviewing requests from connected AI applications, and keeping your devices secure. Never share a seed phrase, owner private key or personal agent link. You must not attempt to bypass a mandate, exploit the service, or use it unlawfully."],
  ["5. Agent and payment permissions", "An AI application authorized to use an agent may read the agent's mandates, check a payment and submit a proposal. The current agent tool set does not expose owner controls such as creating, changing, revoking or vetoing mandates. However, proposals are on-chain state changes and may progress according to the mandate and executor. Review the permissions and consequences before authorizing an app."],
  ["6. Blockchain transactions", "Blockchain transactions may be irreversible, publicly visible and subject to network fees, congestion, validator behavior, smart-contract execution and third-party infrastructure. Bridle cannot reverse a completed on-chain transfer or remove public chain data. You are responsible for verifying destination addresses and transaction outcomes."],
  ["7. Third-party services", "Bridle may rely on wallet providers, blockchain RPC endpoints, explorers, hosting providers and AI clients. Those services are governed by their own terms and privacy policies. Bridle does not control their availability, security or data practices."],
  ["8. No financial, legal or security advice", "Bridle is software infrastructure, not a bank, custodian, broker, investment adviser or legal adviser. Nothing on the site is financial, investment, tax or legal advice. You should obtain independent advice where appropriate."],
  ["9. Availability and changes", "The service is provided on an experimental, as-available basis. Features, supported networks, limits and interfaces may change or be discontinued. We may restrict access to protect users, the service or the underlying networks."],
  ["10. Liability and governing law", "The final agreement must be reviewed by counsel and must state any legally applicable liability limitations, consumer rights, governing law, dispute-resolution process and operator identity. Those terms are intentionally not invented in this draft."],
  ["11. Contact", "For product or security concerns, contact usebridle@gmail.com or use the Support page."],
];

export default function TermsPage() {
  return <main><Nav /><Container className="pt-14 pb-20 sm:pt-20 sm:pb-28">
    <p className="font-mono text-xs uppercase tracking-widest text-accent">Legal · Draft for review</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink dark:text-white">Terms of service</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-mute dark:text-dark-mute">Working draft based on the current testnet product. Not a final legal agreement. Governing law, operator details and jurisdiction-specific consumer provisions require review before publication.</p>
    <p className="mt-3 text-xs text-mute dark:text-dark-mute">Last reviewed: 19 November 2026 · Effective date: pending operator approval</p>
    <div className="mt-10 max-w-3xl space-y-8">{sections.map(([title, body]) => <section key={title}><h2 className="text-lg font-semibold text-ink dark:text-white">{title}</h2><p className="mt-2 text-[15px] leading-7 text-mute dark:text-dark-mute">{body}</p></section>)}</div>
    <p className="mt-10 text-sm text-mute dark:text-dark-mute">Questions: <a className="underline underline-offset-4" href="mailto:usebridle@gmail.com">usebridle@gmail.com</a>. See <Link className="underline underline-offset-4" href="/privacy">Privacy</Link> and <Link className="underline underline-offset-4" href="/support">Support</Link>.</p>
  </Container><Footer /></main>;
}
