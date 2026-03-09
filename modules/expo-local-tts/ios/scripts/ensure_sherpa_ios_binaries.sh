#!/usr/bin/env bash
set -euo pipefail

SHERPA_VERSION="${SHERPA_ONNX_VERSION:-1.12.28}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IOS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
VENDOR_DIR="${IOS_DIR}/vendor"
SHERPA_TARGET="${VENDOR_DIR}/sherpa-onnx.xcframework"
ONNX_TARGET="${VENDOR_DIR}/onnxruntime.xcframework"
DOWNLOAD_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/v${SHERPA_VERSION}/sherpa-onnx-v${SHERPA_VERSION}-ios.tar.bz2"

if [[ -d "${SHERPA_TARGET}" && -d "${ONNX_TARGET}" ]]; then
  exit 0
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

curl -L --fail "${DOWNLOAD_URL}" -o "${TMP_DIR}/sherpa-ios.tar.bz2"
tar -xjf "${TMP_DIR}/sherpa-ios.tar.bz2" -C "${TMP_DIR}"

SHERPA_SOURCE="${TMP_DIR}/build-ios/sherpa-onnx.xcframework"
ONNX_SOURCE="$(find "${TMP_DIR}/build-ios/ios-onnxruntime" -mindepth 2 -maxdepth 2 -type d -name onnxruntime.xcframework | head -n1)"

if [[ ! -d "${SHERPA_SOURCE}" || -z "${ONNX_SOURCE}" || ! -d "${ONNX_SOURCE}" ]]; then
  echo "Failed to locate extracted Sherpa iOS frameworks." >&2
  exit 1
fi

mkdir -p "${VENDOR_DIR}"
rm -rf "${SHERPA_TARGET}" "${ONNX_TARGET}"
cp -R "${SHERPA_SOURCE}" "${SHERPA_TARGET}"
cp -R "${ONNX_SOURCE}" "${ONNX_TARGET}"
