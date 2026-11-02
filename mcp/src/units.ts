/** USDC has 6 decimals. The contract works in integers of the smallest unit. */
export const DECIMALS = 6;

/** "18.5" -> 18500000n. Returns null for anything that is not a plain decimal amount. */
export function parseUsdc(text: string): bigint | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  if (frac.length > DECIMALS) return null;
  return BigInt(whole + frac.padEnd(DECIMALS, "0"));
}

/** 18500000n -> "18.50". Always at least two decimals, trims the rest. */
export function formatUsdc(v: bigint | string): string {
  const n = typeof v === "bigint" ? v : BigInt(v);
  const s = n.toString().padStart(DECIMALS + 1, "0");
  const whole = s.slice(0, -DECIMALS);
  let frac = s.slice(-DECIMALS).replace(/0+$/, "");
  if (frac.length < 2) frac = frac.padEnd(2, "0");
  return `${whole}.${frac}`;
}
