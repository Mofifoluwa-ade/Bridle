"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container, PrimaryButton } from "./Container";
import { Logo } from "./Logo";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#principles", label: "Principles" },
  { href: "/#edges", label: "Limits" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("bridle_theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // Close mobile menu on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent background scrolling when mobile navigation is open
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

  return (
    <div className="relative w-full z-40">
      <Container>
        <nav
          aria-label="Primary"
          className="flex items-center justify-between gap-4 py-5 sm:py-7"
        >
          <Link href="/" className="text-ink dark:text-white transition-opacity hover:opacity-85">
            <Logo />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[15px] text-mute dark:text-dark-mute transition-colors hover:text-ink dark:hover:text-white"
              >
                {l.label}
              </Link>
            ))}

            {/* Action Group: Open App + Small Theme Toggle Button */}
            <div className="flex items-center gap-2.5">
              <PrimaryButton href="/app">Open app</PrimaryButton>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors shadow-2xs"
              >
                {theme === "dark" ? (
                  <svg
                    width="17"
                    height="17"
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
                ) : (
                  <svg
                    width="17"
                    height="17"
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
                )}
              </button>
            </div>
          </div>

          {/* Mobile Header Controls: Theme Toggle + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors shadow-2xs"
            >
              {theme === "dark" ? (
                <svg
                  width="16"
                  height="16"
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
              ) : (
                <svg
                  width="16"
                  height="16"
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
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors shadow-2xs"
            >
              {mobileMenuOpen ? (
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
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
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay to close on outside click */}
          <div
            className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs md:hidden touch-none overscroll-contain"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Card */}
          <div
            data-mobile-menu-scrollable="true"
            className="md:hidden fixed top-[76px] left-4 right-4 z-50 animate-fade-in overscroll-contain max-h-[calc(100dvh-92px)] overflow-y-auto"
          >
            <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-2xl space-y-4 text-ink dark:text-white transition-colors">
              <div className="flex flex-col space-y-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="pt-3 border-t border-line dark:border-dark-border">
                <Link
                  href="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-[15px] font-semibold transition-all hover:opacity-90 shadow-sm"
                >
                  <span>Open app</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
