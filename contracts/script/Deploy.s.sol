// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ZKNativeVerifier.sol";
import "../src/PrivateVoting.sol";
import "../src/VotingGovernor.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== ZKNative Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Network:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy governance token
        ZKNToken token = new ZKNToken(deployer);
        console.log("ZKNToken:           ", address(token));

        // 2. Deploy TimelockController (2-day min delay)
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = deployer;
        TimelockController timelock = new TimelockController(
            2 days,
            proposers,
            executors,
            deployer // admin
        );
        console.log("TimelockController: ", address(timelock));

        // 3. Deploy Governor
        VotingGovernor governor = new VotingGovernor(IVotes(address(token)), timelock);
        console.log("VotingGovernor:     ", address(governor));

        // 4. Deploy ZKNativeVerifier
        ZKNativeVerifier verifier = new ZKNativeVerifier(deployer);
        console.log("ZKNativeVerifier:   ", address(verifier));

        // 5. Deploy PrivateVoting with a placeholder Merkle root
        bytes32 placeholderRoot = keccak256(abi.encode("initial-merkle-root", block.chainid));
        PrivateVoting voting = new PrivateVoting(address(verifier), deployer, placeholderRoot);
        console.log("PrivateVoting:      ", address(voting));

        // 6. Grant PROPOSAL_CREATOR_ROLE to the timelock on PrivateVoting
        voting.grantRole(voting.PROPOSAL_CREATOR_ROLE(), address(timelock));

        // 7. Grant PROOF_SUBMITTER_ROLE to PrivateVoting on ZKNativeVerifier
        verifier.grantRole(verifier.PROOF_SUBMITTER_ROLE(), address(voting));

        // 8. Transfer VERIFIER_ADMIN_ROLE to the governor timelock
        //    (keep deployer for hackathon convenience — renounce after prod setup)
        verifier.grantRole(verifier.VERIFIER_ADMIN_ROLE(), address(timelock));

        vm.stopBroadcast();

        // 9. Write addresses JSON
        string memory json = string(
            abi.encodePacked(
                '{"chainId":', vm.toString(block.chainid),
                ',"ZKNToken":"', vm.toString(address(token)),
                '","TimelockController":"', vm.toString(address(timelock)),
                '","VotingGovernor":"', vm.toString(address(governor)),
                '","ZKNativeVerifier":"', vm.toString(address(verifier)),
                '","PrivateVoting":"', vm.toString(address(voting)),
                '"}'
            )
        );
        vm.writeJson(json, "broadcast/addresses.json");

        console.log("");
        console.log("=== Deployment complete ===");
        console.log("Addresses written to broadcast/addresses.json");
    }
}
