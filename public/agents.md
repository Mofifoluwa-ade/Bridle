# Bridle for agents

Bridle lets an AI agent spend within limits its owner signs once. A NEAR contract checks every payment. The agent proposes, the contract decides, and the owner keeps a veto.

Status: NEAR testnet, version 0.1. Base signing through NEAR Chain Signatures is built but not yet verified end to end, and Solana is not built. Report "cleared", never "paid".

- App: https://bridle-agent.vercel.app
- Repo: https://github.com/Mofifoluwa-ade/Bridle
- Contract: `bridle.testnet` on NEAR testnet
- Behaviour guide for agents: https://bridle-agent.vercel.app/bridle-agent-skill.md

## Connect with MCP

The MCP server lives in the repo under `mcp/`. It is not on npm yet.

```bash
git clone https://github.com/Mofifoluwa-ade/Bridle
cd Bridle/mcp && npm install && npm run build
```

Claude Desktop, Cursor and most MCP clients take this shape:

```json
{
  "mcpServers": {
    "bridle": {
      "command": "node",
      "args": ["/absolute/path/to/Bridle/mcp/dist/index.js"],
      "env": {
        "BRIDLE_CONTRACT": "bridle.testnet",
        "BRIDLE_AGENT_ACCOUNT": "your-agent.testnet",
        "BRIDLE_AGENT_KEY": "ed25519:..."
      }
    }
  }
}
```

Claude Code: `claude mcp add bridle -e BRIDLE_CONTRACT=bridle.testnet -e BRIDLE_AGENT_ACCOUNT=your-agent.testnet -e BRIDLE_AGENT_KEY=ed25519:... -- node /absolute/path/to/Bridle/mcp/dist/index.js`

Without `BRIDLE_AGENT_ACCOUNT` and `BRIDLE_AGENT_KEY` the server is read-only: `list_mandates` (with an account id), `get_mandate`, `check_payment`, `get_proposal` and `list_proposals` still work.

## Tools

| Tool | Use |
|---|---|
| `list_mandates` | Find the mandates that name you as the agent |
| `get_mandate` | Limits, what is left today, approved recipients |
| `check_payment` | Dry run: allowed, held for review, or blocked, and which rule. Sends nothing |
| `propose_payment` | Propose a payment. The contract decides. Needs the agent key |
| `get_proposal` | Where one proposal stands |
| `list_proposals` | Recent proposals for a mandate |

There are deliberately no tools to create, change, revoke or veto a mandate. Those are owner actions. An agent cannot widen its own limits.

## Amounts

The MCP takes decimal USDC: `18.50`. The raw contract call takes the smallest unit as an integer string: `"18500000"` (USDC has 6 decimals).

## Rules

- Recipients must match the approved list exactly, including letter case.
- A blocked proposal is recorded on-chain with the rule that stopped it, and the owner sees it. Prefer `check_payment` first.
- Do not retry a blocked payment with a different amount or address. Tell your owner.
- A payment above the review threshold waits out the challenge window and the owner can veto it. Do not resend it.

## The agent key

`propose_payment` is a NEAR transaction signed by the agent account. Use a function-call access key limited to `propose_payment` on the Bridle contract. It identifies the agent and cannot move funds. Posting the agent bond, when a mandate requires one, needs a deposit, which a function-call key cannot attach, so the agent account does that once in the app.

## Without MCP

Call `propose_payment` on the contract directly with `mandate_id`, `chain` (`Base` or `Solana`), `asset` (`USDC`), `amount` (smallest units, string) and `recipient`. See https://bridle-agent.vercel.app/docs.
