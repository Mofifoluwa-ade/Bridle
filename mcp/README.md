# bridle-mcp

An MCP server that lets an AI agent work inside a Bridle spending mandate: read its limits, check a payment, and propose one.

It is deliberately small. The contract is the authority, and this server is a thin, honest layer over it.

## Tools

| Tool | What it does |
|---|---|
| `list_mandates` | Mandates that name this agent |
| `get_mandate` | Caps, what is left today, review threshold, approved recipients |
| `check_payment` | Dry run: `ready`, `review` or `blocked`, and the rule. Sends nothing, leaves no record |
| `propose_payment` | Sends `propose_payment` as the agent. The contract decides |
| `get_proposal` / `list_proposals` | Status and reason |

**Not exposed, on purpose:** create, update, revoke, veto, flag, bond withdrawal. An agent must not be able to widen its own limits. A test fails if a tool like that is ever added.

## Run

```bash
BRIDLE_CONTRACT=bridle.testnet npx -y bridle-mcp   # speaks MCP over stdio
```

Most clients launch it for you from their config (see below). From source:

```bash
cd mcp && npm install && npm run build
BRIDLE_CONTRACT=bridle.testnet node dist/index.js
```

| Variable | Needed | Meaning |
|---|---|---|
| `BRIDLE_CONTRACT` | yes | NEAR account the contract is deployed to |
| `BRIDLE_RPC` | no | Defaults to `https://test.rpc.fastnear.com` |
| `BRIDLE_EXPLORER` | no | Defaults to `https://testnet.nearblocks.io` |
| `BRIDLE_AGENT_ACCOUNT` | for `propose_payment` | The agent's NEAR account |
| `BRIDLE_AGENT_KEY` | for `propose_payment` | `ed25519:...` secret key for that account |

Without the agent account and key, the server is read-only.

Client config examples are in [public/agents.md](../public/agents.md).

## The agent key

Use a function-call access key limited to `propose_payment` on the Bridle contract. It identifies the agent and cannot move funds. The key is read from the environment only when a payment is proposed, and is never written to output or logs.

## Amounts

Tools take decimal USDC (`18.50`). The contract takes smallest units (`"18500000"`). The server converts, and echoes both the decimal amount and the contract's status.

## How `check_payment` relates to the contract

`src/policy.ts` mirrors the checks in `contract/src/lib.rs` `propose_payment`, in the same order, using the chain's own clock for day rollover and expiry. The contract is the authority. If the two ever disagree, the contract wins, so a `ready` from `check_payment` is a prediction and not a guarantee.

## Honest limits

- Base signing is built but not yet verified end to end, and Solana is not built, so the tools say "cleared", never "paid".
- Tested against a mock NEAR RPC, including a signed `propose_payment`. Not yet run against a live testnet contract with a real agent key.

## Develop

```bash
npm test      # builds, then runs the unit tests and the stdio end-to-end tests
```
