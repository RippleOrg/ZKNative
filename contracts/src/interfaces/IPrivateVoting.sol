// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IZKVerifier.sol";

/// @title IPrivateVoting
/// @notice Interface for the private on-chain voting contract using ZK proofs for eligibility
interface IPrivateVoting {
    /// @notice Represents a governance proposal with vote tallies
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool finalized;
        bool passed;
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when a new proposal is created
    /// @param proposalId The unique identifier of the proposal
    /// @param title The human-readable title
    /// @param endTime UNIX timestamp when voting closes
    event ProposalCreated(uint256 indexed proposalId, string title, uint256 endTime);

    /// @notice Emitted when a vote is cast (nullifier prevents double-voting)
    /// @param proposalId The proposal being voted on
    /// @param nullifier Unique commitment preventing replay; derived from voter's secret
    /// @param voteChoice 0 = against, 1 = for, 2 = abstain
    event VoteCast(uint256 indexed proposalId, bytes32 nullifier, uint8 voteChoice);

    /// @notice Emitted when a proposal is finalized and the result is recorded
    /// @param proposalId The proposal that was finalized
    /// @param passed Whether the proposal passed (votesFor > votesAgainst)
    event ProposalFinalized(uint256 indexed proposalId, bool passed);

    // ─── Custom Errors ────────────────────────────────────────────────────────

    /// @notice Voter has already voted on this proposal (nullifier already used)
    error AlreadyVoted();

    /// @notice The submitted ZK proof failed on-chain verification
    error InvalidProof();

    /// @notice The proposal is not currently in its active voting window
    error ProposalNotActive();

    /// @notice No proposal exists with the given ID
    error ProposalNotFound();

    /// @notice The voteChoice encoded in publicSignals is out of range (must be 0, 1, or 2)
    error InvalidVoteChoice();

    // ─── Functions ────────────────────────────────────────────────────────────

    /// @notice Create a new proposal (requires PROPOSAL_CREATOR_ROLE)
    /// @param title Short title of the proposal
    /// @param description Full description
    /// @param startTime UNIX timestamp when voting opens
    /// @param endTime UNIX timestamp when voting closes
    /// @return proposalId The ID assigned to the new proposal
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 startTime,
        uint256 endTime
    ) external returns (uint256 proposalId);

    /// @notice Cast a private vote using a ZK proof of eligibility
    /// @dev Public signals layout:
    ///      [0] merkleRoot  — must match the contract's stored root
    ///      [1] nullifier   — unique per voter per proposal; prevents double-voting
    ///      [2] proposalId  — must match the proposalId argument
    ///      [3] voteChoice  — 0 = against, 1 = for, 2 = abstain
    /// @param proposalId The proposal to vote on
    /// @param proof The Groth16 ZK proof
    /// @param publicSignals The circuit's public outputs (see layout above)
    function castVote(
        uint256 proposalId,
        IZKVerifier.Proof calldata proof,
        uint256[] calldata publicSignals
    ) external;

    /// @notice Finalize a proposal after its voting period has ended
    /// @dev Sets finalized = true and computes passed = votesFor > votesAgainst
    /// @param proposalId The proposal to finalize
    function finalizeProposal(uint256 proposalId) external;

    /// @notice Check whether a specific nullifier has already been used on a proposal
    /// @param proposalId The proposal in question
    /// @param nullifier The nullifier to check
    /// @return True if the nullifier has been recorded (i.e. voter already voted)
    function hasVoted(uint256 proposalId, bytes32 nullifier) external view returns (bool);

    /// @notice Retrieve full proposal details
    /// @param proposalId The proposal to look up
    /// @return The Proposal struct
    function getProposal(uint256 proposalId) external view returns (Proposal memory);

    /// @notice Get the vote tally and outcome of a proposal
    /// @param proposalId The proposal to query
    /// @return votesFor Number of for votes
    /// @return votesAgainst Number of against votes
    /// @return votesAbstain Number of abstain votes
    /// @return passed Whether the proposal passed (only meaningful after finalization)
    function getResults(uint256 proposalId)
        external
        view
        returns (
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 votesAbstain,
            bool passed
        );
}
