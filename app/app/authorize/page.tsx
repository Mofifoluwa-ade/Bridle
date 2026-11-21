"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NeedsWallet } from "@/components/app/Gate";
import { Btn, Card, Label, Notice } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { FUND, useWalletAgent } from "@/components/app/useWalletAgent";

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

type Req = { clientId: string; redirect: string; state: string | null; challenge: string; name: string; host: string };

function parseRequest(sp: URLSearchParams): Req | { error: string } {
  const clientId = sp.get("client_id") ?? "";
  const redirect = sp.get("redirect_uri") ?? "";
  const challenge = sp.get("code_challenge") ?? "";
  if (!clientId || !redirect) return { error: "This sign-in link is missing details. Start again from your AI app." };
  if (sp.get("response_type") !== "code" || sp.get("code_challenge_method") !== "S256" || !challenge) return { error: "This app did not use the secure sign-in Bridle requires." };
  let name = "An AI app";
  try {
    // Display only. The server checks the signature when the owner approves.
    const payload = JSON.parse(atob(clientId.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.name === "string") name = payload.name;
  } catch {
    return { error: "This app is not registered with Bridle. Start again from your AI app." };
  }
  let host = "";
  try {
    host = new URL(redirect).host;
  } catch {
    return { error: "This sign-in link has a bad return address." };
  }
  return { clientId, redirect, state: sp.get("state"), challenge, name, host };
}

function Approve({ req }: { req: Req }) {
  const w = useWalletAgent();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  const approve = async () => {
    if (!w.agent) return;
    setWorking(true);
    w.setErr(null);
    try {
      const r = await fetch("/api/oauth/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: req.clientId, redirect_uri: req.redirect, code_challenge: req.challenge, state: req.state, token: w.agent.token }),
      });
      const j = await r.json();
      if (!r.ok || !j.redirect) throw new Error(j.error_description ?? "Bridle could not complete the sign-in.");
      setDone(true);
      window.location.href = j.redirect;
    } catch (e) {
      w.setErr(e instanceof Error ? e.message : "Bridle could not complete the sign-in.");
      setWorking(false);
    }
  };

  const deny = () => {
    const u = new URL(req.redirect);
    u.searchParams.set("error", "access_denied");
    if (req.state) u.searchParams.set("state", req.state);
    window.location.href = u.toString();
  };

  const importIt = () => {
    const e = w.importLink(paste);
    if (e) w.setErr(e);
    else {
      w.setErr(null);
      setPaste("");
      setPasteOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <p className="text-[15px] leading-relaxed">
          <strong>{req.name}</strong> <span className="text-mute dark:text-dark-mute">({req.host})</span> wants to act as your Bridle agent.
        </p>
        <div className="mt-4 grid gap-4 text-[14.5px] leading-relaxed text-mute dark:text-dark-mute sm:grid-cols-2">
          <div>
            <Label>It can</Label>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>See the rules that name your agent</li>
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
      </Card>

      <Card className="p-5 sm:p-6">
        <Label>Your agent</Label>
        {w.agent ? (
          <div className="mt-2 space-y-3 text-[14.5px] text-mute dark:text-dark-mute">
            <p className="font-mono text-[13px] text-ink dark:text-white" title={w.agent.account}>{short(w.agent.account)}</p>
            <p>{w.kind === "wallet" ? "Comes from your wallet, so it is the same on any computer." : "Lives in this browser only."}</p>
            {w.funded === false && (
              <Notice tone="warn" title="Not funded yet">
                The agent needs a little gas to submit proposals. Checking a payment works without it.
                <div className="mt-3"><Btn variant="outline" onClick={w.fund} busy={w.busy}>Send {FUND} NEAR</Btn></div>
              </Notice>
            )}
            {w.rules === 0 && <p>No rules use this agent yet. You can create one after connecting.</p>}
          </div>
        ) : (
          <div className="mt-2 space-y-3 text-[14.5px] text-mute dark:text-dark-mute">
            <p>Sign one message with your wallet. It moves no funds and costs nothing. The same wallet always makes the same agent.</p>
            <Btn onClick={w.createFromWallet} busy={w.busy}>Create or restore my agent</Btn>
            <p className="text-[13px]">Your wallet asks twice, to confirm it signs the same way each time.</p>
          </div>
        )}
        <div className="mt-4">
          <button type="button" onClick={() => setPasteOpen((o) => !o)} className="text-[13.5px] text-mute underline underline-offset-2 hover:text-ink dark:text-dark-mute dark:hover:text-white">
            {pasteOpen ? "Hide" : "Already have an agent link? Use it"}
          </button>
          {pasteOpen && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste your agent link" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3.5 py-3 font-mono text-[12.5px] dark:border-dark-border dark:bg-white/5" />
              <Btn variant="outline" onClick={importIt} disabled={!paste.trim()}>Use this agent</Btn>
            </div>
          )}
        </div>
        {w.err && <div className="mt-3"><Notice tone="bad">{w.err}</Notice></div>}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Btn onClick={approve} busy={working} disabled={!w.agent || done}>{done ? "Returning…" : `Approve ${req.name}`}</Btn>
        <Btn variant="outline" onClick={deny} disabled={working || done}>Cancel</Btn>
      </div>
      <p className="text-[13px] leading-relaxed text-mute dark:text-dark-mute">
        Approving lets {req.name} use your agent. OAuth access tokens last one hour and refresh tokens can be renewed for up to 90 days at a time. Bridle has no per-app revoke control or sign-in list yet, and making a new agent does not cut off this one. Revoking every rule that names this agent stops new payment proposals. A personal agent link does not expire. Only approve apps you trust, and never share your agent link. Testnet, unaudited.
      </p>
    </div>
  );
}

function Head({ title, lead, account, onSwitch }: { title: string; lead: string; account?: string | null; onSwitch?: () => void }) {
  return (
    <header className="mb-8">
      <Label>Connect with Bridle</Label>
      <h1 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-heading text-ink dark:text-white sm:text-[36px]">{title}</h1>
      <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-mute dark:text-dark-mute">
        {lead}
        {account && onSwitch && (
          <>
            {" "}
            <button type="button" onClick={onSwitch} className="whitespace-nowrap underline underline-offset-2 hover:text-ink dark:hover:text-white">
              Not you? Switch wallet
            </button>
          </>
        )}
      </p>
    </header>
  );
}

function Inner() {
  const sp = useSearchParams();
  const { accountId, signOut } = useWallet();
  const req = useMemo(() => parseRequest(sp), [sp]);
  if ("error" in req) {
    return (
      <>
        <Head title="Connect an app" lead="Approve one app to use your agent. It can only work inside the rules you sign." />
        <Notice tone="bad">{req.error}</Notice>
      </>
    );
  }
  const lead = accountId
    ? `${req.name} will act as the agent for ${accountId}. It can only work inside the rules you sign.`
    : `${req.name} wants to use a Bridle agent. It can only work inside the rules you sign.`;
  return (
    <>
      <Head title={`Connect ${req.name}`} lead={lead} account={accountId} onSwitch={() => void signOut()} />
      <NeedsWallet why="Connect your wallet so Bridle knows which agent to give this app.">
        <Approve req={req} />
      </NeedsWallet>
    </>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
