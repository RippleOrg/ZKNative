// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IZKVerifier.sol";
import "./interfaces/IPrivateVoting.sol";

/// @title PrivateVoting
/// @notice Private on-chain voting using ZK proofs (Groth16 on BN254) for voter eligibility.
///         Voters prove they belong to an on-chain Merkle tree without revealing their identity.
///         Each voter's nullifier (derived from a secret) prevents double-voting.
/// @dev Uses ZKNativeVerifier (or any IZKVerifier implementation) for proof verification.
///      Public signals layout:
///        [0] merkleRoot  — must match the contract's stored root
///        [1] nullifier   — unique per voter per proposal; encoded as uint256
///        [2] proposalId  — must match the proposalId argument
///        [3] voteChoice  — 0 = against, 1 = for, 2 = abstain
contract PrivateVoting is IPrivateVoting, AccessControl, Pausable, ReentrancyGuard {
    // ─── Roles ────────────────────────────────────────────────────────────────

    /// @notice Can create proposals
    bytes32 public constant PROPOSAL_CREATOR_ROLE = keccak256("PROPOSAL_CREATOR_ROLE");

    /// @notice Can pause/unpause and update the Merkle root
    bytes32 public constant VOTING_ADMIN_ROLE = keccak256("VOTING_ADMIN_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice The ZK verifier contract (ZKNativeVerifier on PVM)
    IZKVerifier public immutable verifier;

    /// @notice Root of the voter-eligibility Merkle tree
    bytes32 public merkleRoot;

    /// @notice All proposals by ID (IDs start at 1)
    mapping(uint256 => Proposal) public proposals;

    /// @notice Nullifier registry per proposal — prevents double-voting
    mapping(uint256 => mapping(bytes32 => bool)) public nullifiers;

    /// @notice Total number of proposals created
    uint256 public proposalCount;

    // ─── Constructor ──────────────────────────────────────────────────────────

    /// @param _verifier Address of the deployed ZKNativeVerifier
    /// @param admin Address receiving DEFAULT_ADMIN_ROLE and VOTING_ADMIN_ROLE
    /// @param _merkleRoot Initial voter-eligibility Merkle root
    constructor(address _verifier, address admin, bytes32 _merkleRoot) {
        verifier = IZKVerifier(_verifier);
        merkleRoot = _merkleRoot;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VOTING_ADMIN_ROLE, admin);
        _grantRole(PROPOSAL_CREATOR_ROLE, admin);
    }

    // ─── IPrivateVoting ───────────────────────────────────────────────────────

    /// @inheritdoc IPrivateVoting
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 startTime,
        uint256 endTime
    ) external override onlyRole(PROPOSAL_CREATOR_ROLE) whenNotPaused returns (uint256 proposalId) {
        require(endTime > startTime, "PrivateVoting: endTime must be after startTime");
        require(endTime > block.timestamp, "PrivateVoting: endTime must be in the future");

        proposalId = ++proposalCount;
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            startTime: startTime,
            endTime: endTime,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            finalized: false,
            passed: false
        });

        emit ProposalCreated(proposalId, title, endTime);
    }

    /// @inheritdoc IPrivateVoting
    /// @dev Enforces the following checks in strict order:
    ///      1. Proposal exists
    ///      2. Voting window is active
    ///      3. Nullifier has not been used
    ///      4. Merkle root matches
    ///      5. Proposal ID matches
    ///      6. Vote choice is valid
    ///      7. ZK proof is valid
    function castVote(
        uint256 proposalId,
        IZKVerifier.Proof calldata proof,
        uint256[] calldata publicSignals
    ) external override whenNotPaused nonReentrant {
        require(publicSignals.length == 4, "PrivateVoting: must have exactly 4 public signals");

        // 1. Proposal must exist
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();

        // 2. Voting window must be active
        if (block.timestamp < proposal.startTime || block.timestamp > proposal.endTime) {
            revert ProposalNotActive();
        }

        // 3. Extract nullifier and check for double-voting
        bytes32 nullifier = bytes32(publicSignals[1]);
        if (nullifiers[proposalId][nullifier]) revert AlreadyVoted();

        // 4. Merkle root must match
        require(
            publicSignals[0] == uint256(merkleRoot),
            "PrivateVoting: merkle root mismatch"
        );

        // 5. Proposal ID must match
        require(
            publicSignals[2] == proposalId,
            "PrivateVoting: proposalId mismatch"
        );

        // 6. Vote choice must be 0, 1, or 2
        if (publicSignals[3] > 2) revert InvalidVoteChoice();

        // 7. Verify the ZK proof
        bool valid = verifier.verifyProof(proof, publicSignals);
        if (!valid) revert InvalidProof();

        // Record nullifier to prevent replay
        nullifiers[proposalId][nullifier] = true;

        // Tally the vote
        uint8 voteChoice = uint8(publicSignals[3]);
        if (voteChoice == 1) {
            proposal.votesFor++;
        } else if (voteChoice == 0) {
            proposal.votesAgainst++;
        } else {
            proposal.votesAbstain++;
        }

        emit VoteCast(proposalId, nullifier, voteChoice);
    }

    /// @inheritdoc IPrivateVoting
    function finalizeProposal(uint256 proposalId) external override {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.id == 0) revert ProposalNotFound();
        require(block.timestamp > proposal.endTime, "PrivateVoting: voting still active");
        require(!proposal.finalized, "PrivateVoting: already finalized");

        proposal.finalized = true;
        proposal.passed = proposal.votesFor > proposal.votesAgainst;

        emit ProposalFinalized(proposalId, proposal.passed);
    }

    /// @inheritdoc IPrivateVoting
    function hasVoted(uint256 proposalId, bytes32 nullifier) external view override returns (bool) {
        return nullifiers[proposalId][nullifier];
    }

    /// @inheritdoc IPrivateVoting
    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        if (proposals[proposalId].id == 0) revert ProposalNotFound();
        return proposals[proposalId];
    }

    /// @inheritdoc IPrivateVoting
    function getResults(uint256 proposalId)
        external
        view
        override
        returns (
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 votesAbstain,
            bool passed
        )
    {
        if (proposals[proposalId].id == 0) revert ProposalNotFound();
        Proposal storage p = proposals[proposalId];
        return (p.votesFor, p.votesAgainst, p.votesAbstain, p.passed);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Update the voter-eligibility Merkle root (e.g., to add new eligible voters)
    /// @param newRoot The new Merkle root
    function updateMerkleRoot(bytes32 newRoot) external onlyRole(VOTING_ADMIN_ROLE) {
        merkleRoot = newRoot;
    }

    /// @notice Pause all voting operations
    function pause() external onlyRole(VOTING_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause all voting operations
    function unpause() external onlyRole(VOTING_ADMIN_ROLE) {
        _unpause();
    }
}
