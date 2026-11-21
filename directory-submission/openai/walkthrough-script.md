# Reviewer walkthrough — recording script (not yet recorded)

Target duration: 4–6 minutes. Use only a dedicated testnet reviewer account and sample data. Do not show wallet seed phrases, private keys, agent-link tokens, OAuth tokens or browser developer tools containing secrets.

1. **Connect** — Open the Bridle hosted MCP endpoint in the review client. Show OAuth sign-in redirecting to Bridle and the owner explicitly approving the AI app.
2. **Discover** — Ask the agent to inspect its status and supported networks. Point out NEAR testnet and Base Sepolia, and that Solana is marked planned.
3. **Read policy** — List the reviewer's mandates and inspect one mandate's caps, remaining daily allowance, challenge threshold and approved recipients.
4. **Dry run** — Check one payment to an approved recipient. Show that check_payment is a dry run and does not create a proposal.
5. **Propose** — Submit one low-value testnet proposal within policy. Show the proposal ID and explain that a proposal is not itself a completed transfer.
6. **Verify** — Show the final proposal status. If executed, call get_payment_receipt and show the destination transaction hash / explorer link. If it is still pending, say so plainly; do not imply execution.
7. **Negative cases** — Demonstrate an over-limit payment and an unapproved recipient being blocked before proposal submission. Ask the agent to change the mandate and show that no such tool exists.

Record the desktop and mobile connection experience if practical. Publish the recording at a stable, reviewer-accessible HTTPS URL and add that URL to plugin.json.
