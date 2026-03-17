#!/usr/bin/env bash
# scripts/setup.sh
# One-command setup for local ZKNative development.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== ZKNative Setup ==="
echo "Repository root: ${REPO_ROOT}"

# ─── Check prerequisites ──────────────────────────────────────────────────────
check_tool() {
    if ! command -v "$1" &>/dev/null; then
        echo "❌ Required tool not found: $1"
        echo "   Install it from: $2"
        exit 1
    fi
    echo "✅ $1 found"
}

echo ""
echo "[1/5] Checking prerequisites..."
check_tool "forge"    "https://getfoundry.sh"
check_tool "cargo"    "https://rustup.rs"
check_tool "node"     "https://nodejs.org"
check_tool "npm"      "https://nodejs.org"
check_tool "circom"   "npm install -g circom"   || true  # optional
check_tool "snarkjs"  "npm install -g snarkjs"  || true  # optional

# ─── Install Foundry libs ─────────────────────────────────────────────────────
echo ""
echo "[2/5] Installing Foundry libraries..."
cd "${REPO_ROOT}/contracts"
forge install foundry-rs/forge-std 2>/dev/null || true
forge install OpenZeppelin/openzeppelin-contracts 2>/dev/null || true
echo "✅ Foundry libraries installed"

# ─── Build Rust PVM verifier ──────────────────────────────────────────────────
echo ""
echo "[3/5] Building Rust PVM verifier..."
cd "${REPO_ROOT}/pvm-verifier"
cargo build --release
echo "✅ Rust verifier built"

# ─── Install frontend dependencies ───────────────────────────────────────────
echo ""
echo "[4/5] Installing frontend dependencies..."
cd "${REPO_ROOT}/frontend"
npm ci
echo "✅ Frontend dependencies installed"

# ─── Build contracts ──────────────────────────────────────────────────────────
echo ""
echo "[5/5] Building and testing contracts..."
cd "${REPO_ROOT}/contracts"
forge build
forge test -vv

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Compile circuits:  bash circuits/compile.sh"
echo "  2. Copy env file:     cp frontend/.env.example frontend/.env.local"
echo "  3. Start frontend:    cd frontend && npm run dev"
echo "  4. Deploy contracts:  cd contracts && forge script script/Deploy.s.sol --broadcast"
