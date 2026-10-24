"use client";

import { useWallet } from "@/components/app/WalletProvider";
import { api } from "@/lib/near";
import type { Mandate, Proposal } from "@/lib/types";
import { usePoll } from "./usePoll";

export function useMyMandates() {
  const { accountId } = useWallet();
  return usePoll<Mandate[]>(accountId ? `m:${accountId}` : null, () => api.mandatesFor(accountId!));
}

/** Proposals for the given mandates, newest first. */
export function useProposalsFor(mandates: Mandate[] | null) {
  const ids = mandates?.map((m) => m.id) ?? [];
  const key = mandates ? `p:${ids.join(",")}` : null;
  return usePoll<Proposal[]>(key, async () => {
    if (ids.length === 0) return [];
    const lists = await Promise.all(ids.map((id) => api.proposals(id, 50)));
    return lists.flat().sort((a, b) => b.id - a.id);
  });
}
