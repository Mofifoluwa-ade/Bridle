// Called by Bridle's own approval page once the owner taps Approve. Returns the redirect back to the AI app.
import { agentFromToken } from "@/lib/agentLink";
import { CODE_TTL, clientRedirectOk, oauthConfigured, oauthJson, seal } from "@/lib/oauth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!oauthConfigured()) return oauthJson({ error: "server_error", error_description: "Sign-in is not configured." }, 503);
  let b: any;
  try {
    b = await req.json();
  } catch {
    return oauthJson({ error: "invalid_request" }, 400);
  }
  const { client_id, redirect_uri, code_challenge, state, token } = b ?? {};
  if (typeof client_id !== "string" || typeof redirect_uri !== "string" || !clientRedirectOk(client_id, redirect_uri))
    return oauthJson({ error: "invalid_request", error_description: "Unknown app or redirect." }, 400);
  if (typeof code_challenge !== "string" || !/^[A-Za-z0-9\-_]{43}$/.test(code_challenge)) return oauthJson({ error: "invalid_request", error_description: "PKCE (S256) is required." }, 400);
  if (typeof token !== "string" || !agentFromToken(token)) return oauthJson({ error: "invalid_request", error_description: "Agent is not valid." }, 400);
  const code = seal("code", { t: token, c: code_challenge, r: redirect_uri, k: client_id }, CODE_TTL);
  const u = new URL(redirect_uri);
  u.searchParams.set("code", code);
  if (typeof state === "string") u.searchParams.set("state", state);
  return oauthJson({ redirect: u.toString() });
}
