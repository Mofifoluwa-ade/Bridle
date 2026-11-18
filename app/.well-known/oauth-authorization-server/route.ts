import { OAUTH_CORS, oauthJson, originOf } from "@/lib/oauth";
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const o = originOf(req);
  return oauthJson({
    issuer: o,
    authorization_endpoint: `${o}/app/authorize`,
    token_endpoint: `${o}/api/oauth/token`,
    registration_endpoint: `${o}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["agent"],
  });
}
export const OPTIONS = () => new Response(null, { status: 204, headers: OAUTH_CORS });
