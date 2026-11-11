"use client";

import { useEffect, useRef } from "react";

const CELL = 56;

/**
 * The hero grid, brought to life. Near the pointer the grid lines glow emerald, a soft light trails behind the
 * cursor, and the cell under it lights up. It only runs where there is a real hover, and never with reduced motion.
 */
export function HeroGrid() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;

    const tick = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      el.style.setProperty("--gx", `${x}px`);
      el.style.setProperty("--gy", `${y}px`);
      raf = Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      if (py < 0 || py > r.height) {
        if (on) { on = false; el.dataset.on = "false"; }
        return;
      }
      tx = px; ty = py;
      if (!on) { x = px; y = py; on = true; el.dataset.on = "true"; }
      el.style.setProperty("--cx", `${Math.floor(px / CELL) * CELL}px`);
      el.style.setProperty("--cy", `${Math.floor(py / CELL) * CELL}px`);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => { on = false; el.dataset.on = "false"; };

    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} aria-hidden data-on="false" className="hero-live pointer-events-none absolute inset-x-0 -top-24 h-[640px]">
      <div className="hero-live-lines" />
      <div className="hero-live-glow" />
      <div className="hero-live-cell" />
    </div>
  );
}
