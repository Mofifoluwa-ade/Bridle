"use client";

import { useState, useEffect } from "react";
import { Card, Label, NearAccountLink, Notice, PageHeader, Skeleton, Btn } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { usePoll } from "@/hooks/usePoll";
import { CONFIG } from "@/lib/config";
import { api, view } from "@/lib/near";

import { useTour } from "@/components/app/SpotlightTour";

export default function Settings() {
  const { accountId } = useWallet();
  const { openGuideModal } = useTour();
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
      sessionStorage.removeItem("bridle_guide_dismissed_session");
    } catch {}
    setMsg("Getting started guide reset. It will appear on your next navigation, or you can open it now.");
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
        lead="Customize your theme, check network details, and see system status."
      />

      {/* Testnet Environment Banner */}
      <div className="mb-6 rounded-2xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-card/60 p-4 sm:p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-mute dark:text-dark-mute">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex-none inline-flex items-center gap-1.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 border border-accent/25 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-accent dark:text-[#46D9A4]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4]" />
            Testnet live
          </span>
          <span className="text-ink dark:text-white font-medium text-sm">
            NEAR Testnet
          </span>
          <span className="hidden sm:inline text-dim dark:text-dark-dim">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Test tokens only (no real money)
          </span>
        </div>
        <p className="text-[12px] text-mute dark:text-dark-mute sm:text-right max-w-lg leading-relaxed">
          All spending rules, payments, and security deposits use free test tokens on NEAR testnet.
        </p>
      </div>

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

            <div className="pt-4 border-t border-line dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-ink dark:text-white">Getting started guide</div>
                <div className="text-[12px] text-mute dark:text-dark-mute">Walkthrough and 4-step onboarding checklist.</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openGuideModal}
                  className="text-xs font-semibold text-accent dark:text-[#46D9A4] hover:underline transition-colors"
                >
                  Open guide now
                </button>
                <span className="text-dim dark:text-dark-dim text-xs">·</span>
                <button
                  type="button"
                  onClick={handleResetGuide}
                  className="text-xs font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white transition-colors"
                >
                  Reset guide
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Setting Card */}
        <Card className="p-7 sm:p-8">
          <Label>Connection & Source</Label>
          <dl className="mt-5 space-y-4 text-[14.5px]">
            <Item k="Network" v={CONFIG.network} />
            <Item k="Release" v={<span className="font-mono text-[13px]">NEAR testnet · v0.1</span>} />
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
            <Item
              k="Source code"
              v={
                <a
                  href="https://github.com/Mofifoluwa-ade/Bridle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent dark:text-[#46D9A4] hover:underline"
                >
                  GitHub repository
                </a>
              }
            />
          </dl>
          <p className="mt-6 text-[12.5px] text-mute dark:text-dark-mute leading-relaxed">
            These endpoints are loaded from <code className="font-mono text-ink dark:text-white">.env.local</code>. Source code is published openly under MIT.
          </p>
        </Card>

        {/* Contract Health Card */}
        <Card className="p-7 sm:p-8 md:col-span-2">
          <Label>System Status</Label>
          <div className="mt-5">
            {!CONFIG.contractId ? (
              <Notice tone="warn" title="Contract address not configured">
                Deploy the Bridle contract to NEAR Testnet and set <code className="font-mono text-[13px]">NEXT_PUBLIC_BRIDLE_CONTRACT</code> in your configuration to view live state.
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
                  <dd className="mt-1 font-semibold text-accent dark:text-[#46D9A4]">Online</dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Executor</dt>
                  <dd className="mt-1 font-mono text-[13px] truncate">
                    <NearAccountLink id={health.data!.cfg.executor} />
                  </dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Total Spending Rules</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold text-ink dark:text-white">
                    {String(health.data!.mandates)}
                  </dd>
                </div>
                <div className="p-4 rounded-2xl bg-paper dark:bg-dark-bg border border-line dark:border-dark-border">
                  <dt className="text-xs text-mute dark:text-dark-mute">Total Payments Requested</dt>
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
        <Notice title="Testnet safety">
          This app runs entirely on test networks with free test tokens. Real money is never at risk, and you never have to share private keys.
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
