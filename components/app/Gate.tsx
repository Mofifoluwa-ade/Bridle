"use client";

import type { ReactNode } from "react";
import { CONFIG } from "@/lib/config";
import { Btn, Card, Empty } from "./ui";
import { useWallet } from "./WalletProvider";

/** Blocks a page until a wallet is connected. */
export function NeedsWallet({ children, why }: { children: ReactNode; why: string }) {
  const { accountId, signIn, ready } = useWallet();
  if (accountId) return <>{children}</>;
  return (
    <Card>
      <Empty
        title="Connect a testnet wallet"
        action={
          <Btn onClick={signIn} disabled={!ready}>
            {ready ? "Connect wallet" : "Loading wallet"}
          </Btn>
        }
      >
        {why}
      </Empty>
    </Card>
  );
}

export function NeedsContract({ children }: { children: ReactNode }) {
  if (CONFIG.contractId) return <>{children}</>;
  return (
    <Card>
      <Empty title="Contract not configured">Set NEXT_PUBLIC_BRIDLE_CONTRACT to your testnet deployment to load real data.</Empty>
    </Card>
  );
}
