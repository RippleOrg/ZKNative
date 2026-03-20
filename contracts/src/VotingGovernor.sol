// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

// ─── Governance Token ─────────────────────────────────────────────────────────

/// @title ZKNToken
/// @notice ERC20 governance token for ZKNative protocol with vote delegation support.
///         Initial supply of 1,000,000 ZKN minted to the initialHolder.
contract ZKNToken is ERC20Votes {
    /// @param initialHolder Address that receives the full initial supply
    constructor(address initialHolder)
        ERC20("ZKNative Token", "ZKN")
        EIP712("ZKNative Token", "1")
    {
        _mint(initialHolder, 1_000_000 * 10 ** 18);
    }

    /// @notice Uses timestamp-based voting snapshots (required for Polkadot Hub compatibility)
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Signals that this token uses timestamp mode
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}

// ─── Governor ─────────────────────────────────────────────────────────────────

/// @title VotingGovernor
/// @notice OpenZeppelin Governor governing ZKNative protocol parameters.
///         Controls: merkle root updates, verifier backend switching, pause/unpause,
///         and granting new proposal-creator roles on PrivateVoting.
///
///         Settings:
///           - Voting delay:  1 day
///           - Voting period: 1 week
///           - Proposal threshold: 100 ZKN
///           - Quorum: 4% of total supply
///           - Timelock: 2-day minimum delay
contract VotingGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /// @param _token ZKNToken (IVotes) used for voting power
    /// @param _timelock TimelockController that executes approved proposals
    constructor(IVotes _token, TimelockController _timelock)
        Governor("ZKNative Governor")
        GovernorSettings(1 days, 1 weeks, 100e18)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        GovernorTimelockControl(_timelock)
    {}

    // ─── Required overrides to resolve multi-inheritance ─────────────────────

    /// @inheritdoc IGovernor
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /// @inheritdoc IGovernor
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /// @inheritdoc Governor
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /// @inheritdoc IGovernor
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /// @inheritdoc IGovernor
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /// @inheritdoc Governor
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /// @inheritdoc Governor
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /// @inheritdoc Governor
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /// @inheritdoc Governor
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /// @inheritdoc Governor
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
