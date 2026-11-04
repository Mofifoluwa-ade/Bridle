# Bridle executor

Gets a cleared Base payment signed by NEAR Chain Signatures and sends it. It cannot change what is paid: the contract builds the USDC transfer, and the executor only picks a nonce and fees (the contract caps both).

Before it broadcasts anything, it checks that the signature recovers to the mandate's own derived Base address. A signature from any other key, or a transaction altered after signing, is refused.

## What you need

- A deployed Bridle contract (see [../contract](../contract/README.md)) whose **executor** is an account you control, e.g. `exec.testnet`. A key for it goes in `EXECUTOR_KEY`.
- The contract account needs a little NEAR for the 1 yocto deposit and storage.
- Base Sepolia **ETH for gas** and **USDC** at the mandate's derived address (below). Free faucets exist for both; Circle's faucet issues Base Sepolia USDC.

## Run it

```bash
cd executor && npm install && npm run build

export BRIDLE_CONTRACT=bridle.testnet
npm run address -- 1        # prints the Base address for mandate 1: fund this
npm run doctor -- 1         # checks the setup before the first run

export EXECUTOR_ACCOUNT=exec.testnet
export EXECUTOR_KEY=ed25519:...        # never commit this
npm run once                # handle every proposal in Signing, then exit
npm start                   # same, forever (POLL_MS, default 15000)
```

Optional: `NEAR_RPC`, `BASE_RPC` (default https://sepolia.base.org), `NEAR_NETWORK=testnet`.

## First run on testnet

You need three testnet accounts: an **owner**, an **agent**, and an **executor** (for example `exec.testnet`), plus the contract account (for example `bridle.testnet`).

**1. Put the new contract code on testnet.**

- Fresh account: `cd contract && ./scripts/deploy-testnet.sh bridle.testnet exec.testnet` (the second argument is the executor).
- `bridle.testnet` is already deployed with the old code: deploy the new wasm without the init call, then call `migrate` once, which keeps existing mandates. The script above would fail here because `new` refuses to run twice. Roughly (near-cli-rs syntax changes between versions, so check `near contract deploy --help`):

```bash
cd contract && cargo near build non-reproducible-wasm
near contract deploy bridle.testnet use-file target/near/bridle_contract.wasm without-init-call network-config testnet sign-with-keychain send
near contract call-function as-transaction bridle.testnet migrate json-args '{}' prepaid-gas '100 Tgas' attached-deposit '0 NEAR' sign-as bridle.testnet network-config testnet sign-with-keychain send
```

Send the contract account about 2 NEAR (storage, and the 1 yocto deposit on each signature request).

**2. Create a mandate** in the app as the owner, with chain **Base** and one Base recipient you control (any Base Sepolia address). Note its id.

**3. Run the pre-flight and fix what it lists.**

```bash
cd executor && npm install && npm run build
export BRIDLE_CONTRACT=bridle.testnet EXECUTOR_ACCOUNT=exec.testnet EXECUTOR_KEY=ed25519:...
npm run doctor -- <mandate id>
```

It checks that the new contract is deployed, that the executor account matches, the mandate is usable, Base Sepolia is reachable, and that the mandate's Base address holds gas ETH and USDC. It prints that address: fund it from a Base Sepolia ETH faucet and Circle's USDC faucet, then rerun until it says "Ready".

**4. Make a payment happen.** As the agent, post the bond and propose a payment at or below the pause threshold to your Base recipient (use the app's agent console). Then call `execute` on the proposal from any account.

**5. Sign and send.** `npm run once`. The log shows the signature request, the broadcast hash and the receipt, and the proposal becomes `Executed` with the Base transaction hash. Look it up on https://sepolia.basescan.org.

**If something fails**, send the output of `npm run doctor` and `npm run once`. They contain addresses and transaction hashes only, never keys.

## Tests

```bash
npm test
```

23 tests. Address derivation is checked against vectors from the official `chainsig.js`. Signature assembly is checked with a local key standing in for the MPC key, including a wrong signer, a tampered transaction and a high-s signature. The flow is checked with fake dependencies: one signature per proposal, restart safety, reverts reported as failures. **Not covered by tests:** the live MPC signer and Base Sepolia, which need a network.
