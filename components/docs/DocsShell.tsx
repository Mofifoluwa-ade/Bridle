"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { DocContent } from "./content";
import { DOC_GROUPS, DOC_PAGES, pageBySlug, pageForAnchor } from "./nav";

const GITHUB = "https://github.com/Mofifoluwa-ade/Bridle";

const SearchIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function DocsShell() {
  // One route, one page at a time: the #hash picks the page (/docs#status, /docs#quickstart).
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => setHash(window.location.hash.slice(1));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const slug = pageForAnchor(hash)?.slug ?? "overview";
  const current = pageBySlug(slug);
  const idx = DOC_PAGES.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? DOC_PAGES[idx - 1] : null;
  const next = idx >= 0 && idx < DOC_PAGES.length - 1 ? DOC_PAGES[idx + 1] : null;

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [activeAnchor, setActiveAnchor] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

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
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("bridle_theme", nextTheme);
    } catch {}
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // On every page/anchor change: jump to the anchor if there is one, else back to the top; close the sheet.
  useEffect(() => {
    setSheetOpen(false);
    setQuery("");
    setActiveAnchor("");
    const isAnchor = hash && hash !== slug && pageForAnchor(hash);
    if (isAnchor) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    else window.scrollTo({ top: 0 });
  }, [hash, slug]);

  // Scrollspy for the in-page anchors listed under the current page.
  useEffect(() => {
    const ids = current?.anchors?.map((a) => a.id) ?? [];
    if (!ids.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveAnchor(e.target.id)),
      { rootMargin: "-80px 0px -70% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [current]);

  // Lock page scroll behind the sheet, close on Escape.
  useEffect(() => {
    if (!sheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [sheetOpen]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_GROUPS;
    return DOC_GROUPS.map((g) => ({
      ...g,
      pages: g.pages.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          p.anchors?.some((a) => a.label.toLowerCase().includes(q)),
      ),
    })).filter((g) => g.pages.length > 0);
  }, [query]);

  const isGroupOpen = (title: string, hasCurrent: boolean) =>
    query.trim() ? true : (openGroups[title] ?? hasCurrent);

  const linkCls = (active: boolean) =>
    `block px-3 py-1.5 rounded-lg text-xs transition-colors ${
      active
        ? "bg-accent/10 text-accent dark:text-[#46D9A4] font-semibold"
        : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white hover:bg-paper dark:hover:bg-dark-card-hover"
    }`;

  return (
    <div className="min-h-screen w-full bg-paper dark:bg-dark-bg text-ink dark:text-dark-text transition-colors overflow-x-clip max-w-full">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-40 w-full h-16 border-b border-line dark:border-dark-border bg-white/95 dark:bg-dark-card/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5 sm:gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 text-ink dark:text-white">
            <LogoMark size={24} />
            <Wordmark className="text-[19px]" />
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border border-line dark:border-dark-border bg-paper dark:bg-dark-bg text-mute dark:text-dark-mute">
              Documentation
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-xs font-mono rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3.5 py-1.5 pl-8 text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:outline-hidden focus:ring-1 focus:ring-accent"
              />
              <span className="absolute left-2.5 top-2 text-mute dark:text-dark-mute"><SearchIcon /></span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors"
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
              title="GitHub repository (source code)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-border bg-white dark:bg-dark-card text-xs font-medium text-ink dark:text-white hover:bg-paper dark:hover:bg-dark-card-hover transition-colors shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub ↗</span>
            </a>

            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold bg-ink text-white dark:bg-white dark:text-ink hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="hidden xs:inline">Launch </span>
              <span>App</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Phone only: page switcher bar (desktop keeps the sidebar) */}
      <div className="lg:hidden fixed top-16 inset-x-0 z-30 h-12 border-b border-line dark:border-dark-border bg-white/95 dark:bg-dark-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-ink dark:text-white"
          >
            Documentation
            <Chevron open={sheetOpen} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSheetOpen(true);
              setTimeout(() => searchRef.current?.focus(), 50);
            }}
            aria-label="Search documentation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-mute dark:text-dark-mute hover:bg-paper dark:hover:bg-dark-card-hover"
          >
            <SearchIcon size={18} />
          </button>
        </div>
      </div>

      {/* Phone only: bottom sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Documentation">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-line dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-semibold text-ink dark:text-white">Documentation</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-mute dark:text-dark-mute hover:bg-paper dark:hover:bg-dark-card-hover"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute dark:text-dark-mute"><SearchIcon size={15} /></span>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics..."
                  className="h-10 w-full rounded-xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-bg/60 pl-9 pr-3 text-[14px] text-ink dark:text-white placeholder:text-dim dark:placeholder:text-dark-dim focus:border-ink dark:focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6">
              {groups.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-mute dark:text-dark-mute">No matching topics.</p>
              )}
              {groups.map((g) => {
                const hasCurrent = g.pages.some((p) => p.slug === slug);
                const open = isGroupOpen(g.title, hasCurrent);
                return (
                  <div key={g.title} className="border-b border-line/70 dark:border-dark-border/70 last:border-0">
                    <button
                      type="button"
                      onClick={() => setOpenGroups((s) => ({ ...s, [g.title]: !open }))}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between px-2 py-3.5 text-left text-[15px] font-semibold text-ink dark:text-white"
                    >
                      {g.title}
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <ul className="pb-3 space-y-0.5">
                        {g.pages.map((p) => (
                          <li key={p.slug}>
                            <a
                              href={`#${p.slug}`}
                              className={`block rounded-lg px-3 py-2 text-[14px] ${
                                p.slug === slug
                                  ? "bg-accent/10 font-semibold text-accent dark:text-[#46D9A4]"
                                  : "text-mute dark:text-dark-mute"
                              }`}
                            >
                              {p.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-32 lg:pt-20 pb-12 sm:pb-16 min-w-0">
        <div className="flex items-start min-w-0">
          {/* Desktop sidebar (hidden on phones; they use the sheet above) */}
          <aside className="hidden lg:block lg:fixed lg:top-16 lg:bottom-0 lg:left-[max(1.5rem,calc((100vw-80rem)/2+2rem))] lg:w-64 xl:w-72 lg:py-8 lg:pr-6 lg:border-r lg:border-line dark:lg:border-dark-border overflow-y-auto overscroll-contain space-y-6">
            {groups.map((g) => (
              <div key={g.title} className="space-y-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-mute dark:text-dark-mute">
                  {g.title}
                </p>
                <ul className="space-y-1">
                  {g.pages.map((p) => {
                    const active = p.slug === slug;
                    return (
                      <li key={p.slug}>
                        <a href={`#${p.slug}`} className={linkCls(active)}>
                          {p.label}
                        </a>
                        {active && p.anchors && (
                          <ul className="mt-1 ml-3 space-y-0.5 border-l border-line dark:border-dark-border pl-2">
                            {p.anchors.map((a) => (
                              <li key={a.id}>
                                <a
                                  href={`#${a.id}`}
                                  className={`block rounded-md px-2 py-1 text-[11px] transition-colors ${
                                    activeAnchor === a.id
                                      ? "text-accent dark:text-[#46D9A4] font-semibold"
                                      : "text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white"
                                  }`}
                                >
                                  {a.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="pt-6 border-t border-line dark:border-dark-border space-y-2">
              <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="block text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white">
                GitHub Repository &rarr;
              </a>
              <Link href="/app/agent" className="block text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white">
                Test Console &rarr;
              </Link>
              <a href="https://testnet.nearblocks.io/address/bridle.testnet" target="_blank" rel="noopener noreferrer" className="block text-xs text-mute dark:text-dark-mute hover:text-ink dark:hover:text-white">
                NEAR Testnet Explorer &rarr;
              </a>
            </div>
          </aside>

          <main className="w-full min-w-0 max-w-full lg:pl-72 xl:pl-80 space-y-10">
            {current && (
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-mute dark:text-dark-mute">
                {current.group}
              </p>
            )}
            <DocContent slug={slug} />

            {/* Previous / Next */}
            {(prev || next) && (
              <nav aria-label="Pagination" className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                {prev ? (
                  <a
                    href={`#${prev.slug}`}
                    className="min-w-0 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5 hover:border-ink/40 dark:hover:border-white/40 transition-colors"
                  >
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">← Prev</span>
                    <span className="mt-0.5 block text-[13px] sm:text-sm font-semibold leading-snug text-ink dark:text-white">{prev.label}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next && (
                  <a
                    href={`#${next.slug}`}
                    className="col-start-2 min-w-0 rounded-xl border border-line dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2.5 text-right sm:rounded-2xl sm:px-4 sm:py-3.5 hover:border-ink/40 dark:hover:border-white/40 transition-colors"
                  >
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-mute dark:text-dark-mute">Next →</span>
                    <span className="mt-0.5 block text-[13px] sm:text-sm font-semibold leading-snug text-ink dark:text-white">{next.label}</span>
                  </a>
                )}
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
