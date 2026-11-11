/* eslint-disable @next/next/no-img-element */
export type Chain = "near" | "base" | "usdc" | "solana";

const names: Record<Chain, string> = { near: "NEAR", base: "Base", usdc: "USDC", solana: "Solana" };

/** A network or token logo. The files are the official marks from the open-source Web3Icons set (MIT). */
export function ChainLogo({ chain, size = 18, label = true, className = "" }: { chain: Chain; size?: number; label?: boolean; className?: string }) {
  return (
    <img
      src={`/chains/${chain}.svg`}
      width={size}
      height={size}
      alt={label ? names[chain] : ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={`inline-block flex-none rounded-[22%] ${className}`}
    />
  );
}
