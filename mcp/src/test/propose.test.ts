// The signed path: the server builds a real signed transaction and sends it to a mock chain.
// We decode what arrived and check the method, receiver, signer and arguments.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KeyPair, decodeSignedTransaction } from "near-api-js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { BASE_OK, NOW_NS, proposal } from "./fixtures.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, "..", "index.js");
const HASH = "11111111111111111111111111111111"; // 32 zero bytes in base58

test("propose_payment signs as the agent and sends the four fields", async () => {
  const key = KeyPair.fromRandom("ed25519");
  const seen: { signer?: string; receiver?: string; method?: string; args?: any; publicKey?: string } = {};
  const returned = proposal({ id: 9, status: "Rejected", reason: "Over the per-payment cap", amount: "900000000" });

  const rpc = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const r = JSON.parse(body);
      const send = (result: unknown) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ jsonrpc: "2.0", id: r.id, result })); };
      if (r.method === "block") return send({ header: { timestamp_nanosec: NOW_NS.toString(), hash: HASH, height: 100 } });
      if (r.method === "query" && r.params.request_type === "view_access_key")
        return send({ nonce: 5, permission: "FullAccess", block_height: 100, block_hash: HASH });
      if (r.method === "send_tx" || r.method === "broadcast_tx_commit") {
        const b64 = r.params.signed_tx_base64 ?? r.params[0];
        const st: any = decodeSignedTransaction(Buffer.from(b64, "base64"));
        const fc = st.transaction.actions[0].functionCall;
        seen.signer = st.transaction.signerId; seen.receiver = st.transaction.receiverId;
        seen.method = fc.methodName; seen.args = JSON.parse(Buffer.from(fc.args).toString());
        seen.publicKey = st.transaction.publicKey.toString();
        return send({
          final_execution_status: "FINAL",
          status: { SuccessValue: Buffer.from(JSON.stringify(returned)).toString("base64") },
          transaction: {}, transaction_outcome: { id: HASH, outcome: { logs: [], receipt_ids: [], gas_burnt: 0, tokens_burnt: "0", executor_id: "agent.testnet", status: { SuccessReceiptId: HASH } }, block_hash: HASH, proof: [] },
          receipts_outcome: [],
        });
      }
      send({});
    });
  });
  await new Promise<void>((r) => rpc.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${(rpc.address() as { port: number }).port}`;

  const client = new Client({ name: "test", version: "0" });
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [entry],
    env: { PATH: process.env.PATH ?? "", BRIDLE_CONTRACT: "bridle.testnet", BRIDLE_RPC: url, BRIDLE_AGENT_ACCOUNT: "agent.testnet", BRIDLE_AGENT_KEY: key.toString() },
  }));
  const r: any = await client.callTool({ name: "propose_payment", arguments: { mandate_id: 1, chain: "Base", amount: "900", recipient: BASE_OK } });
  await client.close(); rpc.close();

  assert.equal(r.isError, undefined, r.content?.[0]?.text);
  assert.equal(seen.signer, "agent.testnet");
  assert.equal(seen.receiver, "bridle.testnet");
  assert.equal(seen.method, "propose_payment");
  assert.deepEqual(seen.args, { mandate_id: 1, chain: "Base", asset: "USDC", amount: "900000000", recipient: BASE_OK });
  assert.equal(seen.publicKey, key.getPublicKey().toString());
  const out = JSON.parse(r.content[0].text);
  assert.match(out.summary, /^Blocked\. Over the per-payment cap/);
  assert.equal(out.amount_usdc, "900.00");
  assert.ok(!JSON.stringify(out).includes(key.toString()), "the secret key must never appear in output");
});
