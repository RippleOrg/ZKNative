// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/ZKNativeVerifier.sol";
import "../test/helpers/ProofHelper.sol";

/// @notice Utility script: submit a test proof to a deployed ZKNativeVerifier and print gas stats
contract VerifyScript is Script {
    function run() external {
        address verifierAddr = vm.envAddress("VERIFIER_ADDRESS");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        ZKNativeVerifier verifier = ZKNativeVerifier(verifierAddr);

        console.log("=== ZKNative Proof Verification Benchmark ===");
        console.log("Verifier:", verifierAddr);
        console.log("Using PVM backend:", verifier.usePVMBackend());

        IZKVerifier.Proof memory proof = ProofHelper.validStructuralProof();
        uint256[] memory signals = new uint256[](4);
        signals[0] = 1;
        signals[1] = 2;
        signals[2] = 1;
        signals[3] = 1;

        vm.broadcast(deployerKey);
        bool result = verifier.verifyAndRecord(proof, signals);

        console.log("Proof valid:", result);
        console.log("Gas used:", verifier.lastVerificationGas());
    }
}
