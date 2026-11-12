"use client";

import type { ReactNode } from "react";

/** Wraps a grid of cards. The pointer position is written to each [data-spot] child so it can glow. */
export function SpotlightGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      onPointerMove={(e) => {
        const cards = e.currentTarget.querySelectorAll<HTMLElement>("[data-spot]");
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty("--mx", `${e.clientX - r.left}px`);
          c.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      }}
    >
      {children}
    </div>
  );
}
