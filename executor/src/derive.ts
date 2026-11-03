// Which Base address does the NEAR MPC signer control for a mandate?
// The signer derives a child key from its root public key, the calling account (the Bridle
// contract) and a path ("bridle-<mandateId>"). Anyone can compute it from public data, which is
// how the owner knows where to send test USDC and how the executor checks a signature.
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import { base58 } from "@scure/base";
import { getAddress, keccak256 } from "viem";

/** MPC root public keys, from the Chain Signatures docs and chainsig.js. */
export const ROOT_PUBLIC_KEY = {
  testnet:
    "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
  mainnet:
    "secp256k1:3tFRbMqmoa6AAALMrEFAYCEoHcqKxeW38YptwowBVBtXK1vo36HDbUWuR6EZmoK4JcH6HDkNMGGqP1ouV7VZUWya",
} as const;

export const derivationPath = (mandateId: number | bigint | string) => `bridle-${mandateId}`;

/** child = root + H(predecessor, path) * G, as the MPC contract defines it. */
export function deriveChildPublicKey(root: string, predecessor: string, path: string): string {
  const raw = base58.decode(root.split(":")[1]);
  if (raw.length !== 64) throw new Error("root public key must be 64 bytes");
  const rootPoint = secp256k1.ProjectivePoint.fromHex("04" + bytesToHex(raw));
  const epsilon = sha3_256(`near-mpc-recovery v0.1.0 epsilon derivation:${predecessor},${path}`);
  const tweak = BigInt("0x" + bytesToHex(epsilon)) % secp256k1.CURVE.n;
  const child = rootPoint.add(secp256k1.ProjectivePoint.BASE.multiply(tweak));
  return bytesToHex(child.toRawBytes(false)); // 04 || X || Y
}

export function evmAddressOf(uncompressedPublicKeyHex: string): `0x${string}` {
  const body = uncompressedPublicKeyHex.startsWith("04") ? uncompressedPublicKeyHex.slice(2) : uncompressedPublicKeyHex;
  return getAddress(`0x${keccak256(`0x${body}`).slice(-40)}`);
}

export function mandateAddress(
  network: keyof typeof ROOT_PUBLIC_KEY,
  contractId: string,
  mandateId: number | bigint | string,
): `0x${string}` {
  return evmAddressOf(deriveChildPublicKey(ROOT_PUBLIC_KEY[network], contractId, derivationPath(mandateId)));
}
