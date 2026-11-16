/**
 * The agent link: one personal agent key per owner, carried in the link itself.
 * The key is created in the browser. The agent account is the key's implicit account (its public key in hex),
 * so there is nothing to register: it exists on NEAR once someone sends it a little NEAR for gas.
 * The link can only act as an agent. It cannot create, change, fund, stop or veto a rule.
 */
import { KeyPairEd25519 } from "@near-js/crypto";

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

const KEY = (owner: string) => `bridle.agent.${owner}`;

export function loadAgent(owner: string): AgentIdentity | null {
  try {
    const t = localStorage.getItem(KEY(owner));
    return t ? agentFromToken(t) : null;
  } catch {
    return null;
  }
}

export function saveAgent(owner: string, a: AgentIdentity): void {
  try {
    localStorage.setItem(KEY(owner), a.token);
  } catch {
    /* storage can be blocked; the link shown on screen still works */
  }
}

export function agentLink(origin: string, a: AgentIdentity): string {
  return `${origin}/mcp/${a.token}`;
}
