import { OAUTH_CORS, oauthJson, originOf } from "@/lib/oauth";
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const o = originOf(req);
  return oauthJson({ resource: `${o}/mcp`, authorization_servers: [o], bearer_methods_supported: ["header"], resource_name: "Bridle agent" });
}
export const OPTIONS = () => new Response(null, { status: 204, headers: OAUTH_CORS });
