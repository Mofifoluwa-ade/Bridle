"use client";

import { useEffect, useRef } from "react";

/**
 * A thin progress line at the top of the page. It also publishes the page scroll as a CSS
 * variable (--scroll, 0 to 1) so backgrounds can drift slowly. No dependency; one passive listener.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      document.documentElement.style.setProperty("--scroll", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-accent dark:bg-accent-dark" />
    </div>
  );
}
