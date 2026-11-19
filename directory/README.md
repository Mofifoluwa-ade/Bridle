# Bridle directory-readiness work

This folder contains draft materials for a future public directory submission. Nothing here submits, publishes, or represents an approval.

## Current product facts

- Hosted MCP endpoint: https://bridle-agent.vercel.app/mcp
- Transport: Streamable HTTP
- Authentication: OAuth 2.1 authorization code + PKCE (S256), dynamic client registration
- Tools: list_mandates, get_mandate, check_payment, propose_payment, get_proposal, list_proposals, get_supported_networks, get_agent_status, get_payment_receipt
- Live rails: NEAR testnet native NEAR and Base Sepolia USDC
- Solana: planned; not currently executable
- A cleared proposal is not a completed transfer. Use get_proposal / get_payment_receipt to verify execution.
- The MCP server intentionally exposes no owner controls.

## Blocking items before OpenAI submission

1. Complete individual or business identity verification for the publisher name selected in the OpenAI Platform.
2. Confirm the legal operator name and review the legal drafts before publishing public Privacy, Terms and Support pages.
3. Implement a durable, per-client OAuth revocation mechanism. The current stateless OAuth flow has no per-app revoke endpoint; refresh tokens can be renewed and are not individually revocable.
4. Prepare a dedicated reviewer agent and deterministic test fixtures. Do not provide a real user's wallet or agent.
5. Run all eight test cases in `openai/test-cases.json` against the production endpoint with the reviewer account.
6. Record a short walkthrough showing the actual hosted OAuth flow and the testnet-only payment lifecycle.
7. Verify the existing logo asset is suitable for the submission's square icon requirements.
8. Complete the OpenAI domain challenge and current production MCP tool scan in the portal.

OpenAI currently requires exactly five positive and three negative test cases for an initial MCP app review, plus reviewer access when authentication is required. See the official [submission guide](https://developers.openai.com/plugins/deploy/submission) and [app review requirements](https://developers.openai.com/plugins/deploy/app-review).

## Claude

Do not submit the current payment-capable connector to the Anthropic directory without written policy clearance. Anthropic's current policy restricts software that transfers money or other financial assets, or executes financial transactions autonomously on users' behalf without human-in-the-loop safeguards, and says cryptocurrency software is generally not allowed. Bridle has owner-signed mandates and review thresholds, but not every payment requires a separate owner approval, so written clarification is needed. The request in `claude/policy-exception-request.md` is a draft inquiry, not a submission.

## Security note discovered during review

The authorization page previously said creating a new agent would cut off an app's access. That is not true: OAuth access tokens last one hour and refresh tokens can be refreshed for up to 90 days after their latest refresh; there is no per-app revocation store or endpoint. The UI copy has been corrected to disclose this limitation. This remains a release blocker until revocation is implemented and tested.

## Legal drafts

The drafts under `legal/` are for review only. They deliberately contain placeholders where the operator's legal identity, data retention, hosting/logging terms, and jurisdiction-specific legal wording must be confirmed. Do not publish them as final policies in their current form.
