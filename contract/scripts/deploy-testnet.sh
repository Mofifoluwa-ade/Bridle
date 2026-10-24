#!/usr/bin/env bash
# Build and deploy the Bridle contract to NEAR testnet.
# Needs: Rust, cargo-near, near-cli-rs.   https://github.com/near/cargo-near   https://github.com/near/near-cli-rs
# Usage:  ./scripts/deploy-testnet.sh <contract-account.testnet> [executor-account.testnet]
set -euo pipefail

CONTRACT="${1:?usage: deploy-testnet.sh <contract-account.testnet> [executor-account.testnet]}"
EXECUTOR="${2:-$CONTRACT}"
cd "$(dirname "$0")/.."

echo "==> Building"
cargo near build non-reproducible-wasm

WASM="$(ls target/near/*.wasm | head -n1)"

echo "==> Creating $CONTRACT (skipped if it already exists)"
near account view-account-summary "$CONTRACT" network-config testnet now >/dev/null 2>&1 || \
  near account create-account sponsor-by-faucet-service "$CONTRACT" autogenerate-new-keypair save-to-keychain network-config testnet create

echo "==> Deploying $WASM and initialising (executor: $EXECUTOR)"
near contract deploy "$CONTRACT" use-file "$WASM" with-init-call new json-args "{\"executor\":\"$EXECUTOR\"}" prepaid-gas '100 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send

echo
echo "Done. Put this in web/.env.local:"
echo "  NEXT_PUBLIC_BRIDLE_CONTRACT=$CONTRACT"
