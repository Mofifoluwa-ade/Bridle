// Hosted MCP endpoint for Bridle agents, addressed by an agent link. Stateless JSON-RPC over HTTP.
// The link carries the agent key. It exposes only agent tools: no create, update, fund, revoke, veto or flag.
import { agentFromToken } from "@/lib/agentLink";
import { json, methodNotAllowed, preflight, rpcError, serve } from "@/lib/hostedMcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const agent = agentFromToken(token);
  if (!agent) return json(rpcError(null, -32001, "This agent link is not valid. Create a new one in the Bridle app."), 401);
  return serve(req, agent);
}

export const GET = methodNotAllowed;
export const OPTIONS = preflight;
