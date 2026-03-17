//! ZKNative PVM Verifier
//!
//! Groth16 ZK proof verifier using arkworks, compiled to PolkaVM.
//! Called from Solidity via PVM FFI (staticcall to precompile address 0x900).
//!
//! On `pvm` feature the crate is built as `no_std` and exposes a single
//! C-ABI entry point `pvm_verify` that the PolkaVM runtime will call when
//! Solidity hits the precompile address.

#![cfg_attr(feature = "pvm", no_std)]

extern crate alloc;

pub mod ffi;
pub mod types;
pub mod verifier;

pub use types::{G1Point, G2Point, Proof, VerificationError, VerificationKey};
pub use verifier::verify_groth16_proof;

/// PVM FFI entry point.
///
/// Called by the PolkaVM runtime when Solidity performs a `staticcall` to the
/// Groth16 precompile address (0x...0900).  The ABI encoding follows the
/// Solidity `abi.encode(proof.a, proof.b, proof.c, publicSignals)` layout.
///
/// # Safety
/// The caller (PolkaVM host) guarantees that `input_ptr..input_ptr+input_len`
/// is a valid, readable memory range and that `output_ptr` points to a buffer
/// of at least 32 bytes.
#[cfg(feature = "pvm")]
#[no_mangle]
pub unsafe extern "C" fn pvm_verify(
    input_ptr: *const u8,
    input_len: usize,
    output_ptr: *mut u8,
) -> usize {
    ffi::handle_pvm_call(input_ptr, input_len, output_ptr)
}
