// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IZKVerifier
/// @notice Interface for ZK proof verification — backed by a native Rust verifier via PVM FFI
interface IZKVerifier {
    /// @notice A Groth16 proof consisting of three elliptic-curve points on BN254
    struct Proof {
        /// @dev π_A — a G1 point
        uint256[2] a;
        /// @dev π_B — a G2 point (coordinates in Fq2)
        uint256[2][2] b;
        /// @dev π_C — a G1 point
        uint256[2] c;
    }

    /// @notice Groth16 verification key used to verify proofs for a specific circuit
    struct VerificationKey {
        /// @dev α₁ — G1 point
        uint256[2] alpha1;
        /// @dev β₂ — G2 point
        uint256[2][2] beta2;
        /// @dev γ₂ — G2 point
        uint256[2][2] gamma2;
        /// @dev δ₂ — G2 point
        uint256[2][2] delta2;
        /// @dev IC — array of G1 points for linear combination with public signals
        uint256[2][] ic;
    }

    /// @notice Verify a Groth16 proof against the embedded verification key
    /// @param proof The Groth16 proof (a, b, c points)
    /// @param publicSignals The public inputs/outputs of the ZK circuit
    /// @return valid True if the proof is cryptographically valid
    function verifyProof(
        Proof calldata proof,
        uint256[] calldata publicSignals
    ) external view returns (bool valid);

    /// @notice Returns the gas consumed by the last call to verifyProof
    /// @return The gas units used in the most recent verification
    function lastVerificationGas() external view returns (uint256);

    /// @notice Whether this verifier is backed by a native PVM Rust library
    /// @return True when running on PolkaVM with native Rust backend
    function isPVMBacked() external pure returns (bool);
}
