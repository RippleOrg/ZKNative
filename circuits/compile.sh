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
PTAU_SIZE=13          # 2^13 = 8192 constraints, enough for the current ~5.3k-constraint circuit
BUILD_DIR="../circuits/build"
CONTRACTS_DIR="../contracts/src"
PTAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU_SIZE}.ptau"

if [ -x "$HOME/.cargo/bin/circom" ]; then
    CIRCOM_BIN="$HOME/.cargo/bin/circom"
else
    CIRCOM_BIN="circom"
fi

echo "=== ZKNative Circuit Compilation ==="
echo "Using circom: $CIRCOM_BIN"

# ─── Setup build directory ────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"

# ─── Step 1: Compile the circuit ──────────────────────────────────────────────
echo "[1/7] Compiling ${CIRCUIT_NAME}.circom..."
"$CIRCOM_BIN" "${CIRCUIT_NAME}.circom" \
    --r1cs \
    --wasm \
    --sym \
    -l .. \
    --output "$BUILD_DIR"

echo "  R1CS constraints: $(snarkjs r1cs info ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs 2>&1 | grep '#Constraints' || echo 'unknown')"

# ─── Step 2: Download Powers of Tau (Hermez ceremony) ─────────────────────────
PTAU_FILE="$BUILD_DIR/pot${PTAU_SIZE}_final.ptau"
if [ ! -f "$PTAU_FILE" ]; then
    echo "[2/7] Downloading Powers of Tau (hermez ceremony, size=${PTAU_SIZE})..."
    if ! curl -fL "$PTAU_URL" -o "$PTAU_FILE"; then
        rm -f "$PTAU_FILE"
    fi
else
    echo "[2/7] Powers of Tau already present — skipping download."
fi

if [ ! -f "$PTAU_FILE" ] || file "$PTAU_FILE" | grep -Eq 'XML|HTML|text'; then
    echo "[2/7] Remote PTAU unavailable or invalid — generating local Powers of Tau..."
    rm -f "$PTAU_FILE"
    RAW_PTAU_FILE="$BUILD_DIR/pot${PTAU_SIZE}_0000.ptau"
    CONTRIBUTED_PTAU_FILE="$BUILD_DIR/pot${PTAU_SIZE}_contrib.ptau"
    snarkjs powersoftau new bn128 "$PTAU_SIZE" "$RAW_PTAU_FILE" -v
    echo "zknative-local-ptau-$(date +%s)" | \
        snarkjs powersoftau contribute "$RAW_PTAU_FILE" "$CONTRIBUTED_PTAU_FILE" \
            --name="ZKNative Local PTAU" \
            -v
    snarkjs powersoftau prepare phase2 "$CONTRIBUTED_PTAU_FILE" "$PTAU_FILE" -v
    rm -f "$RAW_PTAU_FILE"
    rm -f "$CONTRIBUTED_PTAU_FILE"
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
