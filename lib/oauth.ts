// Stateless OAuth 2.1 for the hosted MCP endpoint. Nothing is stored: client ids, codes and tokens are
// sealed (AES-256-GCM) or signed with a server secret. The agent key travels inside the sealed token.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { agentFromToken, type AgentIdentity } from "@/lib/agentLink";

export const ACCESS_TTL = 60 * 60; // 1 hour
export const REFRESH_TTL = 60 * 60 * 24 * 90; // 90 days
export const CODE_TTL = 5 * 60;

const b64u = (b: Buffer) => b.toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");

function secret(): Buffer | null {
  const s = process.env.MCP_TOKEN_SECRET?.trim();
  return s && s.length >= 16 ? Buffer.from(s, "utf8") : null;
}
export const oauthConfigured = () => secret() !== null;

const keyFor = (purpose: string) => createHmac("sha256", secret() ?? Buffer.alloc(0)).update(`bridle-oauth:${purpose}`).digest();

/** Seal an object so only this server can read or change it. */
export function seal(purpose: string, data: Record<string, unknown>, ttlSeconds: number): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFor(purpose), iv);
  const body = Buffer.concat([c.update(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds }), "utf8"), c.final()]);
  return b64u(Buffer.concat([iv, c.getAuthTag(), body]));
}

export type Opened<T> = { ok: true; data: T } | { ok: false; reason: "invalid" | "expired" };

export function open<T = Record<string, unknown>>(purpose: string, token: string): Opened<T> {
  try {
    const raw = fromB64u(token);
    const d = createDecipheriv("aes-256-gcm", keyFor(purpose), raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    const data = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return { ok: false, reason: "expired" };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

// --- Clients (dynamic registration, stateless) ---

const HOSTS = new Set(["claude.ai", "claude.com", "www.claude.ai", "chatgpt.com"]);

/** Only the big AI apps and local tools may receive codes. Anything else is refused. */
export function redirectAllowed(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.username || u.password || u.hash) return false;
    if (u.protocol === "https:") return HOSTS.has(u.hostname);
    if (u.protocol === "http:") return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    return false;
  } catch {
    return false;
  }
}

const sig = (payload: string) => b64u(createHmac("sha256", keyFor("client")).update(payload).digest()).slice(0, 32);

export type ClientInfo = { name: string; redirect_uris: string[] };

export function makeClientId(c: ClientInfo): string {
  const payload = b64u(Buffer.from(JSON.stringify(c), "utf8"));
  return `bc.${payload}.${sig(payload)}`;
}

export function readClientId(id: string): ClientInfo | null {
  const [tag, payload, s] = id.split(".");
  if (tag !== "bc" || !payload || !s) return null;
  const want = Buffer.from(sig(payload));
  const got = Buffer.from(s);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const c = JSON.parse(fromB64u(payload).toString("utf8")) as ClientInfo;
    return Array.isArray(c.redirect_uris) ? c : null;
  } catch {
    return null;
  }
}

/** A client id is valid for a redirect only if it was registered with that exact redirect. */
export function clientRedirectOk(clientId: string, redirectUri: string): ClientInfo | null {
  const c = readClientId(clientId);
  return c && c.redirect_uris.includes(redirectUri) && redirectAllowed(redirectUri) ? c : null;
}

// --- PKCE ---

export function pkceOk(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  const want = Buffer.from(createHash("sha256").update(verifier).digest("base64url"));
  const got = Buffer.from(challenge);
  return want.length === got.length && timingSafeEqual(want, got);
}

// --- Access tokens for the MCP endpoint ---

export function issueAccess(agentToken: string): string {
  return seal("access", { t: agentToken }, ACCESS_TTL);
}
export function issueRefresh(agentToken: string): string {
  return seal("refresh", { t: agentToken }, REFRESH_TTL);
}

export function agentFromBearer(header: string | null): { agent: AgentIdentity } | { error: "missing" | "invalid" | "expired" | "unconfigured" } {
  if (!oauthConfigured()) return { error: "unconfigured" };
  const m = /^Bearer\s+(.+)$/i.exec(header ?? "");
  if (!m) return { error: "missing" };
  const r = open<{ t: string }>("access", m[1].trim());
  if (!r.ok) return { error: r.reason };
  const agent = agentFromToken(r.data.t);
  return agent ? { agent } : { error: "invalid" };
}

export const originOf = (req: Request) => new URL(req.url).origin;

export const OAUTH_CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, mcp-protocol-version",
};
export const oauthJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...OAUTH_CORS } });
