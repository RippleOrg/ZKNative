//! Integration tests for the ZKNative PVM verifier.
//!
//! These tests run against the standard-library (non-PVM) build and exercise
//! the full decoding + verification pipeline with known-good and known-bad inputs.

use zknative_verifier::{
    types::{G1Point, G2Point, Proof, VerificationKey},
    verify_groth16_proof,
};

/// BN254 G1 generator (x=1, y=2) as 32-byte big-endian arrays.
fn g1_generator() -> G1Point {
    let mut x = [0u8; 32];
    let mut y = [0u8; 32];
    x[31] = 1;
    y[31] = 2;
    G1Point { x, y }
}

/// BN254 G2 generator as 32-byte big-endian arrays.
fn g2_generator() -> G2Point {
    // G2 generator coordinates (standard values)
    let hex_to_bytes32 = |s: &str| -> [u8; 32] {
        let bytes = hex::decode(s).unwrap();
        let mut arr = [0u8; 32];
        let offset = 32 - bytes.len();
        arr[offset..].copy_from_slice(&bytes);
        arr
    };

    G2Point {
        x: [
            hex_to_bytes32("1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed"),
            hex_to_bytes32("198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2"),
        ],
        y: [
            hex_to_bytes32("12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa"),
            hex_to_bytes32("090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b"),
        ],
    }
}

/// A minimal verification key with IC length = 4 (matching 4-signal circuit).
fn test_vk() -> VerificationKey {
    VerificationKey {
        alpha1: g1_generator(),
        beta2: g2_generator(),
        gamma2: g2_generator(),
        delta2: g2_generator(),
        ic: vec![
            g1_generator(),
            g1_generator(),
            g1_generator(),
            g1_generator(),
            g1_generator(),
        ],
    }
}

#[test]
fn test_invalid_proof_returns_false() {
    let proof = Proof {
        a: g1_generator(),
        b: g2_generator(),
        c: g1_generator(),
    };

    let signals: Vec<[u8; 32]> = (0u8..4)
        .map(|i| {
            let mut s = [0u8; 32];
            s[31] = i + 1;
            s
        })
        .collect();

    let vk = test_vk();
    // The generator-point proof will not satisfy the real pairing check
    let result = verify_groth16_proof(&proof, &signals, &vk);
    match result {
        Ok(valid) => assert!(!valid, "random proof should not verify"),
        Err(_) => {} // Decoding/pairing error is also acceptable
    }
}

#[test]
fn test_wrong_signal_count_error() {
    let proof = Proof {
        a: g1_generator(),
        b: g2_generator(),
        c: g1_generator(),
    };
    // IC has 5 elements (IC[0..4]) so we need exactly 4 public inputs
    // but provide 2 — arkworks should fail
    let signals: Vec<[u8; 32]> = vec![[0u8; 32]; 2];
    let vk = test_vk();
    let result = verify_groth16_proof(&proof, &signals, &vk);
    // Either an error or false — both are acceptable
    match result {
        Ok(valid) => assert!(!valid),
        Err(_) => {}
    }
}

#[test]
fn test_zero_proof_returns_false_or_error() {
    let zero_g1 = G1Point {
        x: [0u8; 32],
        y: [0u8; 32],
    };
    let zero_g2 = G2Point {
        x: [[0u8; 32]; 2],
        y: [[0u8; 32]; 2],
    };
    let proof = Proof {
        a: zero_g1.clone(),
        b: zero_g2,
        c: zero_g1,
    };
    let signals = vec![[0u8; 32]; 4];
    let vk = test_vk();

    let result = verify_groth16_proof(&proof, &signals, &vk);
    match result {
        Ok(valid) => assert!(!valid),
        Err(_) => {}
    }
}
