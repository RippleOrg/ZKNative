//! Groth16 proof verification on BN254 using arkworks.

use alloc::vec::Vec;
use ark_bn254::{Bn254, Fr};
use ark_groth16::{Groth16, Proof as ArkProof, VerifyingKey};
use ark_snark::SNARK;

use crate::types::{bytes_to_fr, Proof, VerificationError, VerificationKey};

/// Verify a Groth16 proof against `vk` with the supplied `public_signals`.
///
/// # Arguments
/// * `proof`          — the (π_A, π_B, π_C) Groth16 proof.
/// * `public_signals` — slice of 32-byte big-endian scalars (one per public input).
/// * `vk`             — the circuit's verification key.
///
/// # Returns
/// * `Ok(true)`  — proof is valid.
/// * `Ok(false)` — proof is invalid (pairing check failed).
/// * `Err(_)`    — input decoding error; the caller should treat this as `false`.
pub fn verify_groth16_proof(
    proof: &Proof,
    public_signals: &[[u8; 32]],
    vk: &VerificationKey,
) -> Result<bool, VerificationError> {
    // 1. Convert proof points to arkworks types
    let ark_proof = ArkProof::<Bn254> {
        a: proof.a.to_ark()?,
        b: proof.b.to_ark()?,
        c: proof.c.to_ark()?,
    };

    // 2. Parse public inputs as Fr field elements
    let public_inputs: Result<Vec<Fr>, _> =
        public_signals.iter().map(bytes_to_fr).collect();
    let public_inputs = public_inputs.map_err(|_| VerificationError::InvalidScalar)?;

    // 3. Build the arkworks VerifyingKey
    let ark_vk = build_ark_vk(vk)?;
    let pvk = ark_groth16::prepare_verifying_key(&ark_vk);

    // 4. Verify
    let result = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &public_inputs, &ark_proof)
        .map_err(|_| VerificationError::PairingFailed)?;

    Ok(result)
}

/// Convert our `VerificationKey` to an arkworks `VerifyingKey<Bn254>`.
fn build_ark_vk(vk: &VerificationKey) -> Result<VerifyingKey<Bn254>, VerificationError> {
    use ark_bn254::G1Projective;
    use ark_ec::CurveGroup;

    let alpha_g1 = vk.alpha1.to_ark()?;
    let beta_g2 = vk.beta2.to_ark()?;
    let gamma_g2 = vk.gamma2.to_ark()?;
    let delta_g2 = vk.delta2.to_ark()?;

    let gamma_abc_g1: Result<Vec<_>, _> = vk.ic.iter().map(|p| p.to_ark()).collect();
    let gamma_abc_g1 = gamma_abc_g1?;

    Ok(VerifyingKey::<Bn254> {
        alpha_g1,
        beta_g2,
        gamma_g2,
        delta_g2,
        gamma_abc_g1,
    })
}
