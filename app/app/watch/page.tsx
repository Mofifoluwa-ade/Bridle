"use client";

import Link from "next/link";
import { NeedsContract } from "@/components/app/Gate";
import { ProposalActions } from "@/components/app/ProposalActions";
import { Addr, Card, Empty, Label, Notice, PageHeader, Skeleton, StatusPill } from "@/components/app/ui";
import { useNow, usePoll } from "@/hooks/usePoll";
import { countdown, nsToMs, usdc } from "@/lib/format";
import { api } from "@/lib/near";
import type { Mandate, Proposal } from "@/lib/types";

export default function Watch() {
  return (
    <>
      <PageHeader title="Watch" lead="Anyone can watch. If you see a payment that looks wrong during its window, stake a small bond and flag it. If the owner agrees, you earn part of the agent's bond." />
      <NeedsContract>
        <Body />
      </NeedsContract>
    </>
  );
}

function Body() {
  const now = useNow();
  const data = usePoll<{ p: Proposal; m: Mandate }[]>("watch", async () => {
    const all = await api.proposals(null, 100);
    const open = all.filter((p) => p.status === "Waiting" || p.status === "Flagged");
    const ids = Array.from(new Set(open.map((p) => p.mandate_id)));
    const ms = new Map<number, Mandate>();
    await Promise.all(ids.map(async (id) => { const m = await api.mandate(id); if (m) ms.set(id, m); }));
    return open.flatMap((p) => (ms.has(p.mandate_id) ? [{ p, m: ms.get(p.mandate_id)! }] : []));
  });

  if (data.error) return <Notice tone="bad" title="Could not read the contract">{data.error}</Notice>;
  if (data.loading) return <Skeleton className="h-72" />;
  const rows = data.data ?? [];
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line dark:border-dark-border px-6 py-4">
        <Label>In their challenge window</Label>
        <span className="font-mono text-[12px] text-mute dark:text-dark-mute">{rows.length} open</span>
      </div>
      {rows.length === 0 ? (
        <Empty title="Nothing to watch right now">Payments above a mandate's pause threshold show up here while they wait for the owner's veto.</Empty>
      ) : (
        rows.map(({ p, m }) => {
          const left = nsToMs(p.executable_at) - now;
          return (
            <div key={p.id} className="border-b border-line dark:border-dark-border px-6 py-5 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StatusPill status={p.status} />
                  <Link href={`/app/proposals/${p.id}`} className="font-mono text-[14px] underline">#{p.id}</Link>
                  <span className="font-mono text-[13px] text-mute">mandate {m.id} · agent {m.agent}</span>
                </div>
                <span className="font-mono text-[18px]">{usdc(p.amount)} <span className="text-[13px] text-mute">on {p.chain}</span></span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[14px] text-mute">
                <span>to <Addr value={p.recipient} chars={10} /></span>
                <span>{left > 0 ? `${countdown(left)} left` : "window closed"}</span>
                {m.allowlist.some((r) => r.address === p.recipient) ? <span>Recipient is on the allowlist</span> : null}
              </div>
              <div className="mt-4"><ProposalActions proposal={p} mandate={m} now={now} onDone={data.refresh} /></div>
            </div>
          );
        })
      )}
    </Card>
  );
}
