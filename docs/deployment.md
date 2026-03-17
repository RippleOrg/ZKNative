# Deployment Guide

## Prerequisites

- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A funded wallet on Polkadot Hub Westend Testnet
- RPC endpoint for Polkadot Hub Westend: `https://westend-asset-hub-eth-rpc.polkadot.io`

## Local Deployment (Anvil)

```bash
# Start Anvil
anvil

# In another terminal:
cd contracts
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit

export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Polkadot Hub Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=<your-deployer-private-key>
export POLKADOT_HUB_RPC=https://westend-asset-hub-eth-rpc.polkadot.io
export ETHERSCAN_API_KEY=<blockscout-api-key>
export BLOCKSCOUT_URL=https://westend-asset-hub.blockscout.com/api

cd contracts

forge script script/Deploy.s.sol \
  --rpc-url $POLKADOT_HUB_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

## Post-Deployment Steps

1. **Update frontend** `.env.local` with deployed contract addresses from `broadcast/addresses.json`
2. **Update Merkle root** after generating the eligibility tree: `PrivateVoting.updateMerkleRoot(newRoot)`
3. **Verify contracts** on Blockscout: `forge verify-contract`
4. **Transfer admin roles** to the TimelockController for production governance

## Contract Verification

```bash
# Verify ZKNativeVerifier
forge verify-contract \
  <VERIFIER_ADDRESS> \
  contracts/src/ZKNativeVerifier.sol:ZKNativeVerifier \
  --chain-id 420420421 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" <ADMIN_ADDRESS>)
```
