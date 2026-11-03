//! Minimal EVM transaction builder. The contract, not the agent or the executor, decides what
//! bytes get signed: an ERC-20 `transfer(recipient, amount)` to a fixed token address, sent as an
//! EIP-1559 transaction. Pure functions, no NEAR imports, so they can be checked against viem.

pub type Address = [u8; 20];

/// `transfer(address,uint256)` selector.
const TRANSFER_SELECTOR: [u8; 4] = [0xa9, 0x05, 0x9c, 0xbb];

/// Parse `0x` + 40 hex characters (any case). Checksums are not enforced.
pub fn parse_address(s: &str) -> Option<Address> {
    let hex = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X"))?;
    if hex.len() != 40 {
        return None;
    }
    let mut out = [0u8; 20];
    for i in 0..20 {
        out[i] = u8::from_str_radix(hex.get(i * 2..i * 2 + 2)?, 16).ok()?;
    }
    Some(out)
}

pub fn hex(bytes: &[u8]) -> String {
    const H: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(H[(b >> 4) as usize] as char);
        s.push(H[(b & 15) as usize] as char);
    }
    s
}

/// ERC-20 `transfer(to, amount)` calldata: 4 + 32 + 32 bytes.
pub fn erc20_transfer_calldata(to: &Address, amount: u128) -> Vec<u8> {
    let mut d = Vec::with_capacity(68);
    d.extend_from_slice(&TRANSFER_SELECTOR);
    d.extend_from_slice(&[0u8; 12]);
    d.extend_from_slice(to);
    d.extend_from_slice(&[0u8; 16]);
    d.extend_from_slice(&amount.to_be_bytes());
    d
}

fn be_minimal(v: u128) -> Vec<u8> {
    let b = v.to_be_bytes();
    let first = b.iter().position(|x| *x != 0).unwrap_or(16);
    b[first..].to_vec()
}

fn len_prefix(len: usize, short: u8, long: u8) -> Vec<u8> {
    if len < 56 {
        vec![short + len as u8]
    } else {
        let l = be_minimal(len as u128);
        let mut out = vec![long + l.len() as u8];
        out.extend(l);
        out
    }
}

fn rlp_bytes(b: &[u8]) -> Vec<u8> {
    if b.len() == 1 && b[0] < 0x80 {
        return b.to_vec();
    }
    let mut out = len_prefix(b.len(), 0x80, 0xb7);
    out.extend_from_slice(b);
    out
}

fn rlp_uint(v: u128) -> Vec<u8> {
    rlp_bytes(&be_minimal(v))
}

fn rlp_list(payload: Vec<u8>) -> Vec<u8> {
    let mut out = len_prefix(payload.len(), 0xc0, 0xf7);
    out.extend(payload);
    out
}

pub struct Eip1559Transfer<'a> {
    pub chain_id: u64,
    pub nonce: u64,
    pub max_priority_fee_per_gas: u128,
    pub max_fee_per_gas: u128,
    pub gas_limit: u64,
    /// The token contract the call goes to.
    pub token: &'a Address,
    pub recipient: &'a Address,
    pub amount: u128,
}

/// The unsigned typed transaction: `0x02 || rlp([chainId, nonce, tip, maxFee, gas, to, value,
/// data, accessList])`. Its keccak256 is what the MPC signer signs.
pub fn unsigned_eip1559_transfer(t: &Eip1559Transfer) -> Vec<u8> {
    let data = erc20_transfer_calldata(t.recipient, t.amount);
    let mut payload = Vec::new();
    payload.extend(rlp_uint(t.chain_id as u128));
    payload.extend(rlp_uint(t.nonce as u128));
    payload.extend(rlp_uint(t.max_priority_fee_per_gas));
    payload.extend(rlp_uint(t.max_fee_per_gas));
    payload.extend(rlp_uint(t.gas_limit as u128));
    payload.extend(rlp_bytes(t.token));
    payload.extend(rlp_uint(0)); // value: no native ETH ever moves
    payload.extend(rlp_bytes(&data));
    payload.extend(rlp_list(Vec::new())); // empty access list
    let mut out = vec![0x02];
    out.extend(rlp_list(payload));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const USDC: &str = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";

    struct Case {
        nonce: u64,
        tip: u128,
        max: u128,
        gas: u64,
        to: &'static str,
        amount: u128,
        calldata: &'static str,
        unsigned: &'static str,
    }

    // Generated with viem's serializeTransaction / encodeFunctionData (chainId 84532).
    const CASES: &[Case] = &[
        Case { nonce: 0, tip: 1000000, max: 2000000, gas: 100000, to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", amount: 1000000,
            calldata: "a9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000f4240",
            unsigned: "02f86e83014a3480830f4240831e8480830186a094036cbd53842c5426634e7929541ec2318f3dcf7e80b844a9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000f4240c0" },
        Case { nonce: 7, tip: 1500000000, max: 30000000000, gas: 65000, to: "0xabcdef0123456789abcdef0123456789abcdef01", amount: 18500000,
            calldata: "a9059cbb000000000000000000000000abcdef0123456789abcdef0123456789abcdef0100000000000000000000000000000000000000000000000000000000011a49a0",
            unsigned: "02f87083014a34078459682f008506fc23ac0082fde894036cbd53842c5426634e7929541ec2318f3dcf7e80b844a9059cbb000000000000000000000000abcdef0123456789abcdef0123456789abcdef0100000000000000000000000000000000000000000000000000000000011a49a0c0" },
        Case { nonce: 300, tip: 1, max: 100000000000, gas: 200000, to: "0x0000000000000000000000000000000000000001", amount: 340282366920938463463374607431768211455,
            calldata: "a9059cbb000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000ffffffffffffffffffffffffffffffff",
            unsigned: "02f86f83014a3482012c0185174876e80083030d4094036cbd53842c5426634e7929541ec2318f3dcf7e80b844a9059cbb000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000ffffffffffffffffffffffffffffffffc0" },
        Case { nonce: 128, tip: 0, max: 55, gas: 21000, to: "0xffffffffffffffffffffffffffffffffffffffff", amount: 0,
            calldata: "a9059cbb000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000",
            unsigned: "02f86883014a348180803782520894036cbd53842c5426634e7929541ec2318f3dcf7e80b844a9059cbb000000000000000000000000ffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000c0" },
    ];

    #[test]
    fn matches_viem_byte_for_byte() {
        let token = parse_address(USDC).unwrap();
        for c in CASES {
            let to = parse_address(c.to).unwrap();
            assert_eq!(hex(&erc20_transfer_calldata(&to, c.amount)), c.calldata);
            let tx = unsigned_eip1559_transfer(&Eip1559Transfer {
                chain_id: 84532,
                nonce: c.nonce,
                max_priority_fee_per_gas: c.tip,
                max_fee_per_gas: c.max,
                gas_limit: c.gas,
                token: &token,
                recipient: &to,
                amount: c.amount,
            });
            assert_eq!(hex(&tx), c.unsigned, "nonce {}", c.nonce);
        }
    }

    #[test]
    fn address_parsing_is_strict() {
        assert!(parse_address("0x036cbd53842c5426634e7929541ec2318f3dcf7e").is_some());
        assert!(parse_address("0X036CBD53842C5426634E7929541EC2318F3DCF7E").is_some());
        assert!(parse_address("036cbd53842c5426634e7929541ec2318f3dcf7e").is_none());
        assert!(parse_address("0x036cbd").is_none());
        assert!(parse_address("0x036cbd53842c5426634e7929541ec2318f3dcf7g").is_none());
        // a multi-byte character must not panic
        assert!(parse_address("0xéé6cbd53842c5426634e7929541ec2318f3dcf7e").is_none());
    }
}
