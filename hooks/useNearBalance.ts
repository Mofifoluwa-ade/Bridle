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
  refresh: () => void;
};

let cachedPrice: { price: number; timestamp: number } | null = null;

export async function fetchNearUsdPrice(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && now - cachedPrice.timestamp < 60000) {
    return cachedPrice.price;
  }

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd",
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      const p = Number(data?.near?.usd);
      if (p && !isNaN(p) && p > 0) {
        cachedPrice = { price: p, timestamp: now };
        try {
          localStorage.setItem("bridle:near_price", JSON.stringify({ price: p, timestamp: now }));
        } catch {}
        return p;
      }
    }
  } catch {}

  // Try local storage cache
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

export function useAccountBalance(customAccount?: string | null): BalanceState {
  const { accountId } = useWallet();
  // Strictly use connected accountId, or customAccount if passed explicitly. Never fallback to contract or dummy accounts!
  const targetAccount = customAccount !== undefined ? customAccount : accountId;
  const { price } = useNearPrice();

  const [yocto, setYocto] = useState<string>("0");
  const [near, setNear] = useState<number>(0);
  const [totalNear, setTotalNear] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(Boolean(targetAccount));

  const fetchBalance = useCallback(async () => {
    if (!targetAccount) {
      setYocto("0");
      setNear(0);
      setTotalNear(0);
      setLoading(false);
      return;
    }
    setLoading(true);
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
    } catch {
      // Keep previous or 0 on failure
    } finally {
      setLoading(false);
    }
  }, [targetAccount]);

  useEffect(() => {
    if (!targetAccount) {
      setYocto("0");
      setNear(0);
      setTotalNear(0);
      setLoading(false);
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

  return {
    account: targetAccount ?? null,
    isConnected: Boolean(targetAccount),
    yocto,
    near,
    totalNear,
    nearFormatted: `${near} NEAR`,
    usd: usdFormatted,
    price,
    loading,
    refresh: fetchBalance,
  };
}
