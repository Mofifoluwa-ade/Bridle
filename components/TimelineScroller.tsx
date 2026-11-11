"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A horizontal timeline that keeps going past the edge. On wide screens it scrolls sideways, fades out on the right while
 * there is more, and has arrows so a mouse can reach every point. On small screens the timeline is a plain vertical list.
 */
export function TimelineScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [prev, setPrev] = useState(false);
  const [next, setNext] = useState(true);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPrev(el.scrollLeft > 4);
    setNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  const arrow =
    "grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink transition-all hover:border-ink disabled:pointer-events-none disabled:opacity-30 dark:border-dark-border dark:bg-dark-card dark:text-white dark:hover:border-white";

  return (
    <div className="relative">
      <div className="absolute -top-[68px] right-0 hidden gap-2 md:flex">
        <button type="button" aria-label="Earlier on the roadmap" onClick={() => go(-1)} disabled={!prev} className={arrow}>←</button>
        <button type="button" aria-label="Later on the roadmap" onClick={() => go(1)} disabled={!next} className={arrow}>→</button>
      </div>
      <div
        ref={ref}
        onScroll={sync}
        className="md:overflow-x-auto md:pb-2 md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
        style={next ? { WebkitMaskImage: "linear-gradient(to right, #000 88%, transparent)", maskImage: "linear-gradient(to right, #000 88%, transparent)" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
