// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../src/interfaces/IZKVerifier.sol";

/// @notice Test fixtures for ZK proof testing
/// @dev These are structural fixtures for testing contract logic.
///      They will NOT pass cryptographic verification — use them with
///      the Solidity backend to test structural validation only.
library ProofHelper {
    // Valid BN254 G1 generator point
    uint256 constant G1X = 1;
    uint256 constant G1Y = 2;

    // Valid BN254 G2 generator point
    uint256 constant G2X0 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant G2X1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant G2Y0 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant G2Y1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;

    /// @notice A structurally valid proof using BN254 generator points.
    ///         Will NOT pass pairing checks — used to test non-crypto contract logic.
    function validStructuralProof() internal pure returns (IZKVerifier.Proof memory) {
        return IZKVerifier.Proof({
            a: [G1X, G1Y],
            b: [[G2X0, G2X1], [G2Y0, G2Y1]],
            c: [G1X, G1Y]
        });
    }

    /// @notice Generate public signals matching the PrivateVoting layout
    /// @param _merkleRoot The eligibility Merkle root
    /// @param proposalId  The proposal being voted on
    function validPublicSignals(
        bytes32 _merkleRoot,
        uint256 proposalId
    ) internal pure returns (uint256[] memory) {
        uint256[] memory signals = new uint256[](4);
        signals[0] = uint256(_merkleRoot);
        signals[1] = uint256(keccak256(abi.encode("nullifier", proposalId)));
        signals[2] = proposalId;
        signals[3] = 1; // vote For
        return signals;
    }

    /// @notice A proof with all-zero coordinates — will fail pairing checks
    function invalidProof() internal pure returns (IZKVerifier.Proof memory) {
        return IZKVerifier.Proof({
            a: [uint256(0), uint256(0)],
            b: [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
            c: [uint256(0), uint256(0)]
        });
    }

    /// @notice A proof with wrong G2 coordinates (not a valid G2 point)
    function wrongProof() internal pure returns (IZKVerifier.Proof memory) {
        return IZKVerifier.Proof({
            a: [G1X, G1Y],
            b: [[uint256(1), uint256(1)], [uint256(1), uint256(1)]],
            c: [G1X, G1Y]
        });
    }
}
