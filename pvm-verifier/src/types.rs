//! Shared types for proof data, verification keys, and error variants.

use alloc::vec::Vec;
use ark_bn254::{Fq, Fq2, G1Affine, G2Affine};
use ark_ff::{BigInteger, Field, PrimeField, Zero};

// ─── Point types ─────────────────────────────────────────────────────────────

/// A G1 point on the BN254 curve, stored as two big-endian 32-byte field elements.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct G1Point {
    pub x: [u8; 32],
    pub y: [u8; 32],
}

/// A G2 point on the BN254 curve (Fq2 coordinates), stored as four big-endian 32-byte elements.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct G2Point {
    /// x coordinate: [x.c0, x.c1] in Fq2
    pub x: [[u8; 32]; 2],
    /// y coordinate: [y.c0, y.c1] in Fq2
    pub y: [[u8; 32]; 2],
}

// ─── Proof ────────────────────────────────────────────────────────────────────

/// A Groth16 proof consisting of three elliptic-curve points on BN254.
#[derive(Debug, Clone)]
pub struct Proof {
    /// π_A — G1 point
    pub a: G1Point,
    /// π_B — G2 point
    pub b: G2Point,
    /// π_C — G1 point
    pub c: G1Point,
}

// ─── Verification Key ─────────────────────────────────────────────────────────

/// Groth16 verification key for a specific circuit.
#[derive(Debug, Clone)]
pub struct VerificationKey {
    pub alpha1: G1Point,
    pub beta2: G2Point,
    pub gamma2: G2Point,
    pub delta2: G2Point,
    /// IC[0] + IC[1]*s[0] + ... forms the linear combination with public signals.
    pub ic: Vec<G1Point>,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/// Errors that can occur during proof decoding or verification.
#[derive(Debug)]
pub enum VerificationError {
    /// The input buffer is shorter than expected.
    InvalidInputLength,
    /// A byte slice could not be parsed as a valid G1 point.
    InvalidG1Point,
    /// A byte slice could not be parsed as a valid G2 point.
    InvalidG2Point,
    /// A byte slice could not be parsed as a valid scalar field element.
    InvalidScalar,
    /// The pairing check computation failed (arkworks error).
    PairingFailed,
    /// The number of public signals does not match the IC array length.
    InvalidPublicSignalsCount,
    /// The embedded verification-key bytes are malformed.
    InvalidVerificationKey,
}

// ─── Conversions ─────────────────────────────────────────────────────────────

impl G1Point {
    /// Parse big-endian bytes into an arkworks `G1Affine`.
    ///
    /// The BN254 base field prime is ~254 bits so 32-byte big-endian encoding is
    /// unambiguous.  We use `Fq::from_be_bytes_mod_order` which reduces mod `p`.
    pub fn to_ark(&self) -> Result<G1Affine, VerificationError> {
        let x = bytes_to_fq(&self.x)?;
        let y = bytes_to_fq(&self.y)?;

        // Identity element — arkworks represents it with (0, 0) in affine
        if x.is_zero() && y.is_zero() {
            return Ok(G1Affine::identity());
        }

        let point = G1Affine::new_unchecked(x, y);
        if !point.is_on_curve() || !point.is_in_correct_subgroup_assuming_on_curve() {
            return Err(VerificationError::InvalidG1Point);
        }
        Ok(point)
    }

    /// Serialise back to big-endian 32-byte arrays (for testing round-trips).
    pub fn from_ark(p: &G1Affine) -> Self {
        use ark_serialize::CanonicalSerialize;
        let mut x_bytes = [0u8; 32];
        let mut y_bytes = [0u8; 32];
        let x_be = p.x.into_bigint().to_bytes_be();
        let y_be = p.y.into_bigint().to_bytes_be();
        let xlen = x_be.len().min(32);
        let ylen = y_be.len().min(32);
        x_bytes[32 - xlen..].copy_from_slice(&x_be[..xlen]);
        y_bytes[32 - ylen..].copy_from_slice(&y_be[..ylen]);
        G1Point { x: x_bytes, y: y_bytes }
    }
}

impl G2Point {
    /// Parse big-endian bytes into an arkworks `G2Affine`.
    ///
    /// Solidity / snarkjs G2 encoding convention:
    ///   b[0][0] = x.c0  (least significant coefficient of x ∈ Fq2)
    ///   b[0][1] = x.c1
    ///   b[1][0] = y.c0
    ///   b[1][1] = y.c1
    pub fn to_ark(&self) -> Result<G2Affine, VerificationError> {
        let x_c0 = bytes_to_fq(&self.x[0])?;
        let x_c1 = bytes_to_fq(&self.x[1])?;
        let y_c0 = bytes_to_fq(&self.y[0])?;
        let y_c1 = bytes_to_fq(&self.y[1])?;

        let x = Fq2::new(x_c0, x_c1);
        let y = Fq2::new(y_c0, y_c1);

        if x.is_zero() && y.is_zero() {
            return Ok(G2Affine::identity());
        }

        let point = G2Affine::new_unchecked(x, y);
        if !point.is_on_curve() || !point.is_in_correct_subgroup_assuming_on_curve() {
            return Err(VerificationError::InvalidG2Point);
        }
        Ok(point)
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Parse 32 big-endian bytes into an `Fq` field element.
pub fn bytes_to_fq(bytes: &[u8; 32]) -> Result<Fq, VerificationError> {
    Ok(Fq::from_be_bytes_mod_order(bytes))
}

/// Parse 32 big-endian bytes into an `Fr` scalar field element.
pub fn bytes_to_fr(bytes: &[u8; 32]) -> Result<ark_bn254::Fr, VerificationError> {
    use ark_bn254::Fr;
    Ok(Fr::from_be_bytes_mod_order(bytes))
}

/// Read a 32-byte chunk from `data` at `offset`.
pub fn read32(data: &[u8], offset: usize) -> Result<[u8; 32], VerificationError> {
    if offset + 32 > data.len() {
        return Err(VerificationError::InvalidInputLength);
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&data[offset..offset + 32]);
    Ok(out)
}
