// The plain Bridle address (https://<host>/mcp). AI apps find the OAuth sign-in from the 401 below,
// send the owner to approve in Bridle, then call this endpoint with a bearer token.
import { methodNotAllowed, preflight, rpcError, json, serve } from "@/lib/hostedMcp";
import { agentFromBearer, originOf } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const origin = originOf(req);
  const r = agentFromBearer(req.headers.get("authorization"));
  if ("error" in r) {
    if (r.error === "unconfigured") return json(rpcError(null, -32002, "Sign-in is not configured on this server."), 503);
    const res = json(rpcError(null, -32001, r.error === "missing" ? "Sign in with Bridle to use this connector." : "Your Bridle sign-in has expired or is not valid."), 401);
    const params = [`resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"`];
    if (r.error !== "missing") params.push(`error="invalid_token"`);
    res.headers.set("www-authenticate", `Bearer ${params.join(", ")}`);
    return res;
  }
  return serve(req, r.agent);
}

export const GET = methodNotAllowed;
export const OPTIONS = preflight;
