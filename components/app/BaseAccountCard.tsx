"use client";

import { useEffect, useState, useCallback } from "react";
import { QrCode } from "@/components/app/QrCode";
import { Btn, Card, Label, Notice } from "@/components/app/ui";
import { CONFIG } from "@/lib/config";
import { fetchBaseBalances, type BaseBalances } from "@/lib/baseBalances";
import { mandateAddress } from "@/lib/derive";
import type { Mandate } from "@/lib/types";

export function BaseAccountCard({
  mandate,
  isOwner,
  onWithdrawBase,
  withdrawing,
}: {
  mandate: Mandate;
  isOwner: boolean;
  onWithdrawBase?: (amount: string, recipient: string) => Promise<void>;
  withdrawing?: boolean;
}) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balances, setBalances] = useState<BaseBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wdAmount, setWdAmount] = useState("");
  const [wdRecipient, setWdRecipient] = useState("");
  const [wdError, setWdError] = useState<string | null>(null);

  // Compute derived address
  useEffect(() => {
    try {
      if (CONFIG.contractId) {
        const addr = mandateAddress(CONFIG.network, CONFIG.contractId, mandate.id);
        setAddress(addr);
      }
    } catch (e) {
      console.error("Failed to derive Base address:", e);
    }
  }, [mandate.id]);

  const loadBalances = useCallback(async (addr: `0x${string}`) => {
    setLoading(true);
    setError(null);
    try {
      const b = await fetchBaseBalances(addr);
      setBalances(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch Base balances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      loadBalances(address);
    }
  }, [address, loadBalances]);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!mandate.chains.includes("Base")) return null;

  const expiredOrRevoked = mandate.state === "Revoked" || Date.now() >= Number(BigInt(mandate.expires_at) / 1_000_000n);
  const hasUsdc = balances && balances.rawUsdc > 0n;
  const needsGas = balances && balances.rawEth < 1_000_000_000_000_000n; // < 0.001 ETH

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label>Base account (EVM)</Label>
        <button
          type="button"
          onClick={() => address && loadBalances(address)}
          disabled={loading || !address}
          className="text-xs text-mute hover:text-ink dark:hover:text-white transition-colors"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      <p className="text-xs sm:text-[14px] leading-relaxed text-mute">
        The MPC signer controls this Base Sepolia address for this rule. Fund it with testnet USDC and a little ETH for gas.
      </p>

      {address ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-paper p-3 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-mute">Deposit address</span>
              <a
                href={`https://sepolia.basescan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent hover:underline dark:text-accent-dark"
              >
                BaseScan ↗
              </a>
            </div>
            <p className="mt-1 break-all font-mono text-[13px] font-medium leading-relaxed">
              {address}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="outline" onClick={copy}>
              {copied ? "Copied" : "Copy address"}
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => setShowQr((v) => !v)}>
              {showQr ? "Hide QR" : "Show QR"}
            </Btn>
          </div>

          {showQr && (
            <div className="mt-3 flex justify-center rounded-xl border border-line p-4 dark:border-dark-border bg-white dark:bg-dark-bg">
              <QrCode value={address} label="Base deposit address" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line dark:border-dark-border">
            <div>
              <span className="text-[13px] text-mute">USDC Balance</span>
              <p className="font-mono text-[18px] font-semibold mt-0.5">
                {balances ? `$${balances.usdc}` : loading ? "…" : "—"}
              </p>
            </div>
            <div>
              <span className="text-[13px] text-mute">ETH Gas</span>
              <p className="font-mono text-[18px] font-semibold mt-0.5">
                {balances ? `${balances.eth} ETH` : loading ? "…" : "—"}
              </p>
            </div>
          </div>

          {needsGas && (
            <Notice tone="warn" title="Low gas balance on Base">
              <p className="text-xs leading-relaxed">
                This address holds under 0.001 Base Sepolia ETH. Payments may stall until you send a little testnet ETH to pay for the ERC-20 transfer gas.
              </p>
            </Notice>
          )}

          {error && <p className="text-xs text-bad">{error}</p>}

          {/* Owner rescue option if mandate ended and funds remain */}
          {isOwner && expiredOrRevoked && hasUsdc && onWithdrawBase && (
            <div className="pt-2 border-t border-line dark:border-dark-border">
              {!showWithdraw ? (
                <Btn
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowWithdraw(true);
                    setWdAmount(balances.usdc);
                  }}
                >
                  Withdraw remaining USDC
                </Btn>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-mute font-medium">Reclaim USDC to your Base wallet</p>
                  <input
                    type="text"
                    placeholder="Destination 0x... address"
                    value={wdRecipient}
                    onChange={(e) => setWdRecipient(e.target.value.trim())}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-xs outline-none dark:border-dark-border dark:bg-dark-bg"
                  />
                  <input
                    type="text"
                    placeholder="Amount in USDC"
                    value={wdAmount}
                    onChange={(e) => setWdAmount(e.target.value.trim())}
                    className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-xs outline-none dark:border-dark-border dark:bg-dark-bg"
                  />
                  {wdError && <p className="text-xs text-bad">{wdError}</p>}
                  <div className="flex gap-2">
                    <Btn
                      size="sm"
                      busy={withdrawing}
                      disabled={!wdRecipient || !wdAmount}
                      onClick={async () => {
                        setWdError(null);
                        if (!/^0x[0-9a-fA-F]{40}$/.test(wdRecipient)) {
                          setWdError("Invalid EVM address");
                          return;
                        }
                        try {
                          await onWithdrawBase(wdAmount, wdRecipient);
                          setShowWithdraw(false);
                        } catch (err: unknown) {
                          setWdError(err instanceof Error ? err.message : "Withdrawal failed");
                        }
                      }}
                    >
                      Withdraw
                    </Btn>
                    <Btn size="sm" variant="outline" onClick={() => setShowWithdraw(false)}>
                      Cancel
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-mute">Calculating derived address…</p>
      )}
    </Card>
  );
}

