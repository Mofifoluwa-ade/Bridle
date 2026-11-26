"use client";

import { useEffect, useState } from "react";

const KEY = "bridle:eth_price";
let cached: { price: number; timestamp: number } | null = null;

async function fetchEthUsdPrice(): Promise<number | null> {
  const now = Date.now();
  if (cached && now - cached.timestamp < 60000) return cached.price;
  const save = (p: number) => {
    const price = +p.toFixed(2);
    cached = { price, timestamp: now };
    try {
      localStorage.setItem(KEY, JSON.stringify(cached));
    } catch {}
    return price;
  };
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
    if (r.ok) {
      const p = Number((await r.json())?.price);
      if (p > 0) return save(p);
    }
  } catch {}
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
    if (r.ok) {
      const p = Number((await r.json())?.ethereum?.usd);
      if (p > 0) return save(p);
    }
  } catch {}
  try {
    const p = Number(JSON.parse(localStorage.getItem(KEY) ?? "null")?.price);
    if (p > 0) return p;
  } catch {}
  return null;
}

/** Approximate ETH price in USD, or null until one is known. No made-up fallback. */
export function useEthPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null);
  useEffect(() => {
    let off = false;
    const load = async () => {
      const p = await fetchEthUsdPrice();
      if (!off && p) setPrice(p);
    };
    load();
    const t = setInterval(load, 60000);
    return () => {
      off = true;
      clearInterval(t);
    };
  }, []);
  return price;
}
