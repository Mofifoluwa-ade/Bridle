/**
 * The agent link: one personal agent key per owner, carried in the link itself.
 * The key is created in the browser. The agent account is the key's implicit account (its public key in hex),
 * so there is nothing to register: it exists on NEAR once someone sends it a little NEAR for gas.
 * The link can only act as an agent. It cannot create, change, fund, stop or veto a rule.
 */
import { KeyPairEd25519 } from "@near-js/crypto";
import { baseEncode } from "@near-js/utils";
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";

const PREFIX = "bk_";

export type AgentIdentity = { account: string; secret: string; token: string };

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

function fromKey(kp: KeyPairEd25519): AgentIdentity {
  const secret = kp.toString(); // "ed25519:<base58>"
  return { account: hex(kp.getPublicKey().data), secret, token: PREFIX + secret.slice("ed25519:".length) };
}

export function newAgent(): AgentIdentity {
  return fromKey(KeyPairEd25519.fromRandom());
}

/** Read the identity back out of a link token. Returns null when the token is malformed. */
export function agentFromToken(token: string): AgentIdentity | null {
  if (!token.startsWith(PREFIX)) return null;
  const body = token.slice(PREFIX.length);
  if (!/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(body)) return null;
  try {
    return fromKey(new KeyPairEd25519(body));
  } catch {
    return null;
  }
}

const utf8 = (s: string) => new TextEncoder().encode(s);

/** Wallet agents: the key is derived from a signature, so the same wallet gets the same agent in any browser. */
export const WALLET_AGENT_RECIPIENT = "bridle-agent";
export const WALLET_AGENT_NONCE = sha256(utf8("bridle-agent-nonce-v1"));

export function walletAgentMessage(owner: string, index = 1): string {
  return `Create my Bridle agent for ${owner}${index > 1 ? ` (agent number ${index})` : ""}.\n\nThis signs no transaction and moves no funds. The same message always makes the same agent, so it follows your wallet to any browser.`;
}

/** Turn a wallet signature of walletAgentMessage into an agent. Same signature, same agent. */
export function agentFromSignature(signature: string): AgentIdentity {
  const seed = sha256(utf8(`bridle-agent-v1:${signature}`));
  const secret = new Uint8Array(64);
  secret.set(seed);
  secret.set(ed25519.getPublicKey(seed), 32);
  return fromKey(new KeyPairEd25519(baseEncode(secret)));
}

export type AgentKind = "wallet" | "browser";

const KEY = (owner: string) => `bridle.agent.${owner}`;
const KIND = (owner: string) => `bridle.agent.kind.${owner}`;

export function loadAgentKind(owner: string): AgentKind {
  try {
    return localStorage.getItem(KIND(owner)) === "wallet" ? "wallet" : "browser";
  } catch {
    return "browser";
  }
}

export function loadAgent(owner: string): AgentIdentity | null {
  try {
    const t = localStorage.getItem(KEY(owner));
    return t ? agentFromToken(t) : null;
  } catch {
    return null;
  }
}

export function saveAgent(owner: string, a: AgentIdentity, kind: AgentKind = "browser"): void {
  try {
    localStorage.setItem(KEY(owner), a.token);
    localStorage.setItem(KIND(owner), kind);
  } catch {
    /* storage can be blocked; the link shown on screen still works */
  }
}

export function agentLink(origin: string, a: AgentIdentity): string {
  return `${origin}/mcp/${a.token}`;
}
