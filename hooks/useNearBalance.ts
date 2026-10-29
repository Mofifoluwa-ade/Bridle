"use client";

import { useCallback, useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { useWallet } from "@/components/app/WalletProvider";

type BalanceState = {
  account: string | null;
  isConnected: boolean;
  yocto: string;
  near: number;
  totalNear: number;
  nearFormatted: string;
  usd: string;
  price: number;
  loading: boolean;
  isUpdating: boolean;
  statusText: string;
  refresh: () => void;
};

let cachedPrice: { price: number; timestamp: number } | null = null;

export async function fetchNearUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cachedPrice.timestamp < 60000) {
    return cachedPrice.price;
  }

  // 1. Try Binance ticker (fast, high rate-limit ceiling)
  try {
    const bRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT");
    if (bRes.ok) {
      const bData = await bRes.json();
      const p = Number(bData?.price);
      if (p && !isNaN(p) && p > 0) {
        const rounded = +p.toFixed(2);
        cachedPrice = { price: rounded, timestamp: now };
        try {
          localStorage.setItem("bridle:near_price", JSON.stringify({ price: rounded, timestamp: now }));
        } catch {}
        return rounded;
      }
    }
  } catch {}

  // 2. Try CoinGecko fallback
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd",
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      const p = Number(data?.near?.usd);
      if (p && !isNaN(p) && p > 0) {
        const rounded = +p.toFixed(2);
        cachedPrice = { price: rounded, timestamp: now };
        try {
          localStorage.setItem("bridle:near_price", JSON.stringify({ price: rounded, timestamp: now }));
        } catch {}
        return rounded;
      }
    }
  } catch {}

  // 3. Try local storage cache
  try {
    const stored = localStorage.getItem("bridle:near_price");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.price && !isNaN(parsed.price)) {
        return Number(parsed.price);
      }
    }
  } catch {}

  return 4.48; // Sensible market baseline
}

export function useNearPrice(): { price: number; loading: boolean } {
  const [price, setPrice] = useState<number>(() => {
    if (cachedPrice) return cachedPrice.price;
    try {
      const stored = localStorage.getItem("bridle:near_price");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.price) return Number(parsed.price);
      }
    } catch {}
    return 4.48;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const p = await fetchNearUsdPrice();
      if (!cancelled) {
        setPrice(p);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { price, loading };
}

function getStoredBalance(account: string | null | undefined) {
  if (!account || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`bridle:balance:${account}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.near === "number") {
        return parsed as { yocto: string; near: number; totalNear: number; time: number };
      }
    }
  } catch {}
  return null;
}

export function useAccountBalance(customAccount?: string | null): BalanceState {
  const { accountId } = useWallet();
  const targetAccount = customAccount !== undefined ? customAccount : accountId;
  const { price } = useNearPrice();

  const stored = getStoredBalance(targetAccount);
  const [yocto, setYocto] = useState<string>(() => stored?.yocto ?? "0");
  const [near, setNear] = useState<number>(() => stored?.near ?? 0);
  const [totalNear, setTotalNear] = useState<number>(() => stored?.totalNear ?? 0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(stored));
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (!targetAccount) {
      setYocto("0");
      setNear(0);
      setTotalNear(0);
      setHasLoadedOnce(false);
      setIsUpdating(false);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(CONFIG.rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "balance",
          method: "query",
          params: {
            request_type: "view_account",
            finality: "optimistic",
            account_id: targetAccount,
          },
        }),
      });

      if (!res.ok) throw new Error("RPC error");
      const body = await res.json();
      const amountStr = body.result?.amount ?? "0";
      const storageBytes = Number(body.result?.storage_usage ?? 0);

      const availableYocto = BigInt(amountStr);
      const storageYocto = BigInt(storageBytes) * BigInt("10000000000000000000"); // 10^19 yoctoNEAR/byte
      const totalYocto = availableYocto + storageYocto;

      const wholeAvail = Number(availableYocto / BigInt("1000000000000000000000000"));
      const fracAvail = Number(availableYocto % BigInt("1000000000000000000000000")) / 1e24;
      const calcNear = +(wholeAvail + fracAvail).toFixed(2);

      const wholeTotal = Number(totalYocto / BigInt("1000000000000000000000000"));
      const fracTotal = Number(totalYocto % BigInt("1000000000000000000000000")) / 1e24;
      const calcTotal = +(wholeTotal + fracTotal).toFixed(2);

      setYocto(amountStr);
      setNear(calcNear);
      setTotalNear(calcTotal);
      setHasLoadedOnce(true);

      try {
        localStorage.setItem(
          `bridle:balance:${targetAccount}`,
          JSON.stringify({ yocto: amountStr, near: calcNear, totalNear: calcTotal, time: Date.now() })
        );
      } catch {}
    } catch {
      // Keep previous cached values on failure
    } finally {
      setIsUpdating(false);
    }
  }, [targetAccount]);

  useEffect(() => {
    if (!targetAccount) {
      setYocto("0");
      setNear(0);
      setTotalNear(0);
      setHasLoadedOnce(false);
      setIsUpdating(false);
      return;
    }
    fetchBalance();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchBalance();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance, targetAccount]);

  const usdValue = +(near * price).toFixed(2);
  const usdFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(usdValue);

  const statusText = isUpdating ? "Updating price…" : "Updated price";

  return {
    account: targetAccount ?? null,
    isConnected: Boolean(targetAccount),
    yocto,
    near,
    totalNear,
    nearFormatted: `${near} NEAR`,
    usd: usdFormatted,
    price,
    loading: !hasLoadedOnce && isUpdating,
    isUpdating,
    statusText,
    refresh: fetchBalance,
  };
}
