"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container, PrimaryButton } from "./Container";
import { Logo } from "./Logo";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/mcp", label: "MCP" },
  { href: "/#principles", label: "Principles" },
  { href: "/#questions", label: "FAQ" },
  { href: "/docs", label: "Docs" },
  { href: "/brand", label: "Brand" },
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      if (target?.closest?.("[data-mobile-menu-scrollable]")) return;
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

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="relative z-40 w-full">
      <Container>
        <nav aria-label="Primary" className="flex items-center justify-between gap-4 py-5 sm:py-7">
          <Link href="/" className="text-ink transition-opacity hover:opacity-85 dark:text-white"><Logo /></Link>
          <div className="hidden items-center gap-6 lg:gap-7 md:flex">
            {links.map((l) => <Link key={l.href} href={l.href} className="text-[14px] text-mute transition-colors hover:text-ink dark:text-dark-mute dark:hover:text-white">{l.label}</Link>)}
            <div className="flex items-center gap-2.5">
              <PrimaryButton href="/app">Open app</PrimaryButton>
              <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-2xs transition-colors hover:bg-paper dark:border-dark-border dark:bg-dark-card dark:text-white dark:hover:bg-dark-card-hover">
                {theme === "dark" ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink dark:border-dark-border dark:bg-dark-card dark:text-white">
              {theme === "dark" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink dark:border-dark-border dark:bg-dark-card dark:text-white">
              {mobileMenuOpen ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>}
            </button>
          </div>
        </nav>
      </Container>
      {mobileMenuOpen && <>
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs dark:bg-black/60 md:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
        <div data-mobile-menu-scrollable="true" className="fixed left-4 right-4 top-[76px] z-50 max-h-[calc(100dvh-92px)] overflow-y-auto overscroll-contain md:hidden">
          <div className="space-y-4 rounded-2xl border border-line bg-white p-5 text-ink shadow-2xl dark:border-dark-border dark:bg-dark-card dark:text-white">
            <div className="flex flex-col space-y-1">{links.map((l) => <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3.5 py-2.5 text-[15px] font-medium text-mute transition-colors hover:bg-paper hover:text-ink dark:text-dark-mute dark:hover:bg-dark-card-hover dark:hover:text-white">{l.label}</Link>)}</div>
            <div className="border-t border-line pt-3 dark:border-dark-border"><Link href="/app" onClick={() => setMobileMenuOpen(false)} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white shadow-sm transition-all hover:opacity-90 dark:bg-white dark:text-ink">Open app <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></Link></div>
          </div>
        </div>
      </>}
    </div>
  );
}
