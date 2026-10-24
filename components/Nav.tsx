"use client";

import { useState, useEffect } from "react";
import { Container, PrimaryButton } from "./Container";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#principles", label: "Principles" },
  { href: "#edges", label: "Limits" },
];

export function Nav() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  return (
    <Container>
      <nav
        aria-label="Primary"
        className="flex flex-wrap items-center justify-between gap-4 py-7"
      >
        <a href="#top" className="text-ink dark:text-white transition-opacity hover:opacity-85">
          <Logo />
        </a>

        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] text-mute dark:text-dark-mute transition-colors hover:text-ink dark:hover:text-white"
            >
              {l.label}
            </a>
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
      </nav>
    </Container>
  );
}
