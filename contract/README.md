# Bridle contract (NEAR testnet)

One contract holds every mandate and proposal. The web app reads it directly over RPC and your wallet signs every write. There is no backend.

## What it enforces today

- **Mandate rules:** agent, chains (Base, Solana), USDC only, per-chain recipient allowlist (empty denies all), per-payment cap, UTC-day cap, pause threshold, challenge window (60 s to 24 h), expiry (1 to 30 days).
- **Loosening is delayed.** Tightening applies instantly; any loosening waits one challenge window.
- **Blocked proposals are recorded** with the rule that stopped them.
- **Challenge window and flags.** Payments above the threshold wait. Watchers stake 10% of the agent bond to flag. The owner confirms (agent bond slashed 40% watcher / 30% owner / 30% burned) or dismisses (watcher stake goes to the agent). A flag nobody answers expires and nothing moves. A flagged payment never runs without the owner dismissing the flag.
- **Instant revoke and veto.**

## Signing a Base payment (Chain Signatures)

Once a proposal is cleared (`execute`), it is `Signing`. Then:

1. The registered **executor** calls `request_signature(proposal_id, nonce, max_fee_per_gas, max_priority_fee_per_gas, gas_limit)` with 300 TGas.
2. The **contract** builds the transaction itself: an EIP-1559 ERC-20 `transfer(recipient, amount)` to the Base Sepolia USDC contract, value 0. The executor chooses only the nonce and fees (capped: gas limit 250k, max fee 200 gwei). It cannot change the token, recipient or amount.
3. The contract hashes it and calls `v1.signer-prod.testnet` `sign` with the path `bridle-<mandate id>`. Each mandate therefore has its own Base address, derived from this contract's account and that path.
4. `on_signed` stores `r`, `s` and the recovery id in a signing record (`get_signing`). One record per proposal: a second request is refused, so a retry or a bad executor cannot pay twice. If the signer fails, the slot is freed and nothing was signed.
5. The executor assembles and broadcasts the transaction, then calls `report_execution(proposal_id, tx_hash)` (or `report_failure` if it reverted). See [`../executor`](../executor/README.md).

`timeout_signing` is refused while a signature exists, because a signed transaction may already be on its way.

**Not built:** Solana (Ed25519, domain 1). Intents. **Known limits:** once the MPC has signed, the transaction cannot be recalled, so revoking a mandate stops everything that is not yet signed. The executor is trusted to report truthfully; it is not trusted with the payment itself.

## Upgrading a deployed contract

State changed (a new signing map). To keep existing mandates, deploy the new wasm without init, then call `migrate` once as the contract account. Check the exact `near` commands against your installed version.

## Test it

```bash
cargo test            # 22 tests: policy rules, EVM transaction bytes (checked against viem), signing guards
```

(`rust-toolchain.toml` adds the wasm target. If you run plain `cargo check`, use `cargo check --tests`.)

## Deploy

```bash
cargo install cargo-near
# near-cli-rs: https://github.com/near/near-cli-rs
./scripts/deploy-testnet.sh your-bridle.testnet            # executor defaults to the contract account
./scripts/deploy-testnet.sh your-bridle.testnet exec.testnet
```

Check the `near` and `cargo near` subcommands against your installed versions if the script errors; the CLIs change between releases.

## Two accounts to test with

You need an **owner** and an **agent** account (both `*.testnet`, free from the faucet / MyNearWallet). Create a mandate as the owner naming the agent, switch wallet accounts, post the bond as the agent from the Agent console, and propose.

## Methods

| Who | Method |
| --- | --- |
| Owner | `create_mandate`, `revoke`, `update_limits`, `veto`, `resolve_flag` |
| Agent | `post_bond` (payable), `propose_payment`, `withdraw_bond` |
| Watcher | `flag` (payable) |
| Anyone | `execute`, `expire_flag`, `apply_pending_limits`, `timeout_signing`, views (`get_signing`, `get_derivation_path`) |
| Executor | `request_signature`, `report_execution`, `report_failure` |

Amounts are integers in smallest units (USDC has 6 decimals). Bonds are yoctoNEAR.
