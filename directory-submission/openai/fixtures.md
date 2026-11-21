# Reviewer fixture plan

The test-case prompts are separate from fixture setup so imported test-case objects stay within the documented review fields.

## Required disposable reviewer environment

- A dedicated NEAR testnet agent account with gas and a known agent key.
- At least one active mandate naming that agent.
- One Base Sepolia USDC recipient in the allowlist.
- One valid-format recipient not in the allowlist.
- A mandate with a small daily cap or controlled prior spend to exercise daily-cap rejection.
- One proposal waiting for review, one cleared but not executed, and one actually executed with a destination transaction hash.
- No production funds, personal wallet, or real user data.

## Before submitting

Run all five positive and three negative prompts in `test-cases.json` through the production endpoint with the dedicated reviewer connection. Record actual outputs and confirm exact tool calls. Do not mark the package ready if a fixture cannot be reproduced. The proposal-creation test creates an on-chain testnet record; use only the disposable reviewer agent.
