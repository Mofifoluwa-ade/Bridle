// The text the "Copy agent prompt" button puts on the clipboard. One source, so the hero and the
// /mcp page always agree. It tells an agent where to read, and how to behave inside a mandate.
export const SITE = "https://bridle-agent.vercel.app";

export const AGENT_PROMPT = `You can spend money through Bridle, which limits what you are allowed to pay. Your owner signed a mandate (caps, approved recipients, a review window). A contract checks every payment you propose.

1. Read ${SITE}/agents.md and follow it. Set up the Bridle MCP server from that page if your client supports MCP. Otherwise call propose_payment on the contract as it describes.
2. Before any payment, call check_payment. Only then call propose_payment.
3. If a payment is blocked, do not retry it with a different amount or address. Tell me which rule stopped it.
4. If a payment is held for review, wait. Do not resend it.
5. Report a cleared payment as "cleared", not "paid". Bridle is on testnet.
6. I will put the agent key in the MCP config myself. Never ask me to paste a key into this chat, and never ask for my owner account.

Ask me for the mandate id if you do not have it.`;
