"use client";

import Link from "next/link";
import { MandateState } from "@/types/mandate";
import { LogoMark, Wordmark } from "@/components/Logo";

export type NavTab = "monitor" | "builder" | "threats";

type AppSidebarProps = {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mandateState: MandateState;
  ownerAccount: string;
  agentAccount: string;
  onRevoke: () => void;
  onRestore: () => void;
  proposalCount: number;
  onOpenGettingStarted: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function AppSidebar({
  activeTab,
  onSelectTab,
  mandateState,
  ownerAccount,
  agentAccount,
  onRevoke,
  onRestore,
  proposalCount,
  onOpenGettingStarted,
  theme,
  onToggleTheme,
}: AppSidebarProps) {
  const isRevoked = mandateState === "Revoked";

  const navItems = [
    {
      id: "monitor" as NavTab,
      label: "Activity",
      badge: proposalCount > 0 ? proposalCount.toString() : undefined,
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      id: "builder" as NavTab,
      label: "Mandate",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: "threats" as NavTab,
      label: "Verification",
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 border-r border-line dark:border-[#1E2532] bg-white dark:bg-[#12161F] text-ink dark:text-[#F6F7F9] flex flex-col justify-between p-4 sm:p-5 z-30 select-none transition-colors duration-200">
      {/* Top Section */}
      <div className="space-y-5">
        {/* Logo */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85 text-ink dark:text-white"
          >
            <LogoMark size={24} className="text-ink dark:text-white" />
            <Wordmark className="text-[18px]" />
          </Link>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute dark:text-[#828D9F]">
            Protocol
          </span>
        </div>

        {/* Network Badge Card */}
        <div className="rounded-2xl border border-line dark:border-[#1E2532] bg-paper dark:bg-[#0B0E14] p-3 flex items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-accent text-white font-bold text-xs shadow-sm">
              N
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink dark:text-white truncate">
                NEAR Testnet
              </div>
              <div className="text-[11px] text-mute dark:text-[#828D9F] truncate">
                Chain Signatures · active
              </div>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse flex-none" />
        </div>

        {/* Navigation List */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                  isActive
                    ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold shadow-sm"
                    : "text-mute dark:text-[#828D9F] hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-[#171D28]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-white dark:text-ink" : ""}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10.5px] px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 dark:bg-ink/10 text-white dark:text-ink"
                        : "bg-paper dark:bg-[#0B0E14] text-mute dark:text-[#828D9F]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-line dark:border-[#1E2532] space-y-3.5">
        {/* Getting Started Guide Trigger */}
        <button
          type="button"
          onClick={onOpenGettingStarted}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-mute dark:text-[#828D9F] hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-[#171D28] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Getting started</span>
          </div>
          <span className="font-mono text-[10.5px] text-accent font-medium">Guide</span>
        </button>

        {/* Bound Accounts Telemetry */}
        <div className="px-3.5 py-2.5 rounded-xl bg-paper dark:bg-[#0B0E14] text-[11px] font-mono text-mute dark:text-[#828D9F] space-y-1 border border-line dark:border-[#1E2532]">
          <div className="flex items-center justify-between">
            <span className="text-dim dark:text-[#525C6C]">Owner</span>
            <span className="text-ink dark:text-white font-medium truncate max-w-[120px]">
              {ownerAccount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-dim dark:text-[#525C6C]">Agent</span>
            <span className="text-ink dark:text-white font-medium truncate max-w-[120px]">
              {agentAccount}
            </span>
          </div>
        </div>

        {/* Mandate Status & Instant Revoke Pill */}
        <div>
          {isRevoked ? (
            <button
              type="button"
              onClick={onRestore}
              className="w-full rounded-full border border-rule dark:border-[#1E2532] bg-white dark:bg-[#171D28] py-2 text-xs font-semibold text-ink dark:text-white hover:bg-paper dark:hover:bg-[#1E2532] transition-colors flex items-center justify-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-bad" />
              <span>Restore mandate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRevoke}
              className="w-full rounded-full border border-bad/30 bg-bad-tint/50 dark:bg-bad/10 py-2 text-xs font-semibold text-bad hover:bg-bad hover:text-white transition-colors flex items-center justify-center gap-2"
              title="Instantly freezes the agent and voids all pending proposals"
            >
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Instant revoke</span>
            </button>
          )}
        </div>

        {/* Footer controls: Overview link & Theme toggle */}
        <div className="flex items-center justify-between px-1 pt-1 text-xs text-mute dark:text-[#828D9F]">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:text-ink dark:hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Overview</span>
          </Link>

          {/* Theme Toggle (☀️ Light / 🌙 Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-line dark:border-[#1E2532] px-2 py-1 text-[11px] hover:text-ink dark:hover:text-white transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <>
                <span>🌙</span>
                <span>Dark</span>
              </>
            ) : (
              <>
                <span>☀️</span>
                <span>Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
