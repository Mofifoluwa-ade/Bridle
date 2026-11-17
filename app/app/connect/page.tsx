"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { NeedsWallet } from "@/components/app/Gate";
import { Btn, Card, Label, Notice, PageHeader } from "@/components/app/ui";
import { agentLink } from "@/lib/agentLink";
import { FUND, useWalletAgent } from "@/components/app/useWalletAgent";


const TRY_PROMPT = "Use Bridle. List my rules, then check a small payment to one of the approved recipients and tell me whether it would clear, wait for review or be blocked. Do not send anything.";

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-semibold ${done ? "bg-accent text-white dark:bg-accent-dark dark:text-ink" : "border border-line text-mute dark:border-dark-border dark:text-dark-mute"}`}>
          {done ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12 5 5 9-10" /></svg>
          ) : (
            n
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-tight">{title}</h2>
          <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-mute dark:text-dark-mute">{children}</div>
        </div>
      </div>
    </Card>
  );
}

function Connect() {
  const { agent, kind, funded, rules, busy, err, createFromWallet, createInBrowser, fund } = useWalletAgent();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = agent && origin ? agentLink(origin, agent) : "";
  const masked = link ? link.replace(/(\/mcp\/bk_).+$/, "$1••••••••••••••••") : "";

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard can be blocked; the text is on screen for manual copy */
    }
  };

  return (
    <div className="space-y-5">
      <Step n={1} title="Create your agent" done={!!agent}>
        {agent ? (
          <>
            {kind === "wallet" ? (
              <p>Your agent comes from your wallet. Connect the same wallet in any browser, tap Restore, and the same agent is back.</p>
            ) : (
              <p>This agent only exists in this browser, so a different device cannot get it back. Switch to a wallet agent to carry it with you.</p>
            )}
            <p className="break-all font-mono text-[12.5px] text-ink dark:text-white">{agent.account}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {kind !== "wallet" && <Btn variant="outline" onClick={createFromWallet} busy={busy}>Switch to a wallet agent</Btn>}
              <button type="button" onClick={() => setConfirmNew(true)} className="text-[13.5px] underline underline-offset-2 hover:text-ink dark:hover:text-white">
                Make a browser-only agent
              </button>
            </div>
            {kind !== "wallet" && <p className="text-[13px]">A wallet agent is a new account. Rules that already use this one keep it, and its link keeps working.</p>}
          </>
        ) : (
          <>
            <p>Sign one message with your wallet. It moves no funds and costs nothing. The same wallet always makes the same agent, so it is there on any computer. If you made one before, tap again to bring it back.</p>
            <Btn onClick={createFromWallet} busy={busy}>Create or restore my agent</Btn>
            <p className="text-[13px]">Your wallet will ask twice, to confirm it signs the same way each time.</p>
          </>
        )}
        {err && <Notice tone="bad">{err}</Notice>}
      </Step>

      <Step n={2} title="Give it a little gas" done={funded === true}>
        {!agent ? (
          <p>Create your agent first.</p>
        ) : funded ? (
          <p>The agent account is live on testnet and can pay for its own proposals.</p>
        ) : (
          <>
            <p>The account starts empty. Send it {FUND} NEAR once so it can pay the small fee to submit a proposal. This is test NEAR.</p>
            <Btn onClick={fund} busy={busy}>Send {FUND} NEAR</Btn>
          </>
        )}
        {err && <Notice tone="bad">{err}</Notice>}
      </Step>

      <Step n={3} title="Connect your AI app" done={false}>
        {!agent ? (
          <p>Create your agent first.</p>
        ) : (
          <>
            <p>Add this address as a connector. Your AI app opens Bridle so you can approve it, and there is no key to copy.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-paper px-3.5 py-3 font-mono text-[13px] text-ink dark:border-dark-border dark:bg-white/5 dark:text-white">{origin ? `${origin}/mcp` : ""}</code>
              <Btn onClick={() => copy("addr", `${origin}/mcp`)}>{copied === "addr" ? "Copied" : "Copy address"}</Btn>
            </div>
            <div className="space-y-2 pt-1">
              <Label>How to use it</Label>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>In Claude: Settings, then Connectors, add a custom connector, paste the address, and tap Connect. Approve it in Bridle when it opens. Names can differ by plan and version.</li>
                <li>
                  In Claude Code, run{" "}
                  <button type="button" onClick={() => copy("cmd", `claude mcp add --transport http bridle ${origin}/mcp`)} className="rounded-md border border-line px-2 py-0.5 font-mono text-[12px] text-ink hover:bg-paper dark:border-dark-border dark:text-white dark:hover:bg-white/5">
                    {copied === "cmd" ? "Copied" : "copy the command"}
                  </button>
                  , then use /mcp to sign in.
                </li>
              </ul>
            </div>
            <details className="rounded-xl border border-line px-4 py-3 dark:border-dark-border">
              <summary className="cursor-pointer text-[14px] font-medium text-ink dark:text-white">Advanced: a personal link instead</summary>
              <div className="mt-3 space-y-3">
                <p>For apps that cannot sign in. The link carries your agent key, so treat it like a password. It has no expiry.</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 break-all rounded-xl border border-line bg-paper px-3.5 py-3 font-mono text-[12.5px] text-ink dark:border-dark-border dark:bg-white/5 dark:text-white">{show ? link : masked}</code>
                  <div className="flex gap-2">
                    <Btn variant="outline" onClick={() => setShow((x) => !x)}>{show ? "Hide" : "Show"}</Btn>
                    <Btn onClick={() => copy("link", link)}>{copied === "link" ? "Copied" : "Copy link"}</Btn>
                  </div>
                </div>
                <p>
                  Prefer to run it yourself? See <Link href="/mcp" className="underline underline-offset-2">the local server</Link>.
                </p>
              </div>
            </details>
          </>
        )}
      </Step>

      <Step n={4} title="Try it" done={false}>
        {!agent ? (
          <p>Create your agent first.</p>
        ) : rules === 0 ? (
          <>
            <p>No rule names this agent yet, so there is nothing for it to spend under. Create one, then come back.</p>
            <Link href={`/app/mandates/new?agent=${agent.account}`} className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-[14px] font-medium text-white hover:opacity-90 dark:bg-accent-dark dark:text-ink">
              Create a rule for this agent
            </Link>
          </>
        ) : (
          <>
            <p>Paste this to your AI app. It checks a payment without sending anything.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <code className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3.5 py-3 text-[13.5px] leading-relaxed text-ink dark:border-dark-border dark:bg-white/5 dark:text-white">{TRY_PROMPT}</code>
              <Btn onClick={() => copy("try", TRY_PROMPT)}>{copied === "try" ? "Copied" : "Copy prompt"}</Btn>
            </div>
          </>
        )}
      </Step>

      {agent && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-[16px] font-semibold tracking-tight">What this link can do</h2>
          <div className="mt-3 grid gap-4 text-[14.5px] leading-relaxed text-mute dark:text-dark-mute sm:grid-cols-2">
            <div>
              <Label>It can</Label>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Find the rules where it is the agent</li>
                <li>Read their limits and what is left today</li>
                <li>Check a payment before sending it</li>
                <li>Propose a payment. The contract decides.</li>
              </ul>
            </div>
            <div>
              <Label>It cannot</Label>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Create, change, fund or stop a rule</li>
                <li>Approve or veto a held payment</li>
                <li>Move money outside a rule&apos;s limits</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-[13.5px] text-mute dark:text-dark-mute">
            {rules === null ? "" : rules === 0 ? "No rules use this agent yet. " : `${rules} rule${rules === 1 ? "" : "s"} use this agent. `}
            New rules pick it automatically. <Link href="/app/mandates/new" className="underline underline-offset-2">Create a rule</Link>
          </p>
        </Card>
      )}

      <Notice tone="warn" title="If the link leaks">
        Anyone with it can propose payments on the rules that use this agent, but only inside their limits. Make a new agent, then create new rules with it. A wallet agent is derived from a signature of a fixed message, so never sign that message on a site you do not trust. Bridle&apos;s server sees the key whenever the link is used. This is testnet and unaudited.
      </Notice>

      <ConfirmDialog
        open={confirmNew}
        destructive
        title="Make a browser-only agent?"
        confirmLabel="Make it"
        cancelLabel="Keep this one"
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          setConfirmNew(false);
          createInBrowser();
        }}
      >
        Your current link keeps working for the rules that already use this agent, but Bridle will stop showing it here. A browser-only agent cannot be restored on another device. Copy the old link first if you still need it.
      </ConfirmDialog>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <>
      <PageHeader title="Connect your agent" lead="One link lets an AI app act as your agent. It can only work inside the rules you sign." />
      <div className="mx-auto max-w-[760px]">
        <NeedsWallet why="Connect your wallet to make an agent that belongs to you.">
          <Connect />
        </NeedsWallet>
      </div>
    </>
  );
}
