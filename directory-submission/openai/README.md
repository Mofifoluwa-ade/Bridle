# Bridle — OpenAI directory package

This folder is a **submission draft**, not an uploaded or submitted plugin.

## Package contents

- `plugin.json`: portable Agent Plugins manifest, listing metadata and the required five positive / three negative test-case drafts.
- `mcp.json`: hosted Streamable HTTP endpoint with OAuth dynamic client registration.
- `assets/bridle-icon.svg`: square monochrome icon derived from the Bridle app icon.

## Before upload or review

1. Complete OpenAI individual developer verification and replace the publisher placeholder in `plugin.json` with the verified display name.
2. Finalize and approve the Privacy, Terms and Support pages. They are currently drafts and deliberately disclose known credential/revocation limitations.
3. Verify the live MCP endpoint, OAuth discovery and domain ownership in the Plugins portal. Complete its exact `.well-known/openai-apps-challenge` challenge only after the portal issues a token.
4. Seed a dedicated testnet reviewer agent with representative mandates and recipients. Do not use a personal wallet or real credentials.
5. Run all five positive and three negative cases against that account. The final proposal/receipt test requires an executed testnet transaction.
6. Record and host a reviewer-accessible walkthrough; add its HTTPS URL as `review.demo_recording_url`.
7. Check the package with OpenAI's current Plugin Creator / submission validator. Never put reviewer passwords, agent secrets, OAuth tokens or wallet seed phrases in this package.

## Product accuracy

The current server exposes nine tools. It runs on NEAR testnet and supports Base Sepolia USDC and native NEAR. Solana is planned, not executable. A successful proposal call is not proof of a completed transfer; only an Executed proposal with a destination transaction hash has a receipt.

## Known blocker

The current hosted OAuth implementation is stateless. It seals tokens, but has no per-app session revocation or token inventory. The personal `/mcp/bk_…` link also does not expire. This is disclosed in the draft Privacy page and should be addressed before broad public distribution.

## Eligibility risk

OpenAI's public directory guidelines say trial/demo plugins are not accepted. Bridle currently operates on testnets only and is not a production mainnet payment product. The package does not disguise that status. Before spending time on a formal submission, ask OpenAI whether a functional testnet-only protocol integration is eligible; do not claim mainnet or production payment availability.
