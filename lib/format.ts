import { ASSET } from "./config";

const YOCTO = BigInt("1000000000000000000000000");

/** "18.5" -> 18500000n. Returns null when the text is not a valid amount. */
export function parseUnits(text: string, decimals: number = ASSET.decimals): bigint | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  return BigInt(whole + frac.padEnd(decimals, "0"));
}

export function formatUnits(v: string | bigint, decimals: number = ASSET.decimals): string {
  const n = typeof v === "bigint" ? v : BigInt(v);
  const base = BigInt(10) ** BigInt(decimals);
  const whole = n / base;
  const frac = (n % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const w = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${w}.${frac.padEnd(2, "0")}` : `${w}.00`;
}

export const usdc = (v: string | bigint) => `${formatUnits(v)} ${ASSET.symbol}`;

export function parseNear(text: string): bigint | null {
  const v = parseUnits(text, 24);
  return v;
}

export function formatNear(yocto: string | bigint): string {
  const n = typeof yocto === "bigint" ? yocto : BigInt(yocto);
  const whole = n / YOCTO;
  const frac = ((n % YOCTO) * BigInt(10000)) / YOCTO;
  const f = frac.toString().padStart(4, "0").replace(/0+$/, "");
  return `${whole}${f ? "." + f : ""} NEAR`;
}

export function yoctoToNearNumber(yocto: string | bigint): number {
  const n = typeof yocto === "bigint" ? yocto : BigInt(yocto);
  const whole = Number(n / YOCTO);
  const frac = Number(n % YOCTO) / 1e24;
  return +(whole + frac).toFixed(2);
}

export function formatNearWithUsd(yocto: string | bigint, nearPriceUsd = 4.48): string {
  const nearStr = formatNear(yocto);
  const nearNum = yoctoToNearNumber(yocto);
  const usd = (nearNum * nearPriceUsd).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  return `${nearStr} (≈ ${usd})`;
}

export const nsToMs = (ns: string | bigint) => Number(BigInt(ns) / BigInt(1_000_000));

export function shortAddr(a: string, head = 6, tail = 4): string {
  return a.length <= head + tail + 1 ? a : `${a.slice(0, head)}…${a.slice(-tail)}`;
}

export function timeAgo(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function duration(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${+(s / 3600).toFixed(1)} h`;
  return `${+(s / 86400).toFixed(1)} d`;
}

export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Light address checks. The contract stores the string as given, so catch typos here. */
export function validAddress(chain: "Base" | "Solana", a: string): boolean {
  if (chain === "Base") return /^0x[0-9a-fA-F]{40}$/.test(a);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
}

export function validNearAccount(a: string): boolean {
  return /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(a) && a.length >= 2 && a.length <= 64;
}
