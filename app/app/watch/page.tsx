"use client";

import Link from "next/link";
import { NeedsContract } from "@/components/app/Gate";
import { ProposalActions } from "@/components/app/ProposalActions";
import { Addr, Card, Empty, Label, Notice, PageHeader, Skeleton, StatusPill } from "@/components/app/ui";
import { useNow, usePoll } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { countdown, nsToMs, usdc } from "@/lib/format";
import { api } from "@/lib/near";
import type { Mandate, Proposal } from "@/lib/types";

export default function Watch() {
  return (
    <>
      <PageHeader
        title="Community Watch"
        lead="Anyone can help keep AI agents safe. If you spot a suspicious payment while it is paused, you can flag it. If the owner agrees with you, you earn a reward from the agent's deposit."
      />
      <Body />
    </>
  );
}

function Body() {
  const now = useNow();
  const isConfigured = Boolean(CONFIG.contractId);

  const data = usePoll<{ p: Proposal; m: Mandate }[]>("watch", async () => {
    if (!isConfigured) return [];
    const all = await api.proposals(null, 100);
    const open = all.filter((p) => p.status === "Waiting" || p.status === "Flagged");
    const ids = Array.from(new Set(open.map((p) => p.mandate_id)));
    const ms = new Map<number, Mandate>();
    await Promise.all(
      ids.map(async (id) => {
        const m = await api.mandate(id);
        if (m) ms.set(id, m);
      })
    );
    return open.flatMap((p) => (ms.has(p.mandate_id) ? [{ p, m: ms.get(p.mandate_id)! }] : []));
  });

  const rows = data.data ?? [];
  return (
    <>
      {/* Testnet Watcher Notice */}
      <div className="mb-4 rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-card/60 p-3 sm:p-3.5 text-xs flex flex-wrap items-center justify-between gap-2.5 text-mute dark:text-dark-mute">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase px-2 py-0.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 text-accent dark:text-[#46D9A4] border border-accent/25 font-semibold">
            Testnet Watcher
          </span>
          <span className="text-ink dark:text-white font-medium">Free testnet environment</span>
          <span className="text-dim dark:text-dark-dim">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Reviewer dispute deposits and rewards use test tokens only (no real money).
          </span>
        </div>
      </div>

      <Card className="overflow-hidden min-w-0">
      <div className="flex items-center justify-between border-b border-line dark:border-dark-border px-4 sm:px-6 py-4">
        <Label>Payments paused for review</Label>
        <span className="font-mono text-[12px] text-mute dark:text-dark-mute">{rows.length} open</span>
      </div>
      {rows.length === 0 ? (
        <Empty title="No paused payments right now">Whenever an agent makes a payment above the pause limit, it pauses here so anyone can check it before it goes through.</Empty>
      ) : (
        rows.map(({ p, m }) => {
          const left = nsToMs(p.executable_at) - now;
          return (
            <div key={p.id} className="border-b border-line dark:border-dark-border px-4 sm:px-6 py-4 sm:py-5 last:border-b-0 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <StatusPill status={p.status} />
                  <Link href={`/app/proposals/${p.id}`} className="font-mono text-[14px] underline">#{p.id}</Link>
                  <span className="font-mono text-xs sm:text-[13px] text-mute truncate max-w-[200px] sm:max-w-none">Rule #{m.id} · Agent: {m.agent}</span>
                </div>
                <span className="font-mono text-base sm:text-[18px] flex-none">{usdc(p.amount)} <span className="text-xs sm:text-[13px] text-mute">on {p.chain}</span></span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 text-xs sm:text-[14px] text-mute">
                <span>to <Addr value={p.recipient} chars={10} /></span>
                <span>{left > 0 ? `${countdown(left)} left to review` : "Review delay ended"}</span>
                {m.allowlist.some((r) => r.address === p.recipient) ? <span>Recipient is on the approved list</span> : null}
              </div>
              <div className="mt-4"><ProposalActions proposal={p} mandate={m} now={now} onDone={data.refresh} /></div>
            </div>
          );
        })
      )}
      </Card>
    </>
  );
}
