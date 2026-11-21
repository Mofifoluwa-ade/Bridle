# Bridle contract security review

Scope: `contract/src/lib.rs` and `contract/src/evm.rs` at main 2fa0c66 (NEAR testnet, `bridle.testnet`).
Method: full source read, entry-point and access-control map, state-transition and invariant review
(conservation of NEAR, mandate budgets, bond and flag accounting, signing flow), then a unit test per
finding. Severity follows Immunefi's smart contract scale, with the impact it names for each row.

Evidence tiers used below: **TESTED** means a cargo test demonstrates the behaviour on the old code and
the fixed behaviour on the new code. **SOURCE** means the source shows it but the sandbox cannot run
the NEAR runtime to measure it (gas and on-chain storage numbers).

No fork was possible (no NEAR RPC from the sandbox), so nothing here was run against testnet.
This review does not show the contract is free of bugs. It lists what was found and fixed, and what remains.

## Findings

| # | Severity | Title | Evidence | Status |
|---|---|---|---|---|
| 1 | High | Unbounded loops in `revoke` and `withdraw_bond` over every proposal in the contract | SOURCE | Fixed |
| 2 | High | Anyone can make the contract pay for storage (free mandates, free proposals) | SOURCE + TESTED | Fixed |
| 3 | High | USDC at a mandate's Base address is unrecoverable once the mandate is revoked or expires | TESTED | Fixed (new `owner_withdraw_base`) |
| 4 | Medium | `report_failure` refunds the daily budget after a valid signature exists | TESTED | Fixed |
| 5 | Medium | `timeout_signing` clock starts at eligibility, not at signing, so a cleared payment can be killed | TESTED | Fixed |
| 6 | Medium | A dead Waiting or Ready proposal locks the agent bond after expiry or revoke | TESTED | Fixed |
| 7 | Low | Zero-bond mandates allow free flagging | TESTED | Fixed (minimum watcher bond) |
| 8 | Low | Allowlist entries not validated per chain; Solana and non-USDC Base proposals can never be signed | TESTED | Fixed |
| 9 | Low | Agent-supplied strings had no length cap | SOURCE | Fixed |
| 10 | Info | Burn share sent to the all-zero implicit account | SOURCE | Fixed (kept in contract) |

### 1. Unbounded loops in `revoke` and `withdraw_bond` (High)

Both functions iterated `self.proposals.values()`, which is every proposal of every mandate. A blocked
proposal is still stored, and anyone can create a mandate with themselves as agent, so an attacker grows
that map for the price of gas. Past roughly a thousand entries (estimate from the protocol gas schedule;
not measured) the loop exceeds the gas limit. Effect: the owner's `revoke` stops working, and every
agent's bond becomes permanently unwithdrawable. Not measured in a unit test because the mocked VM does not
meter storage iteration (gas was identical with 0 and 1500 extra proposals), so this is SOURCE-verified.
Immunefi impact: permanent freezing of funds (agent bonds), loss of the owner's emergency control.

Fix: `revoke` is one write. A per-mandate counter (`holds`) tracks Flagged and Signing proposals, and
`withdraw_bond` checks the counter. New permissionless `close_dead_proposal` closes Waiting and Ready
proposals of a revoked or expired mandate one at a time.

### 2. Contract pays for attacker storage (High)

`create_mandate` and `propose_payment` wrote storage with no deposit, so NEAR storage staking came out of
the contract balance, which also holds owner funding and bonds. An attacker pays about 0.0005 NEAR of gas
per call and locks several times that in storage. Withdrawals can then fail for lack of free balance
until someone tops the contract up. Immunefi impact: temporary freezing of funds.

Fix: `create_mandate` is payable and must cover the mandate's storage plus a 0.05 NEAR minimum reserve.
Every stored proposal (rejected ones too) is charged a fixed 500 bytes against that reserve, plus 700
bytes for the signing record a Base proposal may create. When the reserve is gone the agent is refused
until the owner calls `fund_storage`. After the mandate ends the owner can take the rest back with
`withdraw_storage_reserve`. Tests: `e_*`. A 0.15 NEAR reserve stopped a spam loop after 28 proposals.
The fixed byte counts are used because `near_sdk::store` writes lazily, so `storage_usage()` does not move
inside a call.

### 3. Base USDC stranded after the mandate ends (High)

The mandate's Base address is derived by the MPC signer for this contract and path `bridle-<id>`. Signing
required an Active, unexpired mandate, and mandates expire within 30 days with no renewal. Any USDC left
at the address then had no way out, and the owner had no signing path of their own.

Fix: `owner_withdraw_base(mandate_id, amount, recipient)`. Owner only, any mandate state, caps do not
apply, never counts against the agent budget. It creates a Signing proposal that the executor signs as
usual. Tests: `f_*`. Note: the owner can already move this money by funding it, so this does not widen what
an agent can do.

### 4. Budget refund after a signature exists (Medium, privileged)

A stored signature is a valid transaction anyone can broadcast. `report_failure` still refunded the daily
budget. A colluding executor and agent could broadcast, report failure, and have the agent propose the same
amount again, looping past the daily cap. Bounded by the allowlist and the per-payment cap, and needs the
executor key. Fix: refund only when no signing record exists. Tests: `c_*`.

### 5. Signing timeout measured from eligibility (Medium, griefing)

`timeout_signing` compared against `executable_at + 1h`. A proposal that waited more than an hour (a long
challenge window, or executor lag) could be moved to Expired by anyone in the same block as `execute`,
before the executor requested a signature. The payment is lost and the agent must wait the whole window
again. Fix: `execute` sets `executable_at` to the time signing starts. Tests: `b_*`.

### 6. Dead proposals lock the agent bond (Medium)

`withdraw_bond` refused while any Waiting or Ready proposal existed, but after expiry or revoke only the
owner could clear them. Fix: only Flagged and Signing proposals hold the bond. Tests: `d_*`.

### 7-10. Smaller items

- Flag bond was `bond / 10`, so a zero-bond mandate allowed free flags that forced the owner to answer or
  censor the agent. Floor of 0.01 NEAR now.
- Allowlist addresses are validated per chain at creation. Solana proposals and non-USDC Base proposals are
  rejected at proposal time instead of sitting in Signing until timeout.
- Recipient length is capped at 128 and asset at 16.
- The burn share now stays in the contract (`get_burned`). The all-zero implicit account is a small-order
  Ed25519 key; whether a signature can be forged for it depends on the NEAR verifier, which was not checked.
  Keeping the funds in the contract removes the question.

## Trust assumptions (by design, not fixed)

- **Executor.** Trusted to broadcast signed transactions and report truthfully. It cannot change token,
  recipient or amount, and fees and gas are capped. If it never reports on a signed proposal, that proposal
  stays in Signing and holds the agent bond.
- **Owner can slash the agent bond.** The owner can flag their own proposal from a second account and
  confirm it. The bond is only as safe as the owner is honest.
- **Daily cap is a UTC calendar day.** An agent can spend one cap just before midnight and another just
  after.
- **Owner key** can loosen limits after one challenge window (60 seconds minimum). Tightening is instant.
- **Native NEAR out of contract.** `withdraw_near`, `withdraw_bond` and `withdraw_storage_reserve` debit
  state before the transfer and do not restore it if the transfer fails (for example a deleted account).

## Not demonstrated

- Nothing was run on testnet or against the real MPC signer.
- Gas costs of finding 1 and storage costs of finding 2 are estimates from the gas schedule and a fixed byte
  charge, not measurements.
- The executor service and the web app were only checked for compatibility with the new ABI (the app now
  attaches a deposit to `create_mandate`); they were not re-tested end to end.

## Upgrade notes

`migrate` now reads the native-NEAR layout (see README). Mandates created before the upgrade have no
reserve and are not charged, so they keep working; they are still exposed to nothing new, but the spam
path in finding 2 stays open only through new mandates, which now pay. Deploying and migrating needs the
contract account key; it was not done here.
