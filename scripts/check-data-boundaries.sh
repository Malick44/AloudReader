#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

search_code() {
  local pattern="$1"
  shift

  if command -v rg >/dev/null 2>&1; then
    rg -n --glob '*.{ts,tsx}' "$pattern" "$@"
    return $?
  fi

  grep -RInE --include='*.ts' --include='*.tsx' "$pattern" "$@"
}

if search_code "(\\.from\\(|\\.rpc\\()" \
  "$ROOT_DIR/src/features" \
  "$ROOT_DIR/src/components" \
  "$ROOT_DIR/app"; then
  echo "Direct Supabase query usage found outside src/data/**"
  exit 1
fi

if search_code "@/data/(repos|codecs|queries|rpc|selects|supabase)/" \
  "$ROOT_DIR/src/features" \
  "$ROOT_DIR/src/components" \
  "$ROOT_DIR/app"; then
  echo "Deep data-layer imports found outside src/data public API"
  exit 1
fi

echo "Data boundary check passed"
