// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/PrivateVoting.sol";
import "../src/ZKNativeVerifier.sol";
import "./helpers/ProofHelper.sol";

contract PrivateVotingTest is Test {
    ZKNativeVerifier public verifierContract;
    PrivateVoting public voting;

    address public admin = makeAddr("admin");
    address public creator = makeAddr("creator");
    address public voter1 = makeAddr("voter1");
    address public attacker = makeAddr("attacker");

    bytes32 public constant MERKLE_ROOT = keccak256("test-merkle-root");

    function setUp() public {
        // Deploy verifier
        vm.startPrank(admin);
        verifierContract = new ZKNativeVerifier(admin);
        verifierContract.switchBackend(false); // Solidity backend for tests

        // Deploy voting contract
        voting = new PrivateVoting(address(verifierContract), admin, MERKLE_ROOT);

        // Grant PrivateVoting permission to submit proofs through the verifier
        verifierContract.grantRole(verifierContract.PROOF_SUBMITTER_ROLE(), address(voting));

        // Grant creator the proposal creator role
        voting.grantRole(voting.PROPOSAL_CREATOR_ROLE(), creator);
        vm.stopPrank();
    }

    // ─── Proposal creation ────────────────────────────────────────────────────

    function test_CreateProposal() public {
        vm.prank(creator);
        uint256 id = voting.createProposal(
            "Test Proposal",
            "A test proposal",
            block.timestamp,
            block.timestamp + 7 days
        );

        assertEq(id, 1);
        IPrivateVoting.Proposal memory p = voting.getProposal(1);
        assertEq(p.title, "Test Proposal");
        assertEq(p.votesFor, 0);
        assertFalse(p.finalized);
    }

    function test_UnauthorizedCannotCreateProposal() public {
        vm.prank(attacker);
        vm.expectRevert();
        voting.createProposal("Evil", "Evil proposal", block.timestamp, block.timestamp + 1 days);
    }

    // ─── Voting ───────────────────────────────────────────────────────────────

    function test_CastVoteRevertsWithInvalidProof() public {
        vm.prank(creator);
        voting.createProposal("Prop 1", "desc", block.timestamp, block.timestamp + 7 days);

        uint256[] memory signals = ProofHelper.validPublicSignals(MERKLE_ROOT, 1);
        IZKVerifier.Proof memory proof = ProofHelper.invalidProof();

        vm.prank(voter1);
        vm.expectRevert(IPrivateVoting.InvalidProof.selector);
        voting.castVote(1, proof, signals);
    }

    function test_CastVoteRevertsForNonExistentProposal() public {
        uint256[] memory signals = ProofHelper.validPublicSignals(MERKLE_ROOT, 999);
        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();

        vm.prank(voter1);
        vm.expectRevert(IPrivateVoting.ProposalNotFound.selector);
        voting.castVote(999, proof, signals);
    }

    function test_CastVoteRevertsWhenNotActive() public {
        vm.prank(creator);
        voting.createProposal(
            "Future Prop",
            "desc",
            block.timestamp + 1 days,
            block.timestamp + 7 days
        );

        uint256[] memory signals = ProofHelper.validPublicSignals(MERKLE_ROOT, 1);
        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();

        vm.prank(voter1);
        vm.expectRevert(IPrivateVoting.ProposalNotActive.selector);
        voting.castVote(1, proof, signals);
    }

    function test_CastVoteRevertsOnInvalidVoteChoice() public {
        vm.prank(creator);
        voting.createProposal("Prop", "desc", block.timestamp, block.timestamp + 7 days);

        uint256[] memory signals = new uint256[](4);
        signals[0] = uint256(MERKLE_ROOT);
        signals[1] = uint256(keccak256("nullifier"));
        signals[2] = 1;
        signals[3] = 5; // Invalid — must be 0, 1, or 2

        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();

        vm.prank(voter1);
        vm.expectRevert(IPrivateVoting.InvalidVoteChoice.selector);
        voting.castVote(1, proof, signals);
    }

    function test_CastVoteRevertsOnMerkleRootMismatch() public {
        vm.prank(creator);
        voting.createProposal("Prop", "desc", block.timestamp, block.timestamp + 7 days);

        uint256[] memory signals = new uint256[](4);
        signals[0] = uint256(keccak256("wrong-root")); // Wrong root
        signals[1] = uint256(keccak256("nullifier"));
        signals[2] = 1;
        signals[3] = 1;

        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();

        vm.prank(voter1);
        vm.expectRevert("PrivateVoting: merkle root mismatch");
        voting.castVote(1, proof, signals);
    }

    // ─── Finalization ─────────────────────────────────────────────────────────

    function test_FinalizeProposal() public {
        vm.prank(creator);
        voting.createProposal("Prop", "desc", block.timestamp, block.timestamp + 1 days);

        vm.warp(block.timestamp + 2 days);

        voting.finalizeProposal(1);

        IPrivateVoting.Proposal memory p = voting.getProposal(1);
        assertTrue(p.finalized);
        assertFalse(p.passed); // 0 votes for, 0 against — not passed
    }

    function test_FinalizeBeforeEndTimeReverts() public {
        vm.prank(creator);
        voting.createProposal("Prop", "desc", block.timestamp, block.timestamp + 7 days);

        vm.expectRevert("PrivateVoting: voting still active");
        voting.finalizeProposal(1);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function test_UpdateMerkleRoot() public {
        bytes32 newRoot = keccak256("new-root");
        vm.prank(admin);
        voting.updateMerkleRoot(newRoot);
        assertEq(voting.merkleRoot(), newRoot);
    }

    function test_UnauthorizedCannotUpdateMerkleRoot() public {
        vm.prank(attacker);
        vm.expectRevert();
        voting.updateMerkleRoot(keccak256("attack"));
    }

    function test_PauseStopsVoting() public {
        vm.prank(admin);
        voting.pause();

        vm.prank(creator);
        vm.expectRevert();
        voting.createProposal("Prop", "desc", block.timestamp, block.timestamp + 7 days);
    }
}
