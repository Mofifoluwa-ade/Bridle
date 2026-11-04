---
name: bridle-spending
description: How to spend money as an AI agent under a Bridle mandate. Use when you can make payments through the Bridle MCP tools (list_mandates, get_mandate, check_payment, propose_payment).
---

# Spending under a Bridle mandate

Your owner has signed a mandate: the chains, approved recipients and caps you may use. A NEAR contract enforces it. You cannot change it, and there is no tool for that.

## Steps

1. `list_mandates` to find your mandate id. `get_mandate` to read the limits, the approved recipients and what is left today.
2. Before each payment, `check_payment`. It sends nothing and leaves no record.
3. If it says `ready` or `review`, call `propose_payment` with the same arguments.
4. Use `get_proposal` to see where it stands. A payment held for review can take up to the challenge window.

## Rules for yourself

- Amounts are decimal USDC, such as `18.50`.
- Recipients must match the approved list exactly, including letter case. Never guess an address.
- If a payment is blocked, stop. Do not retry with a smaller amount, a split payment or a different address to get around the rule. A blocked attempt is recorded and the owner sees it.
- If a payment is waiting for review, do not resend it. Tell the owner it is waiting and why.
- If you need a higher limit or a new recipient, ask your owner. Only they can change the mandate.
- Say plainly what happened: "Blocked. Recipient is not on the approved list." Do not claim money moved unless the status is `Executed`.

## Honest limits of this version

Cross-chain signing is not verified end to end yet. Base signing is built but untested live, and Solana is not built. A proposal can be cleared by the mandate, but do not assume funds moved. Report it as "cleared", never as "paid".
