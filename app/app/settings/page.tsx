"use client";

import { useState, useEffect } from "react";
import { Card, Label, NearAccountLink, Notice, PageHeader, Skeleton, Btn } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { usePoll } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { api, view } from "@/lib/near";

export default function Settings() {
  const { accountId } = useWallet();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bridle_theme") as "light" | "dark" | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      } else if (document.documentElement.classList.contains("dark")) {
        setTheme("dark");
      }
    } catch {}
  }, []);

  const handleSetTheme = (next: "light" | "dark") => {
    setTheme(next);
    try {
      localStorage.setItem("bridle_theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
    setMsg(`Appearance set to ${next} mode.`);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleResetGuide = () => {
    try {
      localStorage.removeItem("bridle_hide_getting_started");
    } catch {}
    setMsg("Getting started guide reset. It will appear on your next navigation.");
    setTimeout(() => setMsg(null), 4000);
  };

  const health = usePoll(
    CONFIG.contractId ? "health" : null,
    async () => {
      const [cfg, mandates, proposals] = await Promise.all([
        api.config(),
        view<number>("count_mandates"),
        view<number>("count_proposals"),
      ]);
      return { cfg, mandates, proposals };
    },
    15000
  );

  return (
    <>
      <PageHeader
        title="Settings"
        lead="Appearance, network parameters, and live contract health."
      />

      {msg && (
        <div className="mb-6 animate-fade-in">
          <Notice tone="ok" title="Saved">
            {msg}
          </Notice>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appearance Setting Card */}
        <Card className="p-7 sm:p-8">
          <Label>Appearance</Label>
          <div className="mt-5 space-y-4">
            <p className="text-[14.5px] text-mute dark:text-dark-mute">
              Select your interface color preference. Setting is saved to your browser session.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSetTheme("light")}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-[14.5px] font-semibold transition-all duration-200 ${
                  theme === "light"
                    ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
                    : "border-line dark:border-dark-border bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetTheme("dark")}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-4 text-[14.5px] font-semibold transition-all duration-200 ${
                  theme === "dark"
                    ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
                    : "border-line dark:border-dark-border bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Dark</span>
              </button>
            </div>

            <div className="pt-4 border-t border-line dark:border-dark-border flex items-center justify-between">
              <span className="text-xs text-mute dark:text-dark-mute">Need a refresher?</span>
              <button
                type="button"
                onClick={handleResetGuide}
                className="text-xs font-medium text-ink dark:text-white hover:text-accent dark:hover:text-[#46D9A4] underline transition-colors"
              >
                Reset Getting Started Guide
              </button>
            </div>
          </div>
        </Card>

        {/* Connection Setting Card */}
        <Card className="p-7 sm:p-8">
          <Label>Connection</Label>
          <dl className="mt-5 space-y-4 text-[14.5px]">
            <Item k="Network" v={CONFIG.network} />
            <Item
              k="Contract"
              v={
                CONFIG.contractId ? (
                  <NearAccountLink id={CONFIG.contractId} />
                ) : (
                  <span className="text-bad font-semibold">not configured</span>
                )
              }
            />
            <Item
              k="RPC"
              v={<span className="break-all font-mono text-[13px]">{CONFIG.rpc}</span>}
            />
            <Item
              k="Connected account"
              v={
                accountId ? (
                  <NearAccountLink id={accountId} />
                ) : (
                  <span className="text-mute dark:text-dark-mute">not connected</span>
                )
              }
            />
          </dl>
          <p className="mt-6 text-[12.5px] text-mute dark:text-dark-mute leading-relaxed">
            These endpoints are loaded from <code className="font-mono text-ink dark:text-white">.env.local</code>.
          </p>
        </Card>

        {/* Contract Health Card */}
        <Card className="p-7 sm:p-8 md:col-span-2">
          <Label>Contract Health & Telemetry</Label>
          <div className="mt-5">
            {!CONFIG.contractId ? (
              <Notice tone="warn" title="Contract address not configured">
                Deploy the Bridle contract to NEAR Testnet and set <code className="font-mono text-[13px]">NEXT_PUBLIC_BRIDLE_CONTRACT</code> in your environment to view live state.
              </Notice>
            ) : health.loading ? (
              <Skeleton className="h-28" />
            ) : health.error ? (
              <Notice tone="bad" title="Cannot reach contract RPC">
                {health.error}
              </Notice>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-4 text-[14.5px]">
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Status</dt>
                  <dd className="mt-1 font-semibold text-accent dark:text-[#46D9A4]">Reachable</dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Executor</dt>
                  <dd className="mt-1 font-mono text-[13px] truncate">
                    <NearAccountLink id={health.data!.cfg.executor} />
                  </dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Total Mandates</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold text-ink dark:text-white">
                    {String(health.data!.mandates)}
                  </dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Total Proposals</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold text-ink dark:text-white">
                    {String(health.data!.proposals)}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Notice title="Testnet security assurance">
          This environment operates exclusively on NEAR Testnet and test networks (Base Sepolia, Solana Devnet). Private keys are never stored, transmitted, or requested by this interface.
        </Notice>
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line dark:border-dark-border pb-3 last:border-b-0">
      <dt className="text-mute dark:text-dark-mute text-xs sm:text-[13.5px]">{k}</dt>
      <dd className="font-mono text-[13.5px] text-ink dark:text-white">{v}</dd>
    </div>
  );
}
