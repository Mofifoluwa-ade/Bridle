"use client";

import "@near-wallet-selector/modal-ui/styles.css";
import { setupWalletSelector, type WalletSelector } from "@near-wallet-selector/core";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
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
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const modal = useRef<WalletSelectorModal | null>(null);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const s = await setupWalletSelector({
        network: CONFIG.network,
        modules: [setupMyNearWallet()],
      });
      if (cancelled) return;
      modal.current = setupModal(s, { contractId: CONFIG.contractId || "bridle.testnet" });
      setSelector(s);
      const first = s.store.getState().accounts.find((a) => a.active);
      setAccountId(first?.accountId ?? null);
      sub = s.store.observable.subscribe((st: any) => {
        setAccountId(st.accounts.find((a: any) => a.active)?.accountId ?? null);
      });
    })().catch(() => {
      /* wallet modules failed to load; the UI shows a signed-out state */
    });
    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(() => modal.current?.show(), []);

  const signOut = useCallback(async () => {
    if (!selector) return;
    const w = await selector.wallet();
    await w.signOut();
  }, [selector]);

  const call = useCallback(
    async ({ method, args, deposit = "0", gas = "100000000000000" }: CallArgs) => {
      if (!selector) throw new Error("Wallet is still loading. Try again in a second.");
      if (!CONFIG.contractId) throw new Error("NEXT_PUBLIC_BRIDLE_CONTRACT is not set.");
      try {
        const w = await selector.wallet();
        const out = await w.signAndSendTransaction({
          receiverId: CONFIG.contractId,
          actions: [actionCreators.functionCall(method, args, BigInt(gas), BigInt(deposit))],
        });
        // Browser wallets redirect and return void; extension wallets return the outcome.
        return out && "transaction" in out ? (out.transaction.hash as string) : null;
      } catch (e) {
        throw new Error(explainError(e));
      }
    },
    [selector],
  );

  const value = useMemo<WalletCtx>(
    () => ({ ready: !!selector, accountId, signIn, signOut, call }),
    [selector, accountId, signIn, signOut, call],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
