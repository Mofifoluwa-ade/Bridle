// End to end: the built server over stdio, talking to a mock NEAR RPC.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { BASE_OK, NOW_NS, mandate, proposal } from "./fixtures.js";

let rpc: http.Server;
let url = "";
const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, "..", "index.js");

before(async () => {
  rpc = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const r = JSON.parse(body);
      const send = (result: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ jsonrpc: "2.0", id: r.id, result })); };
      if (r.method === "block") return send({ header: { timestamp_nanosec: NOW_NS.toString() } });
      const m = r.params.method_name;
      const args = JSON.parse(Buffer.from(r.params.args_base64, "base64").toString());
      const out =
        m === "get_mandate" ? (args.mandate_id === 1 ? mandate() : null)
        : m === "list_mandates_for" ? [mandate(), mandate({ id: 2, agent: "someone.testnet" })]
        : m === "get_proposal" ? (args.proposal_id === 7 ? proposal() : args.proposal_id === 8 ? proposal({ id: 8, status: "Rejected", reason: "Recipient is not on the allowlist" }) : null)
        : m === "list_proposals" ? [proposal(), proposal({ id: 6, status: "Waiting", amount: "32000000", executable_at: (NOW_NS + 600n * 1_000_000_000n).toString() })]
        : null;
      send({ result: [...Buffer.from(JSON.stringify(out))], logs: [] });
    });
  });
  await new Promise<void>((r) => rpc.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${(rpc.address() as { port: number }).port}`;
});
after(() => rpc.close());

async function connect(extra: Record<string, string> = {}) {
  const client = new Client({ name: "test", version: "0" });
  const env: Record<string, string> = { PATH: process.env.PATH ?? "", BRIDLE_CONTRACT: "bridle.testnet", BRIDLE_RPC: url, BRIDLE_AGENT_ACCOUNT: "agent.testnet", ...extra };
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], env }));
  return client;
}
const text = (r: any) => r.content[0].text as string;
const json = (r: any) => JSON.parse(text(r));

test("exposes agent tools and no owner tools", async () => {
  const c = await connect();
  const names = (await c.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["check_payment", "get_mandate", "get_proposal", "list_mandates", "list_proposals", "propose_payment"]);
  for (const bad of ["create", "update", "revoke", "veto", "flag", "bond", "withdraw"]) {
    assert.ok(!names.some((n) => n.includes(bad)), `unexpected tool containing ${bad}`);
  }
  await c.close();
});

test("list_mandates only returns mandates naming this agent", async () => {
  const c = await connect();
  const r = json(await c.callTool({ name: "list_mandates", arguments: {} }));
  assert.equal(r.mandates.length, 1);
  assert.equal(r.mandates[0].mandate_id, 1);
  await c.close();
});

test("get_mandate reads limits in USDC", async () => {
  const c = await connect();
  const r = json(await c.callTool({ name: "get_mandate", arguments: { mandate_id: 1 } }));
  assert.equal(r.per_payment_cap_usdc, "25.00");
  assert.equal(r.daily_cap_usdc, "50.00");
  assert.equal(r.remaining_today_usdc, "32.00");
  assert.equal(r.review_threshold_usdc, "20.00");
  assert.equal(r.approved_recipients.length, 2);
  const missing = await c.callTool({ name: "get_mandate", arguments: { mandate_id: 99 } });
  assert.equal(missing.isError, true);
  await c.close();
});

test("check_payment outcomes", async () => {
  const c = await connect();
  const call = async (amount: string, recipient = BASE_OK) => json(await c.callTool({ name: "check_payment", arguments: { mandate_id: 1, chain: "Base", amount, recipient } }));
  assert.equal((await call("2")).outcome, "ready");
  assert.equal((await call("21")).outcome, "review");
  const b = await call("900");
  assert.equal(b.outcome, "blocked"); assert.equal(b.rule, "per_tx_cap");
  const u = await call("10", "0x9999999999999999999999999999999999999999");
  assert.equal(u.outcome, "blocked"); assert.equal(u.rule, "recipient");
  assert.match(u.summary, /Nothing was sent/);
  const bad = await c.callTool({ name: "check_payment", arguments: { mandate_id: 1, chain: "Base", amount: "ten", recipient: BASE_OK } });
  assert.equal(bad.isError, true);
  await c.close();
});

test("propose_payment without a key explains what to set and sends nothing", async () => {
  const c = await connect();
  const r = await c.callTool({ name: "propose_payment", arguments: { mandate_id: 1, chain: "Base", amount: "5", recipient: BASE_OK } });
  assert.equal(r.isError, true);
  assert.match(text(r), /BRIDLE_AGENT_KEY/);
  await c.close();
});

test("get_proposal and list_proposals describe status honestly", async () => {
  const c = await connect();
  const ready = json(await c.callTool({ name: "get_proposal", arguments: { proposal_id: 7 } }));
  assert.match(ready.summary, /no funds have moved/);
  const blocked = json(await c.callTool({ name: "get_proposal", arguments: { proposal_id: 8 } }));
  assert.match(blocked.summary, /^Blocked\. Recipient is not on the allowlist/);
  const list = json(await c.callTool({ name: "list_proposals", arguments: { mandate_id: 1 } }));
  assert.equal(list.proposals.length, 2);
  assert.match(list.proposals[1].summary, /Waiting for the owner/);
  await c.close();
});

test("fails fast without a contract", async () => {
  const client = new Client({ name: "test", version: "0" });
  await assert.rejects(client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], env: { PATH: process.env.PATH ?? "" } })));
});
