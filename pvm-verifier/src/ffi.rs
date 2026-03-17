//! PVM FFI entry point — ABI-decode Solidity calldata, verify, ABI-encode result.
//!
//! Solidity call site:
//! ```solidity
//! bytes memory encoded = abi.encode(proof.a, proof.b, proof.c, publicSignals);
//! (bool ok, bytes memory result) = PVM_GROTH16_PRECOMPILE.staticcall(encoded);
//! bool valid = abi.decode(result, (bool));
//! ```
//!
//! ABI layout (all values big-endian 32-byte words):
//! ```text
//! [0x000] proof.a[0]                          (G1 x)
//! [0x020] proof.a[1]                          (G1 y)
//! [0x040] proof.b[0][0]                       (G2 x.c0)
//! [0x060] proof.b[0][1]                       (G2 x.c1)
//! [0x080] proof.b[1][0]                       (G2 y.c0)
//! [0x0a0] proof.b[1][1]                       (G2 y.c1)
//! [0x0c0] proof.c[0]                          (G1 x)
//! [0x0e0] proof.c[1]                          (G1 y)
//! [0x100] offset of publicSignals array       (= 0x120 typically)
//! [0x120] length of publicSignals
//! [0x140] publicSignals[0]
//! ...
//! ```

use alloc::vec::Vec;

use crate::types::{read32, G1Point, G2Point, Proof, VerificationError, VerificationKey};
use crate::verifier::verify_groth16_proof;

/// Embedded verification key (generated from trusted setup ceremony).
/// Replace the placeholder binary with the output of `snarkjs zkey export verificationkey`
/// piped through the `export-vk-bin` tool in `scripts/`.
static VOTING_VK: &[u8] = include_bytes!("../keys/voting_vk_placeholder.bin");

// ─── Entry point ─────────────────────────────────────────────────────────────

/// Called by the PolkaVM runtime on each `staticcall` to the precompile address.
///
/// # Safety
/// The host guarantees that the pointed-to memory regions are valid for their
/// respective sizes.
pub unsafe fn handle_pvm_call(
    input_ptr: *const u8,
    input_len: usize,
    output_ptr: *mut u8,
) -> usize {
    let input = core::slice::from_raw_parts(input_ptr, input_len);

    let result = decode_and_verify(input).unwrap_or(false);

    let output = encode_bool(result);
    core::ptr::copy_nonoverlapping(output.as_ptr(), output_ptr, 32);
    32
}

// ─── Decoding ─────────────────────────────────────────────────────────────────

fn decode_and_verify(input: &[u8]) -> Result<bool, VerificationError> {
    // Minimum: 8 static words (proof) + 1 offset word + 1 length word = 10 × 32 = 320 bytes
    if input.len() < 320 {
        return Err(VerificationError::InvalidInputLength);
    }

    let proof = decode_proof(input)?;
    let signals = decode_signals(input)?;
    let vk = decode_vk(VOTING_VK)?;

    verify_groth16_proof(&proof, &signals, &vk)
}

fn decode_proof(input: &[u8]) -> Result<Proof, VerificationError> {
    Ok(Proof {
        a: G1Point {
            x: read32(input, 0x000)?,
            y: read32(input, 0x020)?,
        },
        b: G2Point {
            x: [read32(input, 0x040)?, read32(input, 0x060)?],
            y: [read32(input, 0x080)?, read32(input, 0x0a0)?],
        },
        c: G1Point {
            x: read32(input, 0x0c0)?,
            y: read32(input, 0x0e0)?,
        },
    })
}

fn decode_signals(input: &[u8]) -> Result<Vec<[u8; 32]>, VerificationError> {
    // The 9th word (offset 0x100) is an ABI offset pointing to the array.
    let offset_word = read32(input, 0x100)?;
    // The offset is a uint256 but will never exceed usize on real hardware
    let offset = u64::from_be_bytes(offset_word[24..32].try_into().unwrap()) as usize;

    if offset + 32 > input.len() {
        return Err(VerificationError::InvalidInputLength);
    }

    let len_word = read32(input, offset)?;
    let len = u64::from_be_bytes(len_word[24..32].try_into().unwrap()) as usize;

    let data_start = offset + 32;
    if data_start + len * 32 > input.len() {
        return Err(VerificationError::InvalidInputLength);
    }

    let mut signals = Vec::with_capacity(len);
    for i in 0..len {
        signals.push(read32(input, data_start + i * 32)?);
    }
    Ok(signals)
}

/// Deserialise the verification key from our compact binary format.
///
/// Binary layout (all fields contiguous, big-endian 32-byte words):
/// ```text
/// [32] num_ic (uint256 little-endian length prefix)
/// [64] alpha1 (G1: x, y)
/// [128] beta2 (G2: x.c0, x.c1, y.c0, y.c1)
/// [128] gamma2
/// [128] delta2
/// [64 * num_ic] ic[0], ic[1], ...
/// ```
fn decode_vk(data: &[u8]) -> Result<VerificationKey, VerificationError> {
    if data.len() < 32 {
        return Err(VerificationError::InvalidVerificationKey);
    }

    let num_ic_word = read32(data, 0)?;
    let num_ic = u64::from_be_bytes(num_ic_word[24..32].try_into().unwrap()) as usize;

    let required = 32 + 64 + 128 + 128 + 128 + num_ic * 64;
    if data.len() < required {
        return Err(VerificationError::InvalidVerificationKey);
    }

    let mut offset = 32;

    let alpha1 = G1Point {
        x: read32(data, offset)?,
        y: read32(data, offset + 32)?,
    };
    offset += 64;

    let beta2 = G2Point {
        x: [read32(data, offset)?, read32(data, offset + 32)?],
        y: [read32(data, offset + 64)?, read32(data, offset + 96)?],
    };
    offset += 128;

    let gamma2 = G2Point {
        x: [read32(data, offset)?, read32(data, offset + 32)?],
        y: [read32(data, offset + 64)?, read32(data, offset + 96)?],
    };
    offset += 128;

    let delta2 = G2Point {
        x: [read32(data, offset)?, read32(data, offset + 32)?],
        y: [read32(data, offset + 64)?, read32(data, offset + 96)?],
    };
    offset += 128;

    let mut ic = Vec::with_capacity(num_ic);
    for _ in 0..num_ic {
        ic.push(G1Point {
            x: read32(data, offset)?,
            y: read32(data, offset + 32)?,
        });
        offset += 64;
    }

    Ok(VerificationKey {
        alpha1,
        beta2,
        gamma2,
        delta2,
        ic,
    })
}

// ─── Encoding ─────────────────────────────────────────────────────────────────

fn encode_bool(value: bool) -> [u8; 32] {
    let mut out = [0u8; 32];
    if value {
        out[31] = 1;
    }
    out
}
