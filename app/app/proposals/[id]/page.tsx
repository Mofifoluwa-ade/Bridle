"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { NeedsContract } from "@/components/app/Gate";
import { ProposalActions } from "@/components/app/ProposalActions";
import { TxBanner } from "@/components/app/TxBanner";
import { Addr, Card, Empty, Label, LinkBtn, Notice, PageHeader, Skeleton, STATUS, StatusPill } from "@/components/app/ui";
import { useNow, usePoll } from "@/hooks/usePoll";
import { CHAIN_EXPLORER } from "@/lib/config";
import { countdown, nsToMs, usdc } from "@/lib/format";
import { api } from "@/lib/near";
import type { Mandate, Proposal } from "@/lib/types";

export default function ProposalPage() {
  const id = Number(useParams<{ id: string }>().id);
  return (
    <NeedsContract>
      <Body id={id} />
    </NeedsContract>
  );
}

function Body({ id }: { id: number }) {
  const now = useNow();
  const data = usePoll(Number.isInteger(id) ? `p${id}` : null, async () => {
    const p = await api.proposal(id);
    if (!p) return null;
    const m = await api.mandate(p.mandate_id);
    return m ? { p, m } : null;
  });

  if (data.error) return <Notice tone="bad" title="Could not read the contract">{data.error}</Notice>;
  if (data.loading) return <Skeleton className="h-96" />;
  if (!data.data) return <Card><Empty title="Proposal not found" action={<LinkBtn href="/app">Back to dashboard</LinkBtn>}>There is no proposal {id} on this contract.</Empty></Card>;
  const { p, m } = data.data;
  const execMs = nsToMs(p.executable_at);
  const remaining = execMs - now;

  return (
    <>
      <TxBanner />
      <PageHeader
        title={`Payment #${p.id}`}
        lead={p.status === "Rejected" && p.reason ? p.reason : STATUS[p.status].line}
        action={<StatusPill status={p.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-8">
            <p className="font-mono text-[44px] font-medium leading-none">{usdc(p.amount)}</p>
            <p className="mt-3 text-[15px] text-mute">on {p.chain} to <Addr value={p.recipient} chars={12} /></p>

            {(p.status === "Waiting" || p.status === "Flagged") && (
              <div className={`mt-6 rounded-2xl px-5 py-4 ${p.status === "Flagged" ? "bg-warn-tint" : "bg-paper"}`}>
                <Label>{p.status === "Flagged" ? "Owner review deadline" : "Paused for review: resumes in"}</Label>
                <p className="mt-2 font-mono text-[30px]">{remaining > 0 ? countdown(remaining) : "review time ended"}</p>
              </div>
            )}

            {p.flagger && (
              <div className="mt-6 rounded-2xl border border-warn/30 bg-warn-tint px-5 py-4">
                <Label>Reported by reviewer {p.flagger}</Label>
                <p className="mt-2 text-[16px]">&ldquo;{p.flag_reason}&rdquo;</p>
              </div>
            )}

            <div className="mt-8"><ProposalActions proposal={p} mandate={m} now={now} onDone={data.refresh} /></div>
          </Card>

          <Card className="p-8">
            <Label>Payment status history</Label>
            <Timeline p={p} m={m} />
          </Card>
        </div>

        <aside className="space-y-6">
          {p.tx_hash && (
            <Card className="p-6">
              <Label>Blockchain transaction</Label>
              <a className="mt-3 block break-all font-mono text-[14px] underline" target="_blank" rel="noreferrer" href={CHAIN_EXPLORER[p.chain](p.tx_hash)}>{p.tx_hash}</a>
            </Card>
          )}
          <Card className="p-6">
            <Label>Spending rule</Label>
            <p className="mt-3 text-[15px]"><Link className="font-semibold underline" href={`/app/mandates/${m.id}`}>Rule #{m.id}</Link></p>
            <p className="mt-1 font-mono text-[13px] text-mute">Owner: {m.owner}<br />Agent: {m.agent}</p>
          </Card>
          <Card className="p-6">
            <Label>Requested on</Label>
            <p className="mt-3 text-[15px]">{new Date(nsToMs(p.created_at)).toLocaleString()}</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

type Step = { label: string; note?: string; state: "done" | "now" | "todo" | "stop" };

function Timeline({ p, m }: { p: Proposal; m: Mandate }) {
  const big = p.status !== "Rejected" && BigInt(p.amount) > BigInt(m.cooling_threshold);
  const steps: Step[] = [{ label: "Agent requested payment", state: "done" }];
  if (p.status === "Rejected") {
    steps.push({ label: "Blocked by spending rules", note: p.reason ?? undefined, state: "stop" });
  } else {
    steps.push({ label: "Passed all spending rules", state: "done" });
    if (big) {
      const flagged = ["Flagged", "Cancelled", "Expired"].includes(p.status) || !!p.flagger;
      steps.push({
        label: "Paused for safety review",
        state: p.status === "Waiting" ? "now" : "done",
        note: flagged ? "Flagged by reviewer" : undefined,
      });
    }
    const end: Record<string, Step> = {
      Vetoed: { label: "Cancelled by rule owner", state: "stop" },
      Cancelled: { label: "Report confirmed bad. Agent deposit lost.", state: "stop" },
      Expired: { label: "Review expired without approval. No money sent.", state: "stop" },
    };
    if (end[p.status]) steps.push(end[p.status]);
    else {
      steps.push({ label: "Approved to send", state: ["Signing", "Executed"].includes(p.status) ? "done" : p.status === "Ready" ? "now" : "todo" });
      steps.push({ label: "Sent on the blockchain", state: p.status === "Executed" ? "done" : p.status === "Signing" ? "now" : "todo" });
    }
    if (p.status === "Flagged") steps[steps.length - 1] = { label: "Waiting for owner to review the report", state: "now" };
  }
  const dot = { done: "bg-accent text-white", now: "bg-warn-tint text-warn ring-2 ring-warn", todo: "bg-[#ECEEF2] text-mute", stop: "bg-bad-tint text-bad" };
  return (
    <ol className="mt-6 space-y-5">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-4">
          <span className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-semibold ${dot[s.state]}`}>
            {s.state === "done" ? "✓" : s.state === "stop" ? "×" : i + 1}
          </span>
          <div>
            <p className={`text-[16px] ${s.state === "todo" ? "text-mute" : "font-semibold"}`}>{s.label}</p>
            {s.note && <p className="mt-0.5 text-[14px] text-mute">{s.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
