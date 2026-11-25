import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CountingToggle } from "@/components/CountingToggle";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Privacy — Bridle", description: "How Bridle handles information when you use its website, app and agent connector." };

const sections = [
  ["Information you provide", "When you use Bridle, you may connect a NEAR wallet, create or restore an agent, authorize an AI application, and create spending mandates. Bridle's interface may process public wallet/account identifiers, mandate settings, approved recipient addresses, proposal details and transaction references needed to provide those features. Bridle does not ask you to paste your wallet seed phrase or owner private key into the website or an AI chat."],
  ["Browser storage", "Bridle stores the selected agent token and agent type in your browser's localStorage, keyed to the connected owner account. A browser-only agent's key is therefore available to scripts running in that browser origin; keep your device and browser profile secure. Your theme preference may also be stored locally. Clearing browser storage can remove locally stored agent access."],
  ["Hosted MCP and OAuth", "The hosted MCP connector uses OAuth 2.1 with PKCE. The authorization code expires after five minutes, access tokens after one hour, and refresh tokens after 90 days. OAuth values are sealed or signed using a server-side secret; the current implementation is stateless and does not maintain a per-user sign-in database. A hosted OAuth token contains the agent-link token in encrypted form. The legacy personal MCP link contains the agent credential itself and does not expire; anyone who obtains it may act as that agent within the mandate's contract rules. Treat it like a password."],
  ["Important access limitation", "The current stateless OAuth implementation does not provide individual app-session revocation or a token inventory. Creating another agent does not invalidate an existing agent link or OAuth refresh token. Do not rely on creating a new agent as a way to revoke an already shared credential. Per-app revocation is on the roadmap. Until then, do not share personal agent links, and treat any shared credential as exposed if you lose control of it."],
  ["Public blockchain information", "Wallet addresses, mandate settings, proposals and transaction data written to a public blockchain may be visible to anyone and may be permanent. Bridle cannot delete or amend information already recorded on-chain. Do not put secrets or unnecessary personal information in recipient labels, mandate metadata or transaction data."],
  ["Service providers and logs", "Bridle is hosted on third-party infrastructure and reads public blockchain data through configured RPC and explorer services. Those providers may process request metadata, IP addresses, diagnostics and other technical data under their own privacy terms and retention practices. Bridle keeps simple anonymous usage counters: at most once a day per browser, the site adds one to a daily total for the kind of page opened (site, app, agent sign-in or claim page), for fresh wallet connections and for agent connector requests. Your browser keeps today\u2019s date locally so it does not count twice; that note is never sent. These counters store a date and a number only. They do not store your wallet address, IP address, user agent, the page address or any cookie or identifier, and they are not sent if your browser sends Do Not Track or you choose “Don’t count me” below. Bridle sets no cookies. The counters are kept in a database hosted by Supabase. Bridle does not run advertising trackers."],
  ["Use and sharing", "Information is used to provide wallet connection, agent authorization, mandate and proposal functionality, troubleshoot errors, protect the service and maintain the software. Bridle does not sell personal information. Information may be processed by the hosting, RPC, wallet and AI-client providers you choose to use, and may be disclosed where required by law or to address security abuse."],
  ["Retention and deletion", "Browser-stored agent credentials remain until you clear them or the application replaces them. Blockchain records are public and immutable. OAuth credentials are cryptographically sealed rather than stored in a per-user database, but a valid refresh token remains usable until it expires or the server's signing secret changes. Provider-side logs and backups are subject to the providers' retention policies."],
  ["Children and changes", "Bridle is a developer tool for adults and is not designed for children. This policy may be updated as the service changes. The effective date above shows the current version."],
];

export default function PrivacyPage() {
  return <main><Nav /><Container className="pt-14 pb-20 sm:pt-20 sm:pb-28">
    <p className="font-mono text-xs uppercase tracking-widest text-accent">Legal</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink dark:text-white">Privacy policy</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-mute dark:text-dark-mute">How Bridle handles information when you use the website, the app and the agent connector. Bridle is open source, so you can check these statements against the code.</p>
    <p className="mt-3 text-xs text-mute dark:text-dark-mute">Effective 21 November 2026 · usage counters added 23 November 2026</p>
    <div className="mt-10 max-w-3xl space-y-8">{sections.map(([title, body]) => <section key={title}><h2 className="text-lg font-semibold text-ink dark:text-white">{title}</h2><p className="mt-2 text-[15px] leading-7 text-mute dark:text-dark-mute">{body}</p></section>)}</div>
    <CountingToggle />
    <p className="mt-10 text-sm text-mute dark:text-dark-mute">Questions or privacy requests: <a className="underline underline-offset-4" href="mailto:usebridle@gmail.com">usebridle@gmail.com</a>. See also <Link className="underline underline-offset-4" href="/terms">Terms</Link> and <Link className="underline underline-offset-4" href="/support">Support</Link>.</p>
  </Container><Footer /></main>;
}
