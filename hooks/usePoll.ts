"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";
import { explainError } from "@/lib/near";

export type Live<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
  updatedAt: number | null;
};

/** Load once, then refresh on an interval while the tab is visible. `key` null = do not load. */
export function usePoll<T>(key: string | null, load: () => Promise<T>, ms: number = CONFIG.pollMs): Live<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!key);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const loader = useRef(load);
  loader.current = load;

  const run = useCallback(async () => {
    try {
      const d = await loader.current();
      setData(d);
      setError(null);
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(explainError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!key) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    run();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") run();
    }, ms);
    return () => clearInterval(t);
  }, [key, ms, run]);

  return { data, error, loading, refresh: run, updatedAt };
}

/** Re-render every second for countdowns. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
