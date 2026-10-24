<div align="center">

# Bridle

### Steer your agents, don't trust them. Policy-bound autonomous payments across chains without key custody.

[Architecture](#architecture) • [The Mandate](#mandate-specification) • [Proposal Lifecycle](#proposal-lifecycle) • [Threat Model](#threat-model) • [Trust Assumptions](#trust-assumptions) • [Local](#local)

**Built for:** NEAR Chain Signatures & Intents • **Multi-chain execution:** Base (EVM) & Solana • **Policy enforcement:** On-chain contract

</div>

---

An AI agent that holds a private key is one prompt injection away from an empty wallet. An agent gated behind manual human approval for every single action is no longer autonomous. 

**Bridle removes the private key while preserving the autonomy.** 

The owner defines a spending mandate once and signs it on NEAR. The agent receives zero keys and never signs transactions. When the agent needs to pay for an API, compute, or an external tool, it provides only four high-level parameters. The Bridle contract verifies policy limits, constructs the destination transaction bytes, and invokes NEAR Chain Signatures MPC to broadcast derived transactions to EVM chains (Base) and Solana.

---

## Why Bridle Matters

* **AI as the engine, humans as the steering wheel.** As framed in Vitalik's model of human-AI collaboration: the agent performs continuous multi-chain execution within established boundaries, while the human sets the policy once and steers at the edges.
* **Cryptographic policy over counterparty trust.** Instead of trusting the agent's intent or reasoning, the owner verifies a hard contract policy. The contract builds the raw payload so prompt injections cannot smuggle arbitrary calldata or drain wallets.
* **Delayed loosening, instant tightening.** Tightening a cap or revoking an agent takes effect immediately. Loosening a cap or adding a recipient requires a challenge window delay—ensuring a compromised session cannot flash-drain funds.
* **Game-theoretic human veto ("On Collusion").** Over-threshold proposals require an agent bond and enter a cooling challenge window. Independent watchers can flag suspicious transactions for a slash reward, but the economic design prevents self-collusion farming (40% watcher / 30% owner / 30% burn).

---

## Three Surfaces, One Policy Core

The contract is the single source of truth. Every spending proposal passes through strict on-chain checks before NEAR Chain Signatures ever signs for a derived address.

| Surface | Role | Technology |
| --- | --- | --- |
| **Contract** | Enforces mandates, checks caps, manages bond locks and slashes, requests Chain Signatures. | NEAR smart contract (`bridle.near`) |
| **Agent Interface** | Minimal 4-field tool schema for AI agents (`propose_payment`). No key handling. | MCP Server / Tool API |
| **Monitor & App** | Mandate builder, live execution feed, watcher interface, and one-tap owner veto/revoke. | Next.js (App Router), TypeScript, Tailwind CSS |

---

## Mandate Specification

A **Mandate** is the primary governance object the owner signs on NEAR. Every proposal the agent submits is validated against these parameters:

| Field | Type | Default | Validation & Rules |
| --- | --- | --- | --- |
| `owner` | NEAR Account | Signer | Must sign creation and manual veto calls. |
| `agent` | NEAR Account | Required | Designated agent identifier. One agent per mandate in v1. |
| `chains` | List | `Base`, `Solana` | Target execution chains with adapter support. |
| `assets` | Per-chain list | `USDC` | Stablecoins only, matched by contract address or mint. |
| `recipients` | Per-chain allowlist | Deny all | Non-empty allowlist. Address format checked per target chain. |
| `per_tx_cap` | Amount | 25 USDC | Maximum allowed spend per individual proposal. Must be $\le$ daily cap. |
| `daily_cap` | Amount | 50 USDC | Maximum cumulative spend per UTC day (resets at 00:00 UTC). |
| `cooling_threshold` | Amount | 20 USDC | Amounts strictly above this require an agent bond and enter the challenge window. |
| `challenge_window` | Seconds | 600s (10m) | Delay period during which watchers or owners can flag/veto over-threshold proposals. |
| `bond` | NEAR | 1 NEAR | Bond required from agent before queuing an over-threshold proposal. |
| `expiry` | Timestamp | 7 days | Maximum mandate duration before mandatory re-signing (max 30 days). |
| `state` | Enum | `Active` | `Active` or `Revoked`. Revocation immediately freezes all pending proposals. |

### Core Invariants Enforced by the Contract
1. **Smallest Unit Arithmetic:** All amounts are parsed as integers in the token's smallest unit (e.g. 6 decimals for USDC). No floating point and no reliance on price oracles.
2. **Deny-by-Default:** An empty recipient allowlist prevents any spending.
3. **Asymmetric Rule Changes:** Tightening a limit or removing a recipient executes instantaneously. Loosening a cap or expanding allowlists is delayed by one challenge window.
4. **Instant Revocation:** Revoking a mandate instantly voids any unexecuted proposals.
5. **Fail-Closed Silence:** If an over-threshold proposal is flagged and the owner takes no action, the proposal expires unexecuted. The system favors a missed payment over a fraudulent spend.

---

## Proposal Lifecycle

```
  [Agent: propose_payment]
             |
             v
   +--------------------+
   | Contract Policy    | -----> Exceeds Cap / Invalid Recipient ---> [REJECTED]
   | Check Against      |
   | Active Mandate     |
   +--------------------+
             |
             +--- Amount <= Cooling Threshold ---> [SIGNED & EXECUTED IMMEDIATELY]
             |
             +--- Amount > Cooling Threshold (Requires Agent Bond)
                       |
                       v
            +-----------------------+
            | Challenge Window      | <--- Watcher Flag / Owner Veto
            | (e.g. 10 Minutes)     |
            +-----------------------+
                       |
         +-------------+-------------+
         |                           |
    [No Flags]                  [Flagged]
         |                           |
         v                           v
  [Anyone Calls Execute]     Owner reviews flag:
  [Signed via NEAR MPC]      - Confirmed: Agent slashed (40% watcher, 30% owner, 30% burn)
                             - Dismissed: Watcher bond forfeited to agent
                             - Silent: Proposal expires unexecuted
```

### Agent Tool Schema
The agent never constructs raw blockchain transactions, signs payloads, or interacts with private keys. Its tool interface is restricted to four declarative fields:

```json
{
  "name": "propose_payment",
  "description": "Propose a stablecoin payment. The mandate decides whether it is allowed.",
  "input_schema": {
    "type": "object",
    "properties": {
      "chain": { "type": "string", "enum": ["base", "solana"] },
      "asset": { "type": "string", "enum": ["USDC"] },
      "amount": { "type": "string", "description": "Integer in the token's smallest unit" },
      "recipient": { "type": "string", "description": "Recipient address on the destination chain" }
    },
    "required": ["chain", "asset", "amount", "recipient"]
  }
}
```

Because the adapter on NEAR builds the destination calldata directly, prompt-injected or compromised agents cannot smuggle unauthorized instructions, switch destinations, or call arbitrary smart contracts.

---

## Threat Model

| Threat Scenario | Covered? | Defense & Guarantees |
| --- | :---: | --- |
| **Prompt-injected agent tries to drain funds** | **Yes** | Per-transaction and daily caps reject excessive spending immediately at the contract level. |
| **Agent tries to send to unauthorized wallet** | **Yes** | Strict allowlist match required per destination chain; unknown recipients rejected on propose. |
| **Agent tries to smuggle malicious calldata** | **Yes** | Agent submits 4 fields only. The contract builds transaction bytes deterministically. |
| **Stolen owner session attempts to widen limits** | **Partly** | Limit increases are delayed by a challenge window; revocation remains instant. |
| **Owner allowlist contains a malicious address** | **No** | Policy enforcement is only as sound as the owner's chosen allowlist. |
| **Colluding agent and watcher attempt slash farming** | **Yes** | Slashing burns 30% and routes 30% to the owner; watcher receives at most 40%, making farming net-negative. |
| **Destination execution failure / out of gas** | **Operational** | Derived addresses require native gas on destination chains; proposals failing execution are tracked. |
| **Underlying MPC / consensus vulnerability** | **No** | Trust inherited directly from NEAR consensus and the Chain Signatures MPC threshold network. |

### Trust Assumptions Stated Plainly
1. **NEAR Consensus:** Settlement, mandate storage, and timekeeper for UTC daily cap resets and challenge windows.
2. **Chain Signatures MPC Network:** Threshold ECDSA / Ed25519 signing for derived addresses on Base and Solana.
3. **Destination RPC Broadcasters:** Broadcast liveness for signed transactions (cannot alter payloads or divert funds).

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx         # Root layout (Instrument Sans, JetBrains Mono, metadata)
│   ├── page.tsx           # Assembly: Nav, Hero, HowItWorks, Principles, Edges, Cta, Footer
│   ├── globals.css        # Tailwind directives and focus accessibility
│   └── icon.svg           # High-contrast dual-theme Bridle brand favicon
├── components/
│   ├── Nav.tsx            # Header navigation & demo action
│   ├── Hero.tsx           # Headline, pitch, and interactive mandate card
│   ├── MandateCard.tsx    # Live policy visualization & sample proposal feed
│   ├── HowItWorks.tsx     # 3-step lifecycle breakdown
│   ├── Principles.tsx     # Foundational design principles
│   ├── Edges.tsx          # Human-in-the-loop edge control & veto guarantees
│   ├── Cta.tsx            # Community, demo link, and developer spec targets
│   ├── Footer.tsx         # Clean footer with attribution
│   └── Logo.tsx           # Scalable SVG brand mark and wordmark
├── public/                # Static brand assets (bridle-mark.svg, icon.svg, logo.png)
├── SPEC.txt               # Complete technical specification and economics
├── tailwind.config.ts     # Curated palette (ink, paper, mute, accent: #0A7C59)
└── tsconfig.json          # Strict TypeScript configuration
```

---

## Local Development

Ensure dependencies are installed and run the Next.js development server:

```bash
npm install
npm run dev        # Starts local server at http://localhost:3000
npm run typecheck  # Validates TypeScript types across the codebase
npm run build      # Produces optimized production bundle
```

---

## Guardrails & Principles

* **Real enforcement only:** Never fake or mock an authorized spend. Policies are absolute.
* **Fail-closed:** If an over-threshold action is contested or unacknowledged, funds stay put.
* **Minimal agent authority:** The agent is an untrusted proposer, never a keyholder.
* **Brand identity:** Monochrome foundation (`#0E1116` ink, `#F6F7F9` paper) accented with forest green (`#0A7C59`). Clean typography using Instrument Sans and JetBrains Mono.
