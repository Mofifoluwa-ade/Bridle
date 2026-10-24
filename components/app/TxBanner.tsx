"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CONFIG } from "@/lib/config";
import { Notice } from "./ui";

function Inner({ what }: { what: string }) {
  const hash = useSearchParams().get("transactionHashes");
  if (!hash) return null;
  const h = hash.split(",").pop()!;
  return (
    <div className="mb-6">
      <Notice tone="ok" title={`${what} sent`}>
        Transaction{" "}
        <a className="font-mono text-[14px] underline" href={`${CONFIG.explorer}/txns/${h}`} target="_blank" rel="noreferrer">
          {h.slice(0, 10)}…
        </a>{" "}
        is on {CONFIG.network}. The page below reads the contract directly.
      </Notice>
    </div>
  );
}

/** After a browser-wallet redirect, the wallet adds ?transactionHashes=. Show it once. */
export function TxBanner({ what = "Transaction" }: { what?: string }) {
  return (
    <Suspense fallback={null}>
      <Inner what={what} />
    </Suspense>
  );
}
