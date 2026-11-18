import { ACCESS_TTL, OAUTH_CORS, issueAccess, issueRefresh, oauthConfigured, oauthJson, open, pkceOk } from "@/lib/oauth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (error: string, description: string, status = 400) => oauthJson({ error, error_description: description }, status);

export async function POST(req: Request) {
  if (!oauthConfigured()) return err("server_error", "Sign-in is not configured.", 503);
  let p: Record<string, string> = {};
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) p = await req.json();
    else p = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return err("invalid_request", "Could not read the request.");
  }

  if (p.grant_type === "authorization_code") {
    const r = open<{ t: string; c: string; r: string; k: string }>("code", p.code ?? "");
    if (!r.ok) return err("invalid_grant", r.reason === "expired" ? "The sign-in code expired. Try connecting again." : "The sign-in code is not valid.");
    if (r.data.r !== p.redirect_uri) return err("invalid_grant", "Redirect does not match.");
    if (p.client_id && p.client_id !== r.data.k) return err("invalid_grant", "Client does not match.");
    if (!pkceOk(p.code_verifier ?? "", r.data.c)) return err("invalid_grant", "PKCE check failed.");
    return oauthJson({ access_token: issueAccess(r.data.t), token_type: "Bearer", expires_in: ACCESS_TTL, refresh_token: issueRefresh(r.data.t), scope: "agent" });
  }

  if (p.grant_type === "refresh_token") {
    const r = open<{ t: string }>("refresh", p.refresh_token ?? "");
    if (!r.ok) return err("invalid_grant", "Your Bridle sign-in has expired. Connect again.");
    return oauthJson({ access_token: issueAccess(r.data.t), token_type: "Bearer", expires_in: ACCESS_TTL, refresh_token: issueRefresh(r.data.t), scope: "agent" });
  }

  return err("unsupported_grant_type", "Use authorization_code or refresh_token.");
}
export const OPTIONS = () => new Response(null, { status: 204, headers: OAUTH_CORS });
