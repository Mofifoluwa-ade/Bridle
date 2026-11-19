// Shared hosted MCP core for Bridle agents (token link and OAuth endpoint). Stateless JSON-RPC over HTTP (MCP "streamable HTTP", JSON responses).
// The link carries the agent key. It exposes only agent tools: no create, update, fund, revoke, veto or flag.
import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { agentFromToken } from "@/lib/agentLink";
import * as t from "@/lib/agentmcp/tools";
import { chainTimeNs, view } from "@/lib/agentmcp/rpc";
import type { Config } from "@/lib/agentmcp/config";
import type { Proposal } from "@/lib/agentmcp/types";

const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS =
  "Bridle bounds what you may spend. A rule set by your owner lists the chains, the approved recipients and the caps. " +
  "Call get_supported_networks to discover live rails, get_agent_status to inspect your permissions, and get_payment_receipt to verify an executed payment. " +
  "Call list_mandates to find your rules, get_mandate to read the limits, and check_payment before propose_payment. " +
  "If a payment is blocked, do not retry it with a different amount or address to get around the rule; tell your owner instead. " +
  "You cannot change a rule, and there is deliberately no tool for it. Amounts are decimals in the rule's asset: USDC for Base, for example 18.50, or NEAR for the Near chain, for example 1.5. " +
  "Report a cleared payment as cleared: this is testnet. " +
  "Be brief. Never paste a long account id on its own line; shorten it (first 8 and last 6 characters) unless asked. " +
  "If you have no rules yet, say so in one sentence and give the owner the create_rule_url from list_mandates as a link, then stop. Do not offer a menu of options.";

const mandateId = { type: "integer", minimum: 0, description: "The mandate id, from list_mandates" };
const payment = {
  type: "object",
  properties: {
    mandate_id: mandateId,
    chain: { type: "string", enum: ["Base", "Near"], description: "Destination chain. Near pays native NEAR to a NEAR account" },
    asset: { type: "string", description: "Asset symbol: USDC on Base, NEAR on Near. Defaults to the chain's asset" },
    amount: { type: "string", description: "Decimal amount in the asset, for example 18.50 USDC or 1.5 NEAR. Not smallest units" },
    recipient: { type: "string", description: "Destination address. Must match an approved recipient exactly, including letter case" },
  },
  required: ["mandate_id", "chain", "amount", "recipient"],
};
const READ = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

const TOOLS = [
  { name: "list_mandates", title: "List my rules", description: "Find the spending rules (mandates) that name you as the agent. Start here to get the rule id.", inputSchema: { type: "object", properties: { account_id: { type: "string", description: "A NEAR account. Defaults to your own agent account" } } }, annotations: READ },
  { name: "get_mandate", title: "Read a rule", description: "Read the limits that govern you: per-payment cap, daily cap and what is left today, the review threshold, and the approved recipients.", inputSchema: { type: "object", properties: { mandate_id: mandateId }, required: ["mandate_id"] }, annotations: READ },
  { name: "check_payment", title: "Check a payment (dry run)", description: "Ask whether a payment would be allowed, held for the owner's review, or blocked, and which rule decides. Sends nothing and leaves no record. Prefer this before propose_payment.", inputSchema: payment, annotations: READ },
  { name: "propose_payment", title: "Propose a payment", description: "Propose a payment (USDC on Base, or native NEAR on the Near chain). The contract decides: it may be blocked (recorded with the rule), held for the owner's review, or cleared. This does not move money by itself. Never resend a blocked or waiting payment.", inputSchema: payment, annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } },
  { name: "get_proposal", title: "Read a proposal", description: "Check where a proposal stands: blocked, waiting for the owner, flagged, vetoed, cleared or executed.", inputSchema: { type: "object", properties: { proposal_id: { type: "integer", minimum: 0, description: "The proposal id returned by propose_payment" } }, required: ["proposal_id"] }, annotations: READ },
  { name: "get_supported_networks", title: "List supported networks", description: "Live testnet networks/assets and planned chains.", inputSchema: { type: "object", properties: {} }, annotations: READ },
  { name: "get_agent_status", title: "Read agent status", description: "Agent identity, whether an agent key is configured, mandate counts and permission boundaries.", inputSchema: { type: "object", properties: {} }, annotations: READ },
  { name: "get_payment_receipt", title: "Get a payment receipt", description: "Destination transaction hash and explorer link for an executed proposal.", inputSchema: { type: "object", properties: { proposal_id: { type: "integer", minimum: 0 } }, required: ["proposal_id"] }, annotations: READ },
  { name: "list_proposals", title: "List recent proposals", description: "Recent proposals for a rule, newest first, with each one's status and reason.", inputSchema: { type: "object", properties: { mandate_id: mandateId, limit: { type: "integer", minimum: 1, maximum: 50, description: "How many to return. Default 10" } }, required: ["mandate_id"] }, annotations: READ },
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS",
  "access-control-allow-headers": "content-type, accept, mcp-protocol-version, mcp-session-id, authorization",
};

export const CORS_HEADERS = CORS;
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS } });
export const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

export function makeDeps(account: string, secret: string): t.Deps {
  const cfg: Config = {
    contractId: (process.env.NEXT_PUBLIC_BRIDLE_CONTRACT ?? "bridle.testnet").trim(),
    rpc: (process.env.NEXT_PUBLIC_NEAR_RPC ?? "https://test.rpc.fastnear.com").trim(),
    explorer: (process.env.NEXT_PUBLIC_EXPLORER ?? "https://testnet.nearblocks.io").trim(),
    agentAccount: account,
    agentKey: secret,
  };
  return {
    cfg,
    view: (method, args) => view(cfg, method, args),
    now: () => chainTimeNs(cfg),
    propose: async (args) => {
      const signer = KeyPairSigner.fromSecretKey(secret as `ed25519:${string}`);
      const acct = new Account(account, new JsonRpcProvider({ url: cfg.rpc }), signer);
      return (await acct.callFunction<Proposal>({ contractId: cfg.contractId, methodName: "propose_payment", args, gas: 30_000_000_000_000n, deposit: 0n })) as Proposal;
    },
  };
}

async function callTool(d: t.Deps, name: string, a: any, origin: string) {
  const run = async (fn: () => Promise<unknown>) => {
    try {
      return { content: [{ type: "text", text: JSON.stringify(await fn(), null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: e instanceof t.ToolError ? e.message : t.explain(e) }] };
    }
  };
  switch (name) {
    case "list_mandates":
      return run(async () => {
        const r = await t.listMandates(d, a ?? {});
        if (r.mandates.length || a?.account_id) return r;
        const acct = d.cfg.agentAccount ?? "";
        return {
          summary: "No rules name this agent yet, so there is nothing to spend under. Your owner creates the rule; you cannot.",
          agent_account: acct,
          agent_short: `${acct.slice(0, 8)}…${acct.slice(-6)}`,
          create_rule_url: `${origin}/app/mandates/new?agent=${acct}`,
          next_step: "Give the owner create_rule_url as a link. It opens Bridle with this agent already filled in. Once the rule is signed, call list_mandates again.",
          mandates: [],
        };
      });
    case "get_mandate": return run(() => t.getMandate(d, a));
    case "check_payment": return run(() => t.checkPaymentTool(d, a));
    case "propose_payment": return run(() => t.proposePayment(d, a));
    case "get_proposal": return run(() => t.getProposal(d, a));
    case "list_proposals": return run(() => t.listProposals(d, a));
    case "get_supported_networks": return run(() => t.getSupportedNetworks(d));
    case "get_agent_status": return run(() => t.getAgentStatus(d));
    case "get_payment_receipt": return run(() => t.getPaymentReceipt(d, a));
    default: return null;
  }
}

export async function handle(msg: any, d: t.Deps, origin: string): Promise<unknown | null> {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return rpcError(msg?.id, -32600, "Invalid request");
  const isNote = msg.id === undefined || msg.id === null;
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      return { jsonrpc: "2.0", id: msg.id, result: { protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: "bridle", version: "0.2.0" }, instructions: INSTRUCTIONS } };
    }
    case "ping": return { jsonrpc: "2.0", id: msg.id, result: {} };
    case "tools/list": return { jsonrpc: "2.0", id: msg.id, result: { tools: TOOLS } };
    case "tools/call": {
      const out = await callTool(d, msg.params?.name, msg.params?.arguments, origin);
      return out ? { jsonrpc: "2.0", id: msg.id, result: out } : rpcError(msg.id, -32602, `Unknown tool: ${msg.params?.name}`);
    }
    default:
      if (isNote || msg.method.startsWith("notifications/")) return null;
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}


/** Serve one JSON-RPC POST for a known agent. */
export async function serve(req: Request, agent: { account: string; secret: string }): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }
  const d = makeDeps(agent.account, agent.secret);
  const origin = new URL(req.url).origin;
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handle(m, d, origin)))).filter((x) => x !== null);
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handle(body, d, origin);
  return out === null ? new Response(null, { status: 202, headers: CORS }) : json(out);
}

export const methodNotAllowed = () =>
  new Response("This Bridle endpoint accepts POST (MCP over HTTP).", { status: 405, headers: { allow: "POST, OPTIONS", ...CORS } });
export const preflight = () => new Response(null, { status: 204, headers: CORS });
