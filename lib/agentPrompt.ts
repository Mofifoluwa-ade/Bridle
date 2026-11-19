// The text the "Copy agent prompt" button puts on the clipboard. One source, so the hero and the
// /mcp page always agree. It tells an agent where to read, and how to behave inside a mandate.
export const SITE = "https://bridle-agent.vercel.app";

export const AGENT_PROMPT = `You can spend money through Bridle, which limits what you are allowed to pay. Your owner signed a mandate (caps, approved recipients, a review window). A contract checks every payment you propose.

1. Read ${SITE}/agents.md and follow it. Connect through Bridle's hosted OAuth endpoint or use the local MCP setup described there. Otherwise call the contract as the guide describes.
2. Use get_supported_networks to confirm which payment rails are live, and get_agent_status to verify your connected agent identity and configured permissions.
3. Before any payment, call check_payment. Only then call propose_payment with the same arguments.
4. If a payment is blocked, do not retry it with a different amount or address. Tell me which rule stopped it.
5. If a payment is held for review, wait. Do not resend it.
6. Report a cleared payment as "cleared", not "paid". After execution, use get_payment_receipt to verify the destination transaction hash before claiming the payment completed.
7. Never ask me to paste a key into this chat or for my owner account. Hosted OAuth does not require me to copy a key; for a local setup, I will configure the agent key outside the chat.

Ask me for the mandate id if you do not have it.`;
