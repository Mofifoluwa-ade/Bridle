# Anthropic Software Directory — policy exception request (draft)

**Status: Not submitted. Request written eligibility guidance before applying.**

To the Anthropic Software Directory review team,

I am the individual developer of Bridle, an experimental, testnet-only MCP integration for policy-bound agent payment proposals. I am requesting written guidance on whether a narrowly scoped listing can be considered under the Software Directory Policy's unsupported-use-case provisions, and, if so, whether an explicit written exception is available.

## What Bridle does

Bridle lets an owner create and sign a spending mandate on NEAR testnet. A mandate defines supported chains/assets, exact approved recipients, per-payment and daily caps, and a review threshold. The agent can inspect its mandate, run a dry-run eligibility check, submit a proposal and inspect proposal status or a receipt.

The hosted MCP server exposes nine tools: `list_mandates`, `get_mandate`, `check_payment`, `propose_payment`, `get_proposal`, `list_proposals`, `get_supported_networks`, `get_agent_status`, and `get_payment_receipt`.

## Safeguards and limitations

- The current deployment is testnet-only: NEAR testnet and Base Sepolia USDC / native NEAR. Solana is planned and not executable.
- The owner, not the agent, creates and signs mandates.
- The agent cannot create, edit, fund, revoke or veto a mandate, add recipients, change limits, flag proposals or withdraw bonds.
- The contract enforces recipient allowlists, per-payment and daily caps, and review thresholds.
- `check_payment` is a dry run and sends nothing.
- `propose_payment` creates an on-chain proposal; it does not itself broadcast a completed destination transfer. A proposal can be blocked, held for owner review or cleared. Execution requires the configured executor and contract path.
- The agent is instructed not to retry blocked payments with altered amounts or recipients.
- The interface and listing will accurately disclose the testnet-only and experimental status.

## The policy question

We understand the policy generally excludes cryptocurrency software and software that transfers financial assets or executes transactions autonomously without human-in-the-loop safeguards. Bridle is still cryptocurrency-related software, and some below-threshold proposals may proceed under an owner-signed mandate without an additional per-payment confirmation. We do not want to mischaracterize this or infer eligibility from the fact that the MCP tool only creates a proposal.

Could Anthropic confirm in writing:

1. Whether a testnet-only connector that can submit policy-constrained proposals, but cannot directly transfer funds or change owner controls, is categorically ineligible;
2. Whether an explicit exception can be considered for this narrowly scoped, owner-authorized testnet use; and
3. If not eligible, whether any separate read-only integration would be considered, given its direct relationship to the same payment-control product.

We will not submit or market Bridle as an approved Claude Directory connector unless Anthropic expressly confirms eligibility and any required exception in writing.

Product: https://bridle-agent.vercel.app  
MCP endpoint: https://bridle-agent.vercel.app/mcp  
Documentation: https://bridle-agent.vercel.app/mcp  
Source: https://github.com/Mofifoluwa-ade/Bridle

Regards,  
Individual developer, Bridle
