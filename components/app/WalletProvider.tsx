"use client";

import { NearConnector } from "@hot-labs/near-connect";
import { actionCreators } from "@near-js/transactions";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "@/lib/config";
import { explainError } from "@/lib/near";

type CallArgs = {
  method: string;
  args: Record<string, unknown>;
  /** yoctoNEAR as a string. Defaults to 0. */
  deposit?: string;
  /** Gas in raw units. Defaults to 100 Tgas. */
  gas?: string;
};

type WalletCtx = {
  ready: boolean;
  accountId: string | null;
  signIn: () => void;
  signOut: () => Promise<void>;
  /** Sign and send a function call to the Bridle contract. Throws a readable Error. */
  call: (c: CallArgs) => Promise<string | null>;
};

const Ctx = createContext<WalletCtx | null>(null);

export function useWallet(): WalletCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet must be used inside WalletProvider");
  return c;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const connector = useRef<NearConnector | null>(null);
  const [ready, setReady] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const near = new NearConnector({
      network: CONFIG.network,
      // Bridle submits contract calls on NEAR testnet. This keeps wallets that
      // advertise testnet transaction support (including Meteor) discoverable.
      features: { testnet: true, signAndSendTransaction: true },
    });
    connector.current = near;

    near.on("wallet:signIn", ({ accounts }) => {
      if (!cancelled) setAccountId(accounts[0]?.accountId ?? null);
    });
    near.on("wallet:signOut", () => {
      if (!cancelled) setAccountId(null);
    });

    setReady(true);
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(() => {
    void connector.current?.connect().catch((error: unknown) => {
      console.error("NEAR wallet connection failed:", error);
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!connector.current) return;
    await connector.current.disconnect();
    setAccountId(null);
  }, []);

  const call = useCallback(
    async ({ method, args, deposit = "0", gas = "100000000000000" }: CallArgs) => {
      if (!connector.current || !ready) throw new Error("Wallet connector is still loading. Try again in a second.");
      if (!accountId) throw new Error("Connect your NEAR wallet before submitting this transaction.");
      if (!CONFIG.contractId) throw new Error("NEXT_PUBLIC_BRIDLE_CONTRACT is not set.");
      try {
        const wallet = await connector.current.wallet();
        const out = await wallet.signAndSendTransaction({
          receiverId: CONFIG.contractId,
          actions: [actionCreators.functionCall(method, args, BigInt(gas), BigInt(deposit))],
        });
        // Browser wallets may redirect and return no outcome; extensions can return the transaction.
        return out && "transaction" in out ? (out.transaction.hash as string) : null;
      } catch (error) {
        throw new Error(explainError(error));
      }
    },
    [accountId, ready],
  );

  const value = useMemo<WalletCtx>(
    () => ({ ready, accountId, signIn, signOut, call }),
    [ready, accountId, signIn, signOut, call],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
