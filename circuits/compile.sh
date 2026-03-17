#!/usr/bin/env bash
# circuits/compile.sh
# Compile the voting eligibility circuit and run the trusted setup (Powers of Tau).
# Outputs: proving key (zkey), verification key (vk.json), and verifier Solidity stub.
#
# Prerequisites:
#   npm install -g circom snarkjs
#   Or: npm install (from circuits/ directory if package.json exists)
#
# Usage:
#   cd circuits
#   bash compile.sh

set -euo pipefail

CIRCUIT_NAME="voting_eligibility"
PTAU_SIZE=22          # 2^22 constraints — sufficient for 20-level Merkle tree
BUILD_DIR="../circuits/build"
CONTRACTS_DIR="../contracts/src"

echo "=== ZKNative Circuit Compilation ==="

# ─── Setup build directory ────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"

# ─── Step 1: Compile the circuit ──────────────────────────────────────────────
echo "[1/7] Compiling ${CIRCUIT_NAME}.circom..."
circom "${CIRCUIT_NAME}.circom" \
    --r1cs \
    --wasm \
    --sym \
    --output "$BUILD_DIR"

echo "  R1CS constraints: $(snarkjs r1cs info ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs 2>&1 | grep '#Constraints' || echo 'unknown')"

# ─── Step 2: Download Powers of Tau (Hermez ceremony) ─────────────────────────
PTAU_FILE="$BUILD_DIR/pot${PTAU_SIZE}_final.ptau"
if [ ! -f "$PTAU_FILE" ]; then
    echo "[2/7] Downloading Powers of Tau (hermez ceremony, size=${PTAU_SIZE})..."
    curl -L "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU_SIZE}.ptau" \
        -o "$PTAU_FILE"
else
    echo "[2/7] Powers of Tau already present — skipping download."
fi

# ─── Step 3: Groth16 setup ────────────────────────────────────────────────────
echo "[3/7] Running Groth16 setup..."
snarkjs groth16 setup \
    "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" \
    "$PTAU_FILE" \
    "${BUILD_DIR}/${CIRCUIT_NAME}_0.zkey"

# ─── Step 4: Contribute to ceremony (use /dev/urandom for demo; replace in prod) ──
echo "[4/7] Contributing to ceremony..."
echo "zknative-demo-entropy-$(date +%s)-replace-in-production" | \
    snarkjs zkey contribute \
        "${BUILD_DIR}/${CIRCUIT_NAME}_0.zkey" \
        "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
        --name="ZKNative Demo Contribution" \
        -v

# ─── Step 5: Export verification key ─────────────────────────────────────────
echo "[5/7] Exporting verification key..."
snarkjs zkey export verificationkey \
    "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
    "${BUILD_DIR}/verification_key.json"

echo "  Verification key written to ${BUILD_DIR}/verification_key.json"

# ─── Step 6: Generate Solidity verifier (reference — ZKNativeVerifier uses PVM) ─
echo "[6/7] Generating Solidity verifier stub..."
snarkjs zkey export solidityverifier \
    "${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey" \
    "${CONTRACTS_DIR}/GeneratedVerifier.sol" || true

# ─── Step 7: Export binary VK for PVM Rust verifier ──────────────────────────
echo "[7/7] Converting VK to binary format for PVM verifier..."
node ../scripts/export-vk-bin.js \
    "${BUILD_DIR}/verification_key.json" \
    "../pvm-verifier/keys/voting_vk_placeholder.bin" || \
    echo "  Warning: export-vk-bin.js not found — update pvm-verifier/keys/ manually"

echo ""
echo "=== Compilation complete ==="
echo "  Proving key:       ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey"
echo "  Verification key:  ${BUILD_DIR}/verification_key.json"
echo "  WASM witness gen:  ${BUILD_DIR}/${CIRCUIT_NAME}_js/"
echo ""
echo "Next steps:"
echo "  1. Update ZKNativeVerifier.sol constructor with VK constants from verification_key.json"
echo "  2. Run 'bash scripts/generate-proof.ts' to test proof generation"
echo "  3. Deploy with 'forge script contracts/script/Deploy.s.sol'"
