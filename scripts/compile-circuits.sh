#!/usr/bin/env bash
# scripts/compile-circuits.sh
# Convenience wrapper that delegates to circuits/compile.sh

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}/circuits"
bash compile.sh "$@"
