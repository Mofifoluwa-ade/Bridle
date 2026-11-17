// Dynamic client registration. Stateless: the client id is a signed copy of its registration.
import { OAUTH_CORS, makeClientId, oauthConfigured, oauthJson, redirectAllowed } from "@/lib/oauth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!oauthConfigured()) return oauthJson({ error: "server_error", error_description: "Sign-in is not configured." }, 503);
  let b: any;
  try {
    b = await req.json();
  } catch {
    return oauthJson({ error: "invalid_client_metadata" }, 400);
  }
  const uris: string[] = Array.isArray(b?.redirect_uris) ? b.redirect_uris.filter((u: unknown) => typeof u === "string") : [];
  if (!uris.length || uris.length > 5 || !uris.every(redirectAllowed))
    return oauthJson({ error: "invalid_redirect_uri", error_description: "Only Claude, ChatGPT and local tools can connect to Bridle." }, 400);
  const name = typeof b?.client_name === "string" ? b.client_name.slice(0, 60) : "An AI app";
  return oauthJson(
    {
      client_id: makeClientId({ name, redirect_uris: uris }),
      client_name: name,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    201,
  );
}
export const OPTIONS = () => new Response(null, { status: 204, headers: OAUTH_CORS });
