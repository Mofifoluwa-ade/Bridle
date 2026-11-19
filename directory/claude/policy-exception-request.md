# Draft: request for directory policy clarification

**Do not submit until the publisher identity and final product scope are confirmed.**

To the Anthropic directory review team,

We are requesting a written eligibility determination for Bridle before submitting any connector.

Bridle is a policy-bound agent payment system. Owners create and sign spending mandates that define approved recipients, supported networks, per-payment and daily limits, and review thresholds. The hosted MCP connector exposes agent-scoped tools to read those rules, simulate a payment decision, submit a payment proposal, and inspect proposal status and receipts.

The current deployment is testnet-only:
- NEAR testnet (native NEAR)
- Base Sepolia (USDC)
- Solana is planned and is not currently executable.

The MCP tool `propose_payment` submits an on-chain proposal to the Bridle contract. It does not directly broadcast a destination-chain transfer. Depending on the mandate and execution workflow, a proposal may be held for owner review or later executed. The connector has no tools to create, change, fund, revoke, veto, or flag mandates/payments.

We understand the published Software Directory Policy excludes software that transfers money, cryptocurrency, or other financial assets, or executes financial transactions on users' behalf. We do not want to mischaracterize Bridle or submit an ineligible integration.

Could you confirm whether a testnet-only, owner-authorized MCP connector that can submit proposals but cannot independently change spending rules or directly broadcast destination transfers is eligible for directory review? If not, would a separate read-only connector limited to mandate, network, proposal-status, and receipt inspection be eligible, or is the product's overall financial purpose disqualifying?

We will not submit the payment-capable connector unless Anthropic confirms it is eligible.

Regards,

[Verified publisher name]
Bridle
https://bridle-agent.vercel.app
