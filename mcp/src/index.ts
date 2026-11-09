#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Account, JsonRpcProvider, KeyPairSigner } from "near-api-js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { chainTimeNs, view } from "./rpc.js";
import * as t from "./tools.js";
import type { Proposal } from "./types.js";

const cfg = loadConfig();

const deps: t.Deps = {
  cfg,
  view: (method, args) => view(cfg, method, args),
  now: () => chainTimeNs(cfg),
  propose: async (args) => {
    // Built only when a call is made, so read-only use never touches the key.
    const signer = KeyPairSigner.fromSecretKey(cfg.agentKey as `ed25519:${string}`);
    const account = new Account(cfg.agentAccount!, new JsonRpcProvider({ url: cfg.rpc }), signer);
    const out = await account.callFunction<Proposal>({
      contractId: cfg.contractId,
      methodName: "propose_payment",
      args,
      gas: 30_000_000_000_000n,
      deposit: 0n,
    });
    return out as Proposal;
  },
};

const server = new McpServer(
  { name: "bridle", version: "0.1.0" },
  {
    instructions:
      "Bridle bounds what you may spend. A mandate set by your owner lists the chains, the approved recipients and the caps. " +
      "Call list_mandates to find your mandate, get_mandate to read the limits, and check_payment before propose_payment. " +
      "If a payment is blocked, do not retry it with a different amount or address to get around the rule; tell your owner instead. " +
      "You cannot change the mandate, and there is deliberately no tool for it. Amounts are decimals in the mandate's asset: USDC for Base, for example 18.50, or NEAR for the Near chain, for example 1.5.",
  },
);

const mandateId = z.number().int().nonnegative().describe("The mandate id, from list_mandates");
const payment = {
  mandate_id: mandateId,
  chain: z.enum(["Base", "Solana", "Near"]).describe("Destination chain. Near pays native NEAR to a NEAR account"),
  asset: z.string().optional().describe("Asset symbol: USDC on Base, NEAR on Near. Defaults to the chain's asset"),
  amount: z.string().describe("Decimal amount in the asset, for example 18.50 USDC or 1.5 NEAR. Not smallest units"),
  recipient: z.string().describe("Destination address. Must match an approved recipient exactly, including letter case"),
};

async function run(fn: () => Promise<unknown>) {
  try {
    return { content: [{ type: "text" as const, text: JSON.stringify(await fn(), null, 2) }] };
  } catch (e) {
    const message = e instanceof t.ToolError ? e.message : t.explain(e);
    return { isError: true, content: [{ type: "text" as const, text: message }] };
  }
}

const READ = { readOnlyHint: true, openWorldHint: true } as const;

server.registerTool("list_mandates", {
  title: "List my mandates",
  description: "Find the spending mandates that name you as the agent. Start here to get your mandate id. Uses BRIDLE_AGENT_ACCOUNT unless account_id is given.",
  inputSchema: { account_id: z.string().optional().describe("A NEAR account. Defaults to the configured agent account") },
  annotations: READ,
}, (a) => run(() => t.listMandates(deps, a)));

server.registerTool("get_mandate", {
  title: "Read a mandate",
  description: "Read the limits that govern you: per-payment cap, daily cap and what is left today, the review threshold, and the approved recipients.",
  inputSchema: { mandate_id: mandateId },
  annotations: READ,
}, (a) => run(() => t.getMandate(deps, a)));

server.registerTool("check_payment", {
  title: "Check a payment (dry run)",
  description: "Ask whether a payment would be allowed, held for the owner's review, or blocked, and which rule decides. Sends nothing and leaves no record. Prefer this before propose_payment, because a blocked proposal is recorded on-chain for the owner to see.",
  inputSchema: payment,
  annotations: READ,
}, (a) => run(() => t.checkPaymentTool(deps, a)));

server.registerTool("propose_payment", {
  title: "Propose a payment",
  description: "Propose a payment (USDC on Base, or native NEAR on the Near chain). The contract decides: it may be blocked (recorded with the rule), held for the owner's review, or cleared. This does not move money by itself. Needs BRIDLE_AGENT_ACCOUNT and BRIDLE_AGENT_KEY. Never resend a blocked or waiting payment.",
  inputSchema: payment,
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
}, (a) => run(() => t.proposePayment(deps, a)));

server.registerTool("get_proposal", {
  title: "Read a proposal",
  description: "Check where a proposal stands: blocked, waiting for the owner, flagged, vetoed, cleared or executed.",
  inputSchema: { proposal_id: z.number().int().nonnegative().describe("The proposal id returned by propose_payment") },
  annotations: READ,
}, (a) => run(() => t.getProposal(deps, a)));

server.registerTool("list_proposals", {
  title: "List recent proposals",
  description: "Recent proposals for a mandate, newest first, with each one's status and reason.",
  inputSchema: { mandate_id: mandateId, limit: z.number().int().min(1).max(50).optional().describe("How many to return. Default 10") },
  annotations: READ,
}, (a) => run(() => t.listProposals(deps, a)));

await server.connect(new StdioServerTransport());
console.error(`bridle-mcp ready · contract ${cfg.contractId} · ${cfg.agentAccount ? "agent " + cfg.agentAccount : "read-only (no agent account)"}`);
