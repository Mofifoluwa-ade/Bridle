"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MandateCard } from "@/components/app/MandateCard";
import {
  Btn,
  Card,
  Empty,
  LinkBtn,
  Notice,
  PageHeader,
  Pill,
  Skeleton,
  Stat,
} from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { useMyMandates } from "@/hooks/useMyData";
import { useNow } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { nsToMs, usdc } from "@/lib/format";
import type { Mandate } from "@/lib/types";

export default function MandatesPage() {
  const { accountId, signIn, ready } = useWallet();
  const now = useNow(5000);
  const liveMandates = useMyMandates();
  const [filter, setFilter] = useState<"All" | "Active" | "Needs deposit" | "Inactive">("All");
  const [search, setSearch] = useState("");

  const mandates: Mandate[] = liveMandates.data ?? [];

  // Categorize rules
  const counts = useMemo(() => {
    let active = 0;
    let needsDeposit = 0;
    let inactive = 0;

    for (const m of mandates) {
      const isRevoked = m.state === "Revoked";
      const isExpired = nsToMs(m.expires_at) <= now;
      const isAwaitingBond = BigInt(m.bond_posted) < BigInt(m.bond);

      if (isRevoked || isExpired) {
        inactive++;
      } else if (isAwaitingBond) {
        needsDeposit++;
      } else {
        active++;
      }
    }

    return {
      all: mandates.length,
      active,
      needsDeposit,
      inactive,
    };
  }, [mandates, now]);

  const totalDailyBudget = useMemo(() => {
    return mandates
      .filter((m) => m.state === "Active" && nsToMs(m.expires_at) > now)
      .reduce((acc, m) => acc + BigInt(m.daily_cap || "0"), BigInt(0));
  }, [mandates, now]);

  const totalSpentToday = useMemo(() => {
    return mandates
      .filter((m) => m.state === "Active")
      .reduce((acc, m) => acc + BigInt(m.spent_today || "0"), BigInt(0));
  }, [mandates]);

  const filteredMandates = useMemo(() => {
    return mandates.filter((m) => {
      const isRevoked = m.state === "Revoked";
      const isExpired = nsToMs(m.expires_at) <= now;
      const isAwaitingBond = BigInt(m.bond_posted) < BigInt(m.bond);

      if (filter === "Active") {
        if (isRevoked || isExpired || isAwaitingBond) return false;
      } else if (filter === "Needs deposit") {
        if (isRevoked || isExpired || !isAwaitingBond) return false;
      } else if (filter === "Inactive") {
        if (!isRevoked && !isExpired) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesAgent = m.agent.toLowerCase().includes(q);
        const matchesId = String(m.id).includes(q);
        const matchesChain = m.chains.some((c) => c.toLowerCase().includes(q));
        if (!matchesAgent && !matchesId && !matchesChain) return false;
      }

      return true;
    });
  }, [mandates, filter, search, now]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header with New Rule Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-ink dark:text-white">
            Spending rules
          </h1>
          <p className="text-xs sm:text-sm text-mute dark:text-dark-mute mt-0.5">
            Manage hard caps, recipient allowlists, and review triggers for your AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <LinkBtn href="/app/mandates/new" variant="accent" size="sm" className="shadow-xs">
            + New rule
          </LinkBtn>
        </div>
      </div>

      {/* Disconnected State notice */}
      {!accountId && (
        <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-ink dark:text-white">Viewing demo rules</p>
            <p className="text-mute dark:text-dark-mute mt-0.5">
              Connect your NEAR testnet account to view and manage your on-chain agent spending rules.
            </p>
          </div>
          <Btn size="sm" onClick={signIn} disabled={!ready} className="shrink-0">
            {ready ? "Connect wallet" : "Loading wallet…"}
          </Btn>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Active spending rules"
          value={`${counts.active} active`}
          sub={
            counts.needsDeposit > 0
              ? `${counts.needsDeposit} rule${counts.needsDeposit === 1 ? "" : "s"} waiting for agent deposit`
              : `${counts.all} total rule${counts.all === 1 ? "" : "s"} configured`
          }
          badge={
            counts.needsDeposit > 0 ? (
              <Pill tone="warn">{counts.needsDeposit} needs deposit</Pill>
            ) : counts.active > 0 ? (
              <Pill tone="ok">Active</Pill>
            ) : (
              <Pill tone="neutral">None active</Pill>
            )
          }
        />
        <Stat
          label="Total daily budget"
          value={usdc(totalDailyBudget)}
          sub="Maximum spending allowance per 24 hours across active rules"
        />
        <Stat
          label="Total spent today"
          value={usdc(totalSpentToday)}
          sub={`Resets automatically every 24 hours on-chain`}
        />
      </div>

      {/* Filter and Search Controls */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border text-xs">
            {(
              [
                { id: "All", label: "All rules", count: counts.all },
                { id: "Active", label: "Active", count: counts.active },
                { id: "Needs deposit", label: "Needs deposit", count: counts.needsDeposit },
                { id: "Inactive", label: "Inactive", count: counts.inactive },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === tab.id
                    ? "bg-white dark:bg-dark-card text-ink dark:text-white shadow-2xs font-semibold"
                    : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10.5px] px-1.5 py-0.2 rounded-full ${
                    filter === tab.id
                      ? "bg-paper dark:bg-dark-bg text-ink dark:text-white"
                      : "bg-line/40 dark:bg-dark-border/40 text-mute dark:text-dark-mute"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by agent or rule #…"
              className="w-full rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/60 px-3 py-1.5 text-xs text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:border-ink dark:focus:border-white focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Rules Grid */}
        {liveMandates.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        ) : filteredMandates.length === 0 ? (
          <div className="py-10 text-center">
            <Empty
              title={
                search
                  ? "No matching spending rules found"
                  : filter !== "All"
                  ? `No ${filter.toLowerCase()} rules`
                  : "No spending rules created yet"
              }
            >
              {search
                ? `No rules match "${search}". Try clearing your search query.`
                : filter === "Needs deposit"
                ? "None of your spending rules are currently awaiting an agent security deposit."
                : "Set spending limits and recipient allowlists to enable autonomous AI agent transactions safely."}
            </Empty>
            <div className="mt-4">
              {search ? (
                <Btn size="sm" variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Btn>
              ) : (
                <LinkBtn href="/app/mandates/new" variant="accent" size="sm">
                  + Create spending rule
                </LinkBtn>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {filteredMandates.map((m) => (
              <MandateCard key={m.id} m={m} now={now} viewer={accountId ?? ""} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
