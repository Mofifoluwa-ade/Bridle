"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track, type TrackEvent } from "@/lib/track";

const eventFor = (path: string): TrackEvent | null => {
  if (path.startsWith("/api") || path.startsWith("/app/admin")) return null;
  if (path.startsWith("/app/authorize")) return "authorize_open";
  if (path.startsWith("/claim")) return "claim_open";
  if (path.startsWith("/app")) return "app_view";
  return "site_view";
};

/** Counts one anonymous page view per page per browser session. */
export function Track() {
  const path = usePathname();
  useEffect(() => {
    const ev = eventFor(path);
    if (!ev) return;
    try {
      const key = `bridle_seen:${path}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track(ev);
  }, [path]);
  return null;
}
