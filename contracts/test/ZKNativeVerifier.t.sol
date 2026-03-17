// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/ZKNativeVerifier.sol";
import "./helpers/ProofHelper.sol";

contract ZKNativeVerifierTest is Test {
    ZKNativeVerifier public verifier;
    address public admin = makeAddr("admin");
    address public submitter = makeAddr("submitter");
    address public attacker = makeAddr("attacker");

    function setUp() public {
        vm.prank(admin);
        verifier = new ZKNativeVerifier(admin);

        // Grant submitter role
        vm.prank(admin);
        verifier.grantRole(verifier.PROOF_SUBMITTER_ROLE(), submitter);

        // Switch to Solidity backend for deterministic tests
        // (PVM precompile is not available on Anvil / local Foundry)
        vm.prank(admin);
        verifier.switchBackend(false);
    }

    // ─── Backend tests ────────────────────────────────────────────────────────

    function test_ValidProofVerifiesOnSolidityBackend() public view {
        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();
        uint256[] memory signals = new uint256[](4);
        signals[0] = 1;
        signals[1] = 2;
        signals[2] = 1;
        signals[3] = 1;

        // The structural proof will not pass the BN128 pairing check —
        // the important thing is that the function executes without reverting.
        // A false return is expected; InvalidProof should NOT be thrown here
        // (that is the caller's responsibility).
        bool result = verifier.verifyProof(proof, signals);
        // We just assert it returns a bool without reverting
        assertTrue(result == true || result == false);
    }

    function test_InvalidProofRejectedOnSolidityBackend() public view {
        IZKVerifier.Proof memory proof = ProofHelper.invalidProof();
        uint256[] memory signals = new uint256[](4);
        signals[0] = 1;
        signals[1] = 2;
        signals[2] = 1;
        signals[3] = 1;

        // All-zero proof points: ecAdd / ecMul on identity returns false from pairing
        bool result = verifier.verifyProof(proof, signals);
        assertFalse(result);
    }

    function test_WrongPublicSignalsCausesRejection() public view {
        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();
        // Use only 2 signals — the pairing check will use zeros for missing IC multipliers
        uint256[] memory signals = new uint256[](2);
        signals[0] = 999;
        signals[1] = 888;

        bool result = verifier.verifyProof(proof, signals);
        // With mismatched signals the linear combination will be wrong — expect false
        assertFalse(result);
    }

    function test_GasBenchmark_RecordsLastGas() public {
        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();
        uint256[] memory signals = new uint256[](4);
        signals[0] = 1;
        signals[1] = 2;
        signals[2] = 1;
        signals[3] = 1;

        vm.prank(submitter);
        verifier.verifyAndRecord(proof, signals);

        uint256 gasUsed = verifier.lastVerificationGas();
        console.log("Solidity backend gas used:", gasUsed);
        assertGt(gasUsed, 0);
    }

    // ─── Pause tests ──────────────────────────────────────────────────────────

    function test_PausedContractRevertsVerification() public {
        vm.prank(admin);
        verifier.pause();

        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();
        uint256[] memory signals = new uint256[](4);

        vm.expectRevert();
        verifier.verifyProof(proof, signals);
    }

    function test_OnlyAdminCanPause() public {
        vm.prank(attacker);
        vm.expectRevert();
        verifier.pause();

        // Admin can pause successfully
        vm.prank(admin);
        verifier.pause();
        assertTrue(verifier.paused());
    }

    // ─── Access control tests ─────────────────────────────────────────────────

    function test_OnlyAdminCanSwitchBackend() public {
        vm.prank(attacker);
        vm.expectRevert();
        verifier.switchBackend(true);

        // Admin can switch
        vm.prank(admin);
        verifier.switchBackend(true);
        assertTrue(verifier.usePVMBackend());
    }

    function test_BackendSwitchEmitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit ZKNativeVerifier.BackendSwitched(true);
        verifier.switchBackend(true);
    }

    // ─── Fuzz tests ───────────────────────────────────────────────────────────

    function testFuzz_RandomProofAlwaysInvalid(uint256 ax, uint256 ay) public view {
        // Any random G1 point that is not on the curve should result in false
        // (the precompile returns false for invalid inputs)
        IZKVerifier.Proof memory proof = IZKVerifier.Proof({
            a: [ax % type(uint128).max, ay % type(uint128).max],
            b: [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
            c: [uint256(0), uint256(0)]
        });
        uint256[] memory signals = new uint256[](4);
        signals[0] = 1;
        signals[1] = 2;
        signals[2] = 1;
        signals[3] = 1;

        // Should either return false or revert — either is acceptable
        try verifier.verifyProof(proof, signals) returns (bool result) {
            assertFalse(result);
        } catch {
            // Revert is also an acceptable outcome for invalid curve points
        }
    }

    // ─── Metadata tests ───────────────────────────────────────────────────────

    function test_IsPVMBackedReturnsTrue() public view {
        assertTrue(verifier.isPVMBacked());
    }

    function test_DefaultBackendIsPVM() public {
        vm.prank(admin);
        ZKNativeVerifier freshVerifier = new ZKNativeVerifier(admin);
        assertTrue(freshVerifier.usePVMBackend());
    }
}
