"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/components/app/WalletProvider";
import {
  type AgentIdentity,
  type AgentKind,
  WALLET_AGENT_NONCE,
  WALLET_AGENT_RECIPIENT,
  agentFromSignature,
  agentFromToken,
  loadAgent,
  loadAgentKind,
  newAgent,
  saveAgent,
  walletAgentMessage,
} from "@/lib/agentLink";
import { parseNear } from "@/lib/format";
import { accountExists, api } from "@/lib/near";

export const FUND = "0.1";

/** The connected wallet's personal agent: load, create from a signature, import, fund. Shared by Connect and the approval page. */
export function useWalletAgent() {
  const { accountId, transfer, signMessage } = useWallet();
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [kind, setKind] = useState<AgentKind>("browser");
  const [funded, setFunded] = useState<boolean | null>(null);
  const [rules, setRules] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setAgent(accountId ? loadAgent(accountId) : null);
    setKind(accountId ? loadAgentKind(accountId) : "browser");
    setErr(null);
  }, [accountId]);

  const refresh = useCallback(async () => {
    if (!agent) return;
    setFunded(await accountExists(agent.account));
    try {
      setRules((await api.mandatesFor(agent.account)).filter((m) => m.agent === agent.account).length);
    } catch {
      setRules(null);
    }
  }, [agent]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const adopt = useCallback(
    (a: AgentIdentity, k: AgentKind) => {
      if (!accountId) return;
      saveAgent(accountId, a, k);
      setAgent(a);
      setKind(k);
      setFunded(null);
      setRules(null);
    },
    [accountId],
  );

  // The agent is a function of a wallet signature, so the same wallet gets the same agent in any browser.
  const createFromWallet = useCallback(async () => {
    if (!accountId) return;
    setBusy(true);
    setErr(null);
    try {
      const msg = walletAgentMessage(accountId);
      const first = await signMessage(msg, WALLET_AGENT_RECIPIENT, WALLET_AGENT_NONCE);
      const second = await signMessage(msg, WALLET_AGENT_RECIPIENT, WALLET_AGENT_NONCE);
      if (first !== second) throw new Error("This wallet signs differently each time, so it cannot recreate the same agent on another device. Use a browser-only agent instead.");
      adopt(agentFromSignature(first), "wallet");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The wallet did not sign.");
    } finally {
      setBusy(false);
    }
  }, [accountId, signMessage, adopt]);

  const createInBrowser = useCallback(() => adopt(newAgent(), "browser"), [adopt]);

  /** Accept an existing agent link or bare token. Returns an error message, or null on success. */
  const importLink = useCallback(
    (text: string): string | null => {
      const m = /bk_[1-9A-HJ-NP-Za-km-z]+/.exec(text);
      const a = m ? agentFromToken(m[0]) : null;
      if (!a) return "That does not look like a Bridle agent link.";
      adopt(a, "browser");
      return null;
    },
    [adopt],
  );

  const fund = useCallback(async () => {
    if (!agent) return;
    setBusy(true);
    setErr(null);
    try {
      const y = parseNear(FUND);
      await transfer(agent.account, (y ?? BigInt(0)).toString());
      // A wallet can return before the chain has the account; check a few times.
      for (let i = 0; i < 6; i++) {
        if ((await accountExists(agent.account)) === true) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The transfer did not go through.");
    } finally {
      setBusy(false);
    }
  }, [agent, transfer, refresh]);

  return { accountId, agent, kind, funded, rules, busy, err, setErr, createFromWallet, createInBrowser, importLink, fund, refresh };
}
