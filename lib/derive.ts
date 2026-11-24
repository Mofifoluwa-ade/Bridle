import { baseDecode } from "@near-js/utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256, sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import { CONFIG } from "./config";

/** MPC root public keys, from the Chain Signatures docs and chainsig.js. */
export const ROOT_PUBLIC_KEY = {
  testnet:
    "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
  mainnet:
    "secp256k1:3tFRbMqmoa6AAALMrEFAYCEoHcqKxeW38YptwowBVBtXK1vo36HDbUWuR6EZmoK4JcH6HDkNMGGqP1ouV7VZUWya",
} as const;

export const derivationPath = (mandateId: number | bigint | string) => `bridle-${mandateId}`;

/** EIP-55 checksumming using keccak_256 */
export function toChecksumAddress(address: string): `0x${string}` {
  const addr = address.toLowerCase().replace(/^0x/, "");
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)));
  let ret = "0x";
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += addr[i].toUpperCase();
    } else {
      ret += addr[i];
    }
  }
  return ret as `0x${string}`;
}

/** child = root + H(predecessor, path) * G, as the MPC contract defines it. */
export function deriveChildPublicKey(root: string, predecessor: string, path: string): string {
  const raw = baseDecode(root.split(":")[1]);
  if (raw.length !== 64) throw new Error("root public key must be 64 bytes");
  const rootPoint = secp256k1.ProjectivePoint.fromHex("04" + bytesToHex(raw));
  const epsilon = sha3_256(new TextEncoder().encode(`near-mpc-recovery v0.1.0 epsilon derivation:${predecessor},${path}`));
  const tweak = BigInt("0x" + bytesToHex(epsilon)) % secp256k1.CURVE.n;
  const child = rootPoint.add(secp256k1.ProjectivePoint.BASE.multiply(tweak));
  return bytesToHex(child.toRawBytes(false)); // 04 || X || Y
}

export function evmAddressOf(uncompressedPublicKeyHex: string): `0x${string}` {
  const body = uncompressedPublicKeyHex.startsWith("04") ? uncompressedPublicKeyHex.slice(2) : uncompressedPublicKeyHex;
  const bytes = new Uint8Array(body.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(body.slice(i * 2, i * 2 + 2), 16);
  }
  const hash = keccak_256(bytes);
  const hex = bytesToHex(hash).slice(-40);
  return toChecksumAddress(`0x${hex}`);
}

export function mandateAddress(
  network: keyof typeof ROOT_PUBLIC_KEY,
  contractId: string,
  mandateId: number | bigint | string,
): `0x${string}` {
  return evmAddressOf(deriveChildPublicKey(ROOT_PUBLIC_KEY[network], contractId, derivationPath(mandateId)));
}

export type BaseBalances = {
  eth: string;
  usdc: string;
  rawEth: bigint;
  rawUsdc: bigint;
};

/** Query Base Sepolia RPC for live ETH and USDC balances */
export async function fetchBaseBalances(address: `0x${string}`): Promise<BaseBalances> {
  const rpc = CONFIG.baseRpc;
  const cleanAddr = address.toLowerCase().replace(/^0x/, "");

  const getBalReq = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [address, "latest"],
  };

  const data = "0x70a08231" + cleanAddr.padStart(64, "0");
  const callReq = {
    jsonrpc: "2.0",
    id: 2,
    method: "eth_call",
    params: [{ to: CONFIG.baseUsdc, data }, "latest"],
  };

  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify([getBalReq, callReq]),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Base RPC returned ${res.status}`);
  const results = await res.json();
  const ethHex = results.find((r: any) => r.id === 1)?.result ?? "0x0";
  const usdcHex = results.find((r: any) => r.id === 2)?.result ?? "0x0";

  const rawEth = BigInt(ethHex);
  const rawUsdc = BigInt(usdcHex);

  const ethStr = (Number(rawEth) / 1e18).toFixed(4);
  const usdcStr = (Number(rawUsdc) / 1e6).toFixed(2);

  return {
    eth: ethStr,
    usdc: usdcStr,
    rawEth,
    rawUsdc,
  };
}

