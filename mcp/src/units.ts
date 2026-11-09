/** USDC has 6 decimals; native NEAR has 24. The contract works in integers of the smallest unit. */
export const DECIMALS = 6;
export const NEAR_DECIMALS = 24;

/** The decimals for an asset symbol. */
export function decimalsOf(asset: string): number {
  return asset.toUpperCase() === "NEAR" ? NEAR_DECIMALS : DECIMALS;
}

/** "18.5" -> 18500000n. Returns null for anything that is not a plain decimal amount. */
export function parseAmount(text: string, decimals: number): bigint | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  return BigInt(whole + frac.padEnd(decimals, "0"));
}

/** 18500000n -> "18.50". Always at least two decimals, trims the rest. */
export function formatAmount(v: bigint | string, decimals: number): string {
  const n = typeof v === "bigint" ? v : BigInt(v);
  const s = n.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals);
  let frac = s.slice(-decimals).replace(/0+$/, "");
  if (frac.length < 2) frac = frac.padEnd(2, "0");
  return `${whole}.${frac}`;
}

export const parseUsdc = (text: string) => parseAmount(text, DECIMALS);
export const formatUsdc = (v: bigint | string) => formatAmount(v, DECIMALS);
