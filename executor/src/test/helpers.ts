import { keccak256, serializeTransaction, encodeFunctionData, parseAbi } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export const USDC = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
const abi = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);

/** The same bytes the contract builds (checked against the Rust fixtures). */
export function unsignedTransfer(to: `0x${string}`, amount: bigint, nonce = 0) {
  return serializeTransaction({
    type: "eip1559",
    chainId: 84532,
    nonce,
    maxPriorityFeePerGas: 1_000_000n,
    maxFeePerGas: 2_000_000n,
    gas: 100_000n,
    to: USDC,
    value: 0n,
    data: encodeFunctionData({ abi, functionName: "transfer", args: [to, amount] }),
  });
}

/** Stands in for the MPC key: a local key whose address plays the mandate's derived address. */
export async function fakeMpc() {
  const account = privateKeyToAccount(generatePrivateKey());
  return {
    address: account.address,
    async sign(unsignedHex: string) {
      const sig = await account.sign({ hash: keccak256(`0x${unsignedHex}` as `0x${string}`) });
      const r = sig.slice(2, 66);
      const s = sig.slice(66, 130);
      const v = parseInt(sig.slice(130, 132), 16);
      return { r, s, recovery_id: v - 27 };
    },
  };
}
