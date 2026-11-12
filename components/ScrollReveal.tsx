"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  stagger = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Animate children marked data-reveal-item one after another instead of the block as a whole. */
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      setReady(true);
      setVisible(true);
      return;
    }

    setReady(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${stagger ? "scroll-stagger" : "scroll-reveal"} ${className}`}
      data-reveal-ready={ready ? "true" : "false"}
      data-revealed={visible ? "true" : "false"}
      style={{ "--scroll-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
