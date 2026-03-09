#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if rg -n --glob '*.{ts,tsx}' "(\\.from\\(|\\.rpc\\()" \
  "$ROOT_DIR/src/features" \
  "$ROOT_DIR/src/components" \
  "$ROOT_DIR/app"; then
  echo "Direct Supabase query usage found outside src/data/**"
  exit 1
fi

echo "Data boundary check passed"
