"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { CONFIG } from "@/lib/config";
import { shortAddr } from "@/lib/format";
import { Btn, Notice } from "./ui";
import { useWallet } from "./WalletProvider";
import { GettingStartedModal } from "./GettingStartedModal";
import { useTour } from "./SpotlightTour";
import { useAccountBalance } from "@/hooks/useNearBalance";

type SubNavItem = {
  href: string;
  label: string;
  id?: string;
  exact?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  id: string;
  exact?: boolean;
  icon: ReactNode;
  children?: SubNavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    id: "tour-nav-dashboard",
    exact: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
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
    href: "/app/mandates",
    label: "Spending rules",
    id: "tour-nav-mandates",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      {
        href: "/app/mandates/new",
        label: "Create new rule",
        id: "tour-nav-new-mandate",
        exact: true,
      },
    ],
  },
  {
    href: "/app/watch",
    label: "Watch",
    id: "tour-nav-watch",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/app/agent",
    label: "Test your agent",
    id: "tour-nav-agent",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
];

function WalletButton() {
  const { ready, accountId, signIn, signOut } = useWallet();
  const balance = useAccountBalance(accountId);

  if (!accountId)
    return (
      <div id="tour-wallet-btn">
        <Btn size="sm" onClick={signIn} disabled={!ready}>
          {ready ? "Connect wallet" : "Loading wallet"}
        </Btn>
      </div>
    );
  return (
    <div id="tour-wallet-btn" className="flex items-center gap-2">
      <div
        className="hidden rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 font-mono text-[12px] text-ink dark:text-white sm:flex items-center gap-2 shadow-2xs"
        title={`${accountId} · ${balance.near} NEAR ≈ ${balance.usd} (Market rate)`}
      >
        <span>{shortAddr(accountId, 8, 4)}</span>
        <span className="text-dim dark:text-dark-dim">·</span>
        <span className="font-semibold text-accent dark:text-[#46D9A4]">
          {balance.loading ? "…" : `${balance.near} NEAR`}
        </span>
        <span className="text-mute dark:text-dark-mute text-[11px] font-sans">
          ({balance.usd})
        </span>
      </div>
      <Btn size="sm" variant="outline" onClick={() => signOut()}>
        Disconnect
      </Btn>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { accountId } = useWallet();
  const {
    isGuideModalOpen,
    openGuideModal,
    closeGuideModal,
    startTour,
  } = useTour();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scrolling when mobile navigation drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const preventTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-mobile-menu-scrollable]")) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("touchmove", preventTouch);
    };
  }, [mobileMenuOpen]);

  // Close mobile navigation on desktop resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Only auto-open Getting Started guide on the first visit to /app if never dismissed
  useEffect(() => {
    if (path !== "/app") return;
    try {
      const hidden = localStorage.getItem("bridle_hide_getting_started");
      const sessionDismissed = sessionStorage.getItem("bridle_guide_dismissed_session");
      if (!hidden && !sessionDismissed) {
        openGuideModal();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSubActive = (sub: SubNavItem) =>
    sub.exact ? path === sub.href : path.startsWith(sub.href);

  const isNavActive = (item: NavItem) => {
    if (item.children?.some(isSubActive)) return false;
    return item.exact ? path === item.href : path.startsWith(item.href);
  };

  const isNavParentActive = (item: NavItem) => {
    return Boolean(item.children?.some(isSubActive));
  };

  const isSettingsActive = path.startsWith("/app/settings");

  return (
    <div className="min-h-screen w-full bg-paper dark:bg-dark-bg text-ink dark:text-dark-text transition-colors">
      {/* 1. Desktop Persistent Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:h-screen md:fixed md:inset-y-0 md:left-0 flex-col justify-between border-r border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 text-ink dark:text-dark-text select-none z-30 transition-colors overflow-hidden overscroll-none">
        {/* Top: Brand Logo + Primary Nav */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Link
                href="/"
                className="flex items-center gap-2.5 transition-opacity hover:opacity-85 text-ink dark:text-white"
              >
                <LogoMark size={24} className="text-ink dark:text-white" />
                <Wordmark className="text-[18px]" />
              </Link>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute dark:text-dark-mute">
                Protocol
              </span>
            </div>

            {/* Testnet notice just below the logo */}
            <div className="px-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-[11px] text-mute dark:text-dark-mute">
                NEAR testnet · v0.1
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Sidebar Navigation">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item);
              const parentActive = isNavParentActive(item);
              return (
                <div key={item.href} className="space-y-1">
                  <Link
                    id={item.id}
                    href={item.href}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      active
                        ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold shadow-sm"
                        : parentActive
                        ? "text-ink dark:text-white font-semibold bg-paper/60 dark:bg-dark-card-hover/50"
                        : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={active ? "text-white dark:text-ink" : parentActive ? "text-accent dark:text-[#46D9A4]" : "text-mute dark:text-dark-mute"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  </Link>

                  {/* Sub-division */}
                  {item.children && (
                    <div className="ml-5 pl-3 border-l-2 border-line/80 dark:border-dark-border/80 my-1 space-y-1">
                      {item.children.map((sub) => {
                        const subActive = isSubActive(sub);
                        return (
                          <Link
                            key={sub.href}
                            id={sub.id}
                            href={sub.href}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                              subActive
                                ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold shadow-xs"
                                : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={subActive ? "text-white dark:text-ink" : "text-accent dark:text-[#46D9A4]"}
                                aria-hidden="true"
                              >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              <span>{sub.label}</span>
                            </span>
                            <span
                              className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded font-medium ${
                                subActive
                                  ? "bg-white/20 dark:bg-ink/15 text-white dark:text-ink"
                                  : "bg-paper dark:bg-dark-border/60 text-accent dark:text-[#46D9A4]"
                              }`}
                            >
                              New
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Guide + Settings (Placed down at the bottom) */}
        <div className="pt-4 border-t border-line dark:border-dark-border space-y-1.5">
          {/* Getting Started Guide Trigger */}
          <button
            type="button"
            id="tour-getting-started-trigger"
            onClick={openGuideModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
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
            <span className="font-mono text-[10.5px] text-accent dark:text-[#46D9A4] font-semibold">
              Guide
            </span>
          </button>

          {/* Documentation Trigger */}
          <Link
            href="/docs"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              <span>Documentation</span>
            </div>
            <span className="font-mono text-[10.5px] text-mute dark:text-dark-mute">
              Docs
            </span>
          </Link>

          {/* Settings Tab Button (Positioned at the bottom where settings belongs) */}
          <Link
            href="/app/settings"
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
              isSettingsActive
                ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold shadow-sm"
                : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </div>
            <span className="font-mono text-[10.5px] text-mute dark:text-dark-mute">
              Appearance
            </span>
          </Link>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs touch-none overscroll-contain"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            data-mobile-menu-scrollable="true"
            className="relative w-72 max-w-[80vw] bg-white dark:bg-dark-card border-r border-line dark:border-dark-border p-5 flex flex-col justify-between z-10 overflow-y-auto overscroll-contain"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5"
                  >
                    <LogoMark size={24} className="text-ink dark:text-white" />
                    <Wordmark className="text-[18px]" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="px-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-mono text-[11px] text-mute dark:text-dark-mute">
                    NEAR testnet · v0.1
                  </span>
                </div>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = isNavActive(item);
                  const parentActive = isNavParentActive(item);
                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          active
                            ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold"
                            : parentActive
                            ? "text-ink dark:text-white font-semibold bg-paper/60 dark:bg-dark-card-hover/50"
                            : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={active ? "text-white dark:text-ink" : parentActive ? "text-accent dark:text-[#46D9A4]" : "text-mute dark:text-dark-mute"}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      </Link>

                      {/* Sub-division */}
                      {item.children && (
                        <div className="ml-5 pl-3 border-l-2 border-line/80 dark:border-dark-border/80 my-1 space-y-1">
                          {item.children.map((sub) => {
                            const subActive = isSubActive(sub);
                            return (
                              <Link
                                key={sub.href}
                                id={sub.id ? `${sub.id}-mobile` : undefined}
                                href={sub.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                  subActive
                                    ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold"
                                    : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={subActive ? "text-white dark:text-ink" : "text-accent dark:text-[#46D9A4]"}
                                    aria-hidden="true"
                                  >
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>{sub.label}</span>
                                </span>
                                <span
                                  className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded font-medium ${
                                    subActive
                                      ? "bg-white/20 dark:bg-ink/15 text-white dark:text-ink"
                                      : "bg-paper dark:bg-dark-border/60 text-accent dark:text-[#46D9A4]"
                                  }`}
                                >
                                  New
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-line dark:border-dark-border space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openGuideModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-mute dark:text-dark-mute"
              >
                <span>Getting started</span>
                <span className="font-mono text-[10.5px] text-accent">Guide</span>
              </button>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-mute dark:text-dark-mute"
              >
                <span>Documentation</span>
                <span className="font-mono text-[10.5px]">Docs</span>
              </Link>
              <Link
                href="/app/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs ${
                  isSettingsActive
                    ? "bg-ink text-white dark:bg-white dark:text-ink font-semibold"
                    : "text-mute dark:text-dark-mute"
                }`}
              >
                <span>Settings</span>
                <span className="font-mono text-[10.5px]">Appearance</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area: Top Nav Bar + Content */}
      <div className="md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Top Nav Header: Only "NEAR testnet" together with "Connect wallet" (+ mobile menu trigger) */}
        <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-line dark:border-dark-border bg-paper/90 dark:bg-dark-bg/90 px-3.5 sm:px-7 backdrop-blur transition-colors">
          {/* Left: Mobile hamburger trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white"
              aria-label="Open sidebar menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {/* Right: "NEAR testnet" badge + non-real funds notice and "Connect wallet" */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full bg-paper dark:bg-dark-card border border-line dark:border-dark-border px-2 sm:px-3 py-1 font-mono text-[10px] sm:text-[10.5px] uppercase tracking-wider text-mute dark:text-dark-mute font-medium transition-colors"
              title="NEAR Testnet: all tokens, caps, and bonds have zero real monetary value"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4]" />
              <span className="hidden xs:inline">NEAR {CONFIG.network}</span>
              <span className="xs:hidden">Testnet</span>
              <span className="hidden sm:inline text-dim dark:text-dark-dim">·</span>
              <span className="hidden sm:inline text-[10px] text-amber-600 dark:text-amber-400 font-sans normal-case font-medium">
                Test tokens only
              </span>
            </div>
            <WalletButton />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full max-w-page mx-auto px-3.5 sm:px-7 py-4 sm:py-5 animate-fade-in min-w-0">
          {!CONFIG.contractId && <SetupNotice />}
          {children}
        </main>
      </div>

      {/* Getting Started Guide Modal */}
      <GettingStartedModal
        isOpen={isGuideModalOpen}
        onClose={closeGuideModal}
        onStartTour={(stepId) => startTour(stepId)}
        accountId={accountId}
        onOpenMandateBuilder={() => router.push("/app/mandates/new")}
        onOpenManualProposal={() => router.push("/app/agent")}
        onRunStressTest={() => router.push("/app/agent")}
      />
    </div>
  );
}

function SetupNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-tint/20 dark:bg-warn-tint/10 px-3.5 py-2 text-xs text-warn">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold flex-none">Notice:</span>
        <span className="truncate">
          Contract address not set in configuration. Running in testnet mode.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-mute hover:text-ink dark:hover:text-white px-1.5 py-0.5 rounded text-[11px] flex-none"
      >
        ✕
      </button>
    </div>
  );
}
