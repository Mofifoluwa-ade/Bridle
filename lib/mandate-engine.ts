import { Mandate, Proposal, ValidationCheck, SlashBreakdown, ChainType } from "@/types/mandate";

export const DEFAULT_MANDATE: Mandate = {
  owner: "mofifoluwa.testnet",
  agent: "agent-runner.testnet",
  chains: ["Base", "Solana"],
  assets: ["USDC"],
  recipients: [
    {
      id: "rec-1",
      chain: "Base",
      address: "0x39e28cde55cab798874746ac52cb4b5cc99a0194",
      label: "Compute & Inference Provider",
    },
    {
      id: "rec-2",
      chain: "Base",
      address: "0xb1E994586E62994648a0b866BF33F2EDd942512e",
      label: "Indexing Relayer Vault",
    },
    {
      id: "rec-3",
      chain: "Solana",
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      label: "Solana RPC Gateway",
    },
  ],
  per_tx_cap: 25,
  daily_cap: 50,
  daily_spent: 18,
  cooling_threshold: 20,
  challenge_window: 600, // 10 minutes
  bond: 1, // 1 NEAR
  expiry: "7 days from creation",
  state: "Active",
};

export const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: "prop-101",
    createdAt: "2m ago",
    chain: "Base",
    asset: "USDC",
    amount: 18.0,
    amountRaw: "18000000",
    recipient: "0x39e28cde55cab798874746ac52cb4b5cc99a0194",
    recipientLabel: "Compute & Inference Provider",
    state: "Approved",
    ruleCited: "Approved recipient, within $20 cooling threshold",
    txHash: "0x8fa47b192809cd83a99264c917bf6417d47781bcf7ca6114227318be79e491fa",
    explorerUrl:
      "https://sepolia.basescan.org/tx/0x8fa47b192809cd83a99264c917bf6417d47781bcf7ca6114227318be79e491fa",
    calldataPreview: {
      to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
      method: "transfer(address to, uint256 amount)",
      derivedSigner: "0x6f91B52eF44203673B8e705bCdf492E898fA6128",
      payloadHex: "0xa9059cbb00000000000000000000000039e28cde55cab798874746ac52cb4b5cc99a0194000000000000000000000000000000000000000000000000000000000112a880",
    },
  },
  {
    id: "prop-102",
    createdAt: "8m ago",
    chain: "Base",
    asset: "USDC",
    amount: 240.0,
    amountRaw: "240000000",
    recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    recipientLabel: "Unknown Address (Adversarial attempt)",
    state: "Blocked",
    ruleCited: "Recipient not on the list, exceeds daily cap of $50",
  },
  {
    id: "prop-103",
    createdAt: "14m ago",
    chain: "Solana",
    asset: "USDC",
    amount: 32.0,
    amountRaw: "32000000",
    recipient: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    recipientLabel: "Solana RPC Gateway",
    state: "Waiting",
    ruleCited: "Above the $20 threshold. Waiting for veto.",
    agentBondLocked: 1.0,
    coolingExpiresAt: "8m remaining",
    calldataPreview: {
      to: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      method: "SplTokenProgram.transferChecked(32_000_000)",
      derivedSigner: "Br1d1eMpc91kGzLwGjZfH1wPn92kVbYn78XwYqZaRt9M",
      payloadHex: "0x0c00000000000000000000000000000001e8480000000000",
    },
  },
];

export function validateProposal(
  mandate: Mandate,
  params: {
    chain: ChainType;
    asset: "USDC";
    amount: number;
    recipient: string;
  }
): ValidationCheck {
  // 1. Check if mandate is revoked
  if (mandate.state === "Revoked") {
    return {
      valid: false,
      requiresCooling: false,
      status: "Blocked",
      ruleCited: "Mandate is revoked. All agent actions are frozen.",
    };
  }

  // 2. Check allowlist for the chain
  const matchingRecipient = mandate.recipients.find(
    (r) =>
      r.chain.toLowerCase() === params.chain.toLowerCase() &&
      r.address.toLowerCase() === params.recipient.toLowerCase()
  );

  if (!matchingRecipient) {
    return {
      valid: false,
      requiresCooling: false,
      status: "Blocked",
      ruleCited: "Recipient not on the list.",
    };
  }

  // 3. Check per-tx cap
  if (params.amount > mandate.per_tx_cap) {
    return {
      valid: false,
      requiresCooling: false,
      status: "Blocked",
      ruleCited: `Exceeds the per-transaction cap ($${mandate.per_tx_cap}.00).`,
    };
  }

  // 4. Check daily cap
  if (mandate.daily_spent + params.amount > mandate.daily_cap) {
    const remaining = Math.max(0, mandate.daily_cap - mandate.daily_spent);
    return {
      valid: false,
      requiresCooling: false,
      status: "Blocked",
      ruleCited: `Exceeds the daily cap of $${mandate.daily_cap}.00 ($${remaining}.00 remaining today).`,
    };
  }

  // 5. Check cooling threshold
  if (params.amount > mandate.cooling_threshold) {
    return {
      valid: true,
      requiresCooling: true,
      status: "Waiting",
      ruleCited: `Above the $${mandate.cooling_threshold} threshold. Waiting for veto.`,
    };
  }

  // 6. Allowed for immediate execution
  return {
    valid: true,
    requiresCooling: false,
    status: "Approved",
    ruleCited: "Approved recipient, within caps and cooling threshold.",
  };
}

export function computeSlashBreakdown(bondAmount = 1): SlashBreakdown {
  return {
    total: bondAmount,
    watcherShare: bondAmount * 0.4, // 40%
    ownerShare: bondAmount * 0.3, // 30%
    burnShare: bondAmount * 0.3, // 30%
  };
}

export function generateMockTxHash(chain: ChainType): {
  txHash: string;
  explorerUrl: string;
} {
  const chars = "abcdef0123456789";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }

  if (chain === "Base") {
    return {
      txHash: hash,
      explorerUrl: `https://sepolia.basescan.org/tx/${hash}`,
    };
  }

  // Solana base58 mock
  const solChars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let solHash = "";
  for (let i = 0; i < 88; i++) {
    solHash += solChars[Math.floor(Math.random() * solChars.length)];
  }
  return {
    txHash: solHash,
    explorerUrl: `https://explorer.solana.com/tx/${solHash}/?cluster=devnet`,
  };
}

export function generateAdversarialProposal(mandate: Mandate): Proposal {
  return {
    id: `prop-adv-${Date.now()}`,
    createdAt: "Just now",
    chain: "Base",
    asset: "USDC",
    amount: 240.0,
    amountRaw: "240000000",
    recipient: "0xBadActorEvilTreasuryDrainAddress0000001",
    recipientLabel: "Adversarial Prompt-Injection Attack",
    state: "Blocked",
    ruleCited: `Blocked: Recipient not on allowlist and $240.00 exceeds $${mandate.per_tx_cap}.00 cap.`,
  };
}

