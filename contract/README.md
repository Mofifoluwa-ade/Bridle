# Bridle contract (NEAR testnet)

One contract holds every mandate and proposal. The web app reads it directly over RPC and your wallet signs every write. There is no backend.

## What it enforces today

- **Mandate rules:** agent, chains (Base, Solana), USDC only, per-chain recipient allowlist (empty denies all), per-payment cap, UTC-day cap, pause threshold, challenge window (60 s to 24 h), expiry (1 to 30 days).
- **Loosening is delayed.** Tightening applies instantly; any loosening waits one challenge window.
- **Blocked proposals are recorded** with the rule that stopped them.
- **Challenge window and flags.** Payments above the threshold wait. Watchers stake 10% of the agent bond to flag. The owner confirms (agent bond slashed 40% watcher / 30% owner / 30% burned) or dismisses (watcher stake goes to the agent). A flag nobody answers expires and nothing moves. A flagged payment never runs without the owner dismissing the flag.
- **Instant revoke and veto.**

## What it does not do yet (be honest in the demo)

`execute` clears a proposal and emits a `ready_to_sign` event. It does **not** yet build the Base or Solana transaction or call the NEAR MPC signer. That is the day-one spike in the spec: confirm the testnet signer account, derive per-mandate addresses, and build the transfer bytes. Until then a small registered `executor` account (set at `new`) reads the event and calls `report_execution(proposal_id, tx_hash)`. The whole policy flow can be tested on testnet today; the final on-chain transfer is the integration to finish.

## Test it

```bash
cargo test            # 8 unit tests: caps, allowlist, window, flag/slash, loosening, revoke
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
| Anyone | `execute`, `expire_flag`, `apply_pending_limits`, views |
| Executor | `report_execution` |

Amounts are integers in smallest units (USDC has 6 decimals). Bonds are yoctoNEAR.
