# Bridle spike log

**Chosen plan:** _TBD. Fill in by end of day one (Nov 1), then delete this line's placeholder._
Plan A = EVM + Solana. Plan B = EVM only. Plan C = Solana only. Plan D = NEAR-side assets + 1Click only.

Rule: time-box each of steps 4 and 6 to 2.5 hours. If a step is not passing by then, cut that chain.

## Facts already settled (from docs.near.org, Oct 27)

- Testnet signer contract: `v1.signer-prod.testnet` (mainnet: `v1.signer`). Source: https://docs.near.org/chain-abstraction/chain-signatures/implementation
- Key types: `Ecdsa` (secp256k1, for EVM) and `Eddsa` (ed25519, for Solana). Solana is listed as supported, and the Solana address is the ed25519 public key.
- Sign request parameters per the docs page: `payloads`, `path`, `keyType`, `signerAccount`. That page is the wallet-side API.
- NOT documented on that page, so measure in step 7: the contract-to-contract call shape (`key_version` / `domain_id`), the required attached deposit, signing latency.
- Still unconfirmed: whether a contract (not a wallet) can request an Eddsa signature on testnet. Step 5 answers this.

## Before you start

- [ ] NEAR testnet account funded; near-cli-rs and cargo-near installed
- [ ] Base Sepolia RPC + test ETH + test USDC (USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- [ ] Solana devnet RPC + devnet SOL + devnet USDC mint
- [ ] Contract account ID from the existing testnet deploy written here: `______`

## Steps (record result + time for each)

| # | Step | Pass condition | Result | Time |
|---|------|----------------|--------|------|
| 1 | Contract skeleton | view call returns on testnet | already deployed, re-verify | |
| 2 | Find the signer | call `v1.signer-prod.testnet` with a test payload, get a response or an understood error | | |
| 3 | Derive EVM address | same inputs give same address twice; fund with test ETH + USDC | | |
| 4 | Sign + send ERC-20 transfer (2.5h cap) | tx confirms on Base Sepolia, derived address is sender | | |
| 5 | Derive Solana address | signer accepts an Eddsa request for your path and returns an address; fund with devnet SOL | | |
| 6 | Sign + send Solana transfer (2.5h cap) | transfer confirms on devnet; executor supplies recent blockhash only | | |
| 7 | Measure | signing latency (s), deposit needed, gas used | | |
| 8 | Policy smoke test | over-cap call rejected, no signature requested | | |

## Wiring note

`execute` in `contract/src/lib.rs` currently marks a proposal `Signing` and emits `ready_to_sign`. The spike replaces that with: adapter builds tx bytes -> cross-contract call to the signer -> callback stores the signature -> executor broadcasts -> `report_execution`. Keep the failure/timeout handlers you added for a signer call that never returns.

## Decision (write before day two)

Result: ______  Plan: ______  Cut list in order if behind: second chain, 1Click path, TEE, bond economics (keep plain owner veto). Never cut the adversarial demo.
