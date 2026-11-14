"use client";

import { useCallback, useEffect, useState } from "react";
import { formatNear } from "@/lib/format";
import { claimLink, claimToAccount, keyBalance, loadDrops, type SavedDrop } from "@/lib/linkdrop";
import { Btn, Label } from "./ui";

type Row = SavedDrop & { waiting: boolean | null };

/** Claim links this browser has made, and whether each is still waiting to be claimed. */
export function ClaimLinks({ accountId, refreshKey }: { accountId: string | null; refreshKey: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    const drops = loadDrops();
    const checked = await Promise.all(drops.map(async (d) => ({ ...d, waiting: (await keyBalance(d.publicKey)) !== null })));
    setRows(checked);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load, refreshKey]);

  if (rows.length === 0) return null;

  const copy = async (d: SavedDrop) => {
    try {
      await navigator.clipboard.writeText(claimLink(window.location.origin, d.secret, d.memo));
      setCopied(d.publicKey);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  };

  const reclaim = async (d: SavedDrop) => {
    if (!accountId) return;
    setBusy(d.publicKey);
    setNote(null);
    try {
      await claimToAccount(d.secret, accountId);
      setNote("Taken back to your account.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not take it back.");
    } finally {
      setBusy(null);
      load();
    }
  };

  return (
    <section>
      <Label>Your claim links</Label>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white dark:divide-dark-border dark:border-dark-border dark:bg-dark-card">
        {rows.map((d) => (
          <li key={d.publicKey} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
            <div>
              <p className="font-mono text-[15px]">{formatNear(d.amount)}</p>
              <p className="text-[12.5px] text-mute dark:text-dark-mute">
                {new Date(d.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                {d.memo ? ` · ${d.memo}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${d.waiting ? "bg-warn/15 text-warn" : "bg-accent-tint text-accent"}`}>
                {d.waiting === null ? "Checking" : d.waiting ? "Waiting to be claimed" : "Claimed"}
              </span>
              {d.waiting && (
                <>
                  <Btn size="sm" variant="outline" onClick={() => copy(d)}>{copied === d.publicKey ? "Copied" : "Copy link"}</Btn>
                  <Btn size="sm" variant="outline" busy={busy === d.publicKey} disabled={!accountId} onClick={() => reclaim(d)}>Take it back</Btn>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {note && <p className="mt-3 text-[13.5px] text-mute dark:text-dark-mute">{note}</p>}
      <p className="mt-3 text-[12.5px] leading-relaxed text-mute dark:text-dark-mute">
        These links are kept in this browser only. If you clear it, copy any link you still need first. Anyone with a link can claim the money.
      </p>
    </section>
  );
}
