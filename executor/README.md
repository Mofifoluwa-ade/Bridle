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

export EXECUTOR_ACCOUNT=exec.testnet
export EXECUTOR_KEY=ed25519:...        # never commit this
npm run once                # handle every proposal in Signing, then exit
npm start                   # same, forever (POLL_MS, default 15000)
```

Optional: `NEAR_RPC`, `BASE_RPC` (default https://sepolia.base.org), `NEAR_NETWORK=testnet`.

## Try the whole flow on testnet

1. Create a mandate in the app with a Base recipient. Run `npm run address -- <mandate id>` and fund that address with Base Sepolia ETH and USDC.
2. Post the agent bond, propose a payment at or below the pause threshold, then call `execute` on it (any account can).
3. `npm run once`. The log shows the signature request, the broadcast hash and the receipt. The proposal becomes `Executed` with the Base transaction hash.

## Tests

```bash
npm test
```

15 tests. Address derivation is checked against vectors from the official `chainsig.js`. Signature assembly is checked with a local key standing in for the MPC key, including a wrong signer, a tampered transaction and a high-s signature. The flow is checked with fake dependencies: one signature per proposal, restart safety, reverts reported as failures. **Not covered by tests:** the live MPC signer and Base Sepolia, which need a network.
