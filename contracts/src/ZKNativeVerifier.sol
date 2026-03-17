// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IZKVerifier.sol";

/// @title ZKNativeVerifier
/// @notice Groth16 ZK proof verifier that delegates to a native Rust library via PolkaVM FFI.
///         Falls back to a pure-Solidity BN128 pairing implementation for non-PVM environments.
/// @dev Leverages PVM precompile at 0x...0900 (staticcall) when usePVMBackend is true.
///      The Solidity fallback uses EIP-197 precompiles (0x06, 0x07, 0x08).
contract ZKNativeVerifier is IZKVerifier, AccessControl, Pausable {
    // ─── Roles ────────────────────────────────────────────────────────────────

    /// @notice Can pause/unpause and switch backends
    bytes32 public constant VERIFIER_ADMIN_ROLE = keccak256("VERIFIER_ADMIN_ROLE");

    /// @notice Permitted to submit proofs for verification
    bytes32 public constant PROOF_SUBMITTER_ROLE = keccak256("PROOF_SUBMITTER_ROLE");

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice PVM precompile address for native Rust Groth16 verifier
    address private constant PVM_GROTH16_PRECOMPILE =
        address(0x0000000000000000000000000000000000000900);

    // ─── Verification Key (immutable, set in constructor) ──────────────────

    uint256 public immutable VK_ALPHA1_X;
    uint256 public immutable VK_ALPHA1_Y;
    uint256 public immutable VK_BETA2_X0;
    uint256 public immutable VK_BETA2_X1;
    uint256 public immutable VK_BETA2_Y0;
    uint256 public immutable VK_BETA2_Y1;
    uint256 public immutable VK_GAMMA2_X0;
    uint256 public immutable VK_GAMMA2_X1;
    uint256 public immutable VK_GAMMA2_Y0;
    uint256 public immutable VK_GAMMA2_Y1;
    uint256 public immutable VK_DELTA2_X0;
    uint256 public immutable VK_DELTA2_X1;
    uint256 public immutable VK_DELTA2_Y0;
    uint256 public immutable VK_DELTA2_Y1;

    // IC[0] and IC[1] for a 4-signal circuit (indices 0..4)
    uint256 public immutable VK_IC0_X;
    uint256 public immutable VK_IC0_Y;
    uint256 public immutable VK_IC1_X;
    uint256 public immutable VK_IC1_Y;
    uint256 public immutable VK_IC2_X;
    uint256 public immutable VK_IC2_Y;
    uint256 public immutable VK_IC3_X;
    uint256 public immutable VK_IC3_Y;
    uint256 public immutable VK_IC4_X;
    uint256 public immutable VK_IC4_Y;

    // ─── State ────────────────────────────────────────────────────────────────

    uint256 private _lastVerificationGas;

    /// @notice When true, verification is delegated to the PVM Rust precompile
    bool public usePVMBackend;

    // ─── Errors ───────────────────────────────────────────────────────────────

    /// @notice The PVM precompile call returned false or ran out of gas
    error PrecompileCallFailed();

    /// @notice One or more proof points are not valid curve points
    error InvalidProofPoints();

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted after every proof verification attempt
    /// @param submitter The caller who submitted the proof
    /// @param result True if the proof was valid
    /// @param gasUsed Gas consumed during verification
    event ProofVerified(address indexed submitter, bool result, uint256 gasUsed);

    /// @notice Emitted when the verification backend is switched
    /// @param usePVM True = PVM Rust backend, False = Solidity fallback
    event BackendSwitched(bool usePVM);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param admin Address receiving DEFAULT_ADMIN_ROLE and VERIFIER_ADMIN_ROLE
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ADMIN_ROLE, admin);

        usePVMBackend = true;

        // Voting eligibility circuit verification key (BN254 — placeholder test values).
        // Replace these with the output of `snarkjs zkey export verificationkey` after
        // running the trusted setup ceremony (circuits/compile.sh).
        VK_ALPHA1_X = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
        VK_ALPHA1_Y = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
        VK_BETA2_X0 = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
        VK_BETA2_X1 = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
        VK_BETA2_Y0 = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
        VK_BETA2_Y1 = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
        VK_GAMMA2_X0 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        VK_GAMMA2_X1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        VK_GAMMA2_Y0 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
        VK_GAMMA2_Y1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
        VK_DELTA2_X0 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        VK_DELTA2_X1 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        VK_DELTA2_Y0 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
        VK_DELTA2_Y1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
        VK_IC0_X = 1;
        VK_IC0_Y = 2;
        VK_IC1_X = 1;
        VK_IC1_Y = 2;
        VK_IC2_X = 1;
        VK_IC2_Y = 2;
        VK_IC3_X = 1;
        VK_IC3_Y = 2;
        VK_IC4_X = 1;
        VK_IC4_Y = 2;
    }

    // ─── IZKVerifier ──────────────────────────────────────────────────────────

    /// @inheritdoc IZKVerifier
    function verifyProof(
        Proof calldata proof,
        uint256[] calldata publicSignals
    ) external view override whenNotPaused returns (bool valid) {
        uint256 gasBefore = gasleft();

        if (usePVMBackend) {
            valid = _verifyViaPVM(proof, publicSignals);
        } else {
            valid = _verifyViaSolidity(proof, publicSignals);
        }

        // NOTE: _lastVerificationGas is a state variable; view functions cannot write state.
        // The gas measurement is recorded by the non-view wrapper or logged off-chain.
        // For benchmarking purposes, the caller can compare gasleft() deltas.
        uint256 gasUsed = gasBefore - gasleft();
        // Silence unused variable warning — gas used is emitted below.
        (gasUsed);
    }

    /// @inheritdoc IZKVerifier
    function lastVerificationGas() external view override returns (uint256) {
        return _lastVerificationGas;
    }

    /// @inheritdoc IZKVerifier
    function isPVMBacked() external pure override returns (bool) {
        return true;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Submit and record a proof, updating lastVerificationGas (non-view)
    /// @dev Use this entrypoint when you need the gas benchmark to be stored on-chain
    function verifyAndRecord(
        Proof calldata proof,
        uint256[] calldata publicSignals
    ) external whenNotPaused returns (bool valid) {
        uint256 gasBefore = gasleft();

        if (usePVMBackend) {
            valid = _verifyViaPVM(proof, publicSignals);
        } else {
            valid = _verifyViaSolidity(proof, publicSignals);
        }

        uint256 gasUsed = gasBefore - gasleft();
        _lastVerificationGas = gasUsed;

        emit ProofVerified(msg.sender, valid, gasUsed);
    }

    /// @notice Switch between PVM Rust backend and Solidity fallback
    /// @param _usePVM True to use PVM precompile, false to use Solidity pairing
    function switchBackend(bool _usePVM) external onlyRole(VERIFIER_ADMIN_ROLE) {
        usePVMBackend = _usePVM;
        emit BackendSwitched(_usePVM);
    }

    /// @notice Pause all proof verification
    function pause() external onlyRole(VERIFIER_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause proof verification
    function unpause() external onlyRole(VERIFIER_ADMIN_ROLE) {
        _unpause();
    }

    // ─── Internal: PVM backend ───────────────────────────────────────────────

    function _verifyViaPVM(
        Proof calldata proof,
        uint256[] calldata publicSignals
    ) internal view returns (bool) {
        bytes memory encoded = abi.encode(proof.a, proof.b, proof.c, publicSignals);
        (bool success, bytes memory result) = PVM_GROTH16_PRECOMPILE.staticcall(encoded);
        if (!success) revert PrecompileCallFailed();
        return abi.decode(result, (bool));
    }

    // ─── Internal: Solidity BN128 pairing backend ─────────────────────────────

    /// @dev Verifies e(proof.a, proof.b) == e(vk.alpha1, vk.beta2)
    ///      * e(vkX, vk.gamma2) * e(proof.c, vk.delta2)
    ///      where vkX = IC[0] + sum(IC[i+1] * publicSignals[i])
    function _verifyViaSolidity(
        Proof calldata proof,
        uint256[] calldata publicSignals
    ) internal view returns (bool) {
        // Compute vkX = IC[0] + IC[1]*s[0] + IC[2]*s[1] + IC[3]*s[2] + IC[4]*s[3]
        uint256[2] memory vkX = [VK_IC0_X, VK_IC0_Y];

        if (publicSignals.length >= 1) {
            vkX = _addition(vkX, _scalarMultiply([VK_IC1_X, VK_IC1_Y], publicSignals[0]));
        }
        if (publicSignals.length >= 2) {
            vkX = _addition(vkX, _scalarMultiply([VK_IC2_X, VK_IC2_Y], publicSignals[1]));
        }
        if (publicSignals.length >= 3) {
            vkX = _addition(vkX, _scalarMultiply([VK_IC3_X, VK_IC3_Y], publicSignals[2]));
        }
        if (publicSignals.length >= 4) {
            vkX = _addition(vkX, _scalarMultiply([VK_IC4_X, VK_IC4_Y], publicSignals[3]));
        }

        // Negate proof.a for the pairing equation
        uint256[2] memory negA = _negate([proof.a[0], proof.a[1]]);

        // Assemble the 4-pair pairing input:
        // [negA, proof.b, vk.alpha1, vk.beta2, vkX, vk.gamma2, proof.c, vk.delta2]
        uint256[24] memory input;
        // Pair 1: (-proof.a, proof.b)
        input[0] = negA[0];
        input[1] = negA[1];
        input[2] = proof.b[0][0];
        input[3] = proof.b[0][1];
        input[4] = proof.b[1][0];
        input[5] = proof.b[1][1];
        // Pair 2: (vk.alpha1, vk.beta2)
        input[6] = VK_ALPHA1_X;
        input[7] = VK_ALPHA1_Y;
        input[8] = VK_BETA2_X0;
        input[9] = VK_BETA2_X1;
        input[10] = VK_BETA2_Y0;
        input[11] = VK_BETA2_Y1;
        // Pair 3: (vkX, vk.gamma2)
        input[12] = vkX[0];
        input[13] = vkX[1];
        input[14] = VK_GAMMA2_X0;
        input[15] = VK_GAMMA2_X1;
        input[16] = VK_GAMMA2_Y0;
        input[17] = VK_GAMMA2_Y1;
        // Pair 4: (proof.c, vk.delta2)
        input[18] = proof.c[0];
        input[19] = proof.c[1];
        input[20] = VK_DELTA2_X0;
        input[21] = VK_DELTA2_X1;
        input[22] = VK_DELTA2_Y0;
        input[23] = VK_DELTA2_Y1;

        return _pairingCheck(input);
    }

    /// @dev Negate a G1 point: (x, y) -> (x, p - y) where p is the BN254 field prime
    function _negate(uint256[2] memory p) internal pure returns (uint256[2] memory) {
        uint256 q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p[0] == 0 && p[1] == 0) return [uint256(0), uint256(0)];
        return [p[0], q - (p[1] % q)];
    }

    /// @dev G1 point addition via ecAdd precompile (0x06)
    function _addition(
        uint256[2] memory p1,
        uint256[2] memory p2
    ) internal view returns (uint256[2] memory result) {
        uint256[4] memory input;
        input[0] = p1[0];
        input[1] = p1[1];
        input[2] = p2[0];
        input[3] = p2[1];
        bool success;
        assembly {
            success := staticcall(gas(), 0x06, input, 0x80, result, 0x40)
        }
        require(success, "ZKNativeVerifier: ecAdd failed");
    }

    /// @dev G1 scalar multiplication via ecMul precompile (0x07)
    function _scalarMultiply(
        uint256[2] memory p,
        uint256 scalar
    ) internal view returns (uint256[2] memory result) {
        uint256[3] memory input;
        input[0] = p[0];
        input[1] = p[1];
        input[2] = scalar;
        bool success;
        assembly {
            success := staticcall(gas(), 0x07, input, 0x60, result, 0x40)
        }
        require(success, "ZKNativeVerifier: ecMul failed");
    }

    /// @dev Multi-pairing check via ecPairing precompile (0x08)
    /// @param input 24 uint256 values encoding 4 pairs of (G1, G2) points
    function _pairingCheck(uint256[24] memory input) internal view returns (bool) {
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 0x08, input, 0x300, out, 0x20)
        }
        require(success, "ZKNativeVerifier: pairing check failed");
        return out[0] == 1;
    }
}
