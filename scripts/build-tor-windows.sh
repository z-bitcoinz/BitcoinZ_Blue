#!/bin/bash

# Download Tor Expert Bundle for Windows
# Building Tor from source on Windows is complex; downloading official build is standard practice
# The Tor Expert Bundle is built by the Tor Project from the same source code

set -e  # Exit on error

# Configuration
TOR_VERSION="0.4.8.13"  # Latest stable as of 2024
# Use Tor Browser 14.0.3 (latest stable) for Tor Expert Bundle
TOR_EXPERT_BUNDLE_URL="https://archive.torproject.org/tor-package-archive/torbrowser/14.0.3/tor-expert-bundle-windows-x86_64-14.0.3.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="${PROJECT_ROOT}/tor-build-windows"
OUTPUT_DIR="${PROJECT_ROOT}/resources/tor/win32"

echo "🔨 Downloading Tor Expert Bundle for Windows..."
echo "  Build directory: ${BUILD_DIR}"
echo "  Output directory: ${OUTPUT_DIR}"

# Create directories
mkdir -p "${BUILD_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Download Tor Expert Bundle if not already present
TOR_BUNDLE="${BUILD_DIR}/tor-expert-bundle.tar.gz"
if [ ! -f "${TOR_BUNDLE}" ]; then
  echo "📥 Downloading Tor Expert Bundle..."
  curl -L "${TOR_EXPERT_BUNDLE_URL}" -o "${TOR_BUNDLE}"

  # Verify download was successful
  if [ ! -f "${TOR_BUNDLE}" ] || [ ! -s "${TOR_BUNDLE}" ]; then
    echo "❌ Download failed or file is empty"
    exit 1
  fi

  # Check if it's a valid gzip file
  if ! file "${TOR_BUNDLE}" | grep -q "gzip compressed"; then
    echo "❌ Downloaded file is not a valid gzip archive"
    echo "File type: $(file "${TOR_BUNDLE}")"
    echo "File contents (first 500 bytes):"
    head -c 500 "${TOR_BUNDLE}"
    exit 1
  fi
else
  echo "✅ Tor Expert Bundle already downloaded"
fi

# Extract Tor Expert Bundle
echo "📦 Extracting Tor Expert Bundle..."
cd "${BUILD_DIR}"
tar -xzf "tor-expert-bundle.tar.gz"

# Find tor.exe in extracted files
TOR_BINARY=$(find . -name "tor.exe" -type f | head -1)
if [ -z "${TOR_BINARY}" ]; then
  echo "❌ tor.exe not found in Tor Expert Bundle"
  exit 1
fi

echo "✅ Found tor.exe: ${TOR_BINARY}"
TOR_DIR=$(dirname "${TOR_BINARY}")

# Copy tor.exe and required DLLs to output directory
echo "📦 Copying Tor binaries and dependencies..."
cp "${TOR_BINARY}" "${OUTPUT_DIR}/tor.exe"

# Copy all DLLs from the same directory
for dll in "${TOR_DIR}"/*.dll; do
  if [ -f "$dll" ]; then
    echo "  Copying: $(basename "$dll")"
    cp "$dll" "${OUTPUT_DIR}/"
  fi
done

# Verify tor.exe was copied
if [ -f "${OUTPUT_DIR}/tor.exe" ]; then
  echo "✅ Tor binaries packaged successfully!"
  echo "   Binary: ${OUTPUT_DIR}/tor.exe"
  echo "   Size: $(du -h "${OUTPUT_DIR}/tor.exe" | awk '{print $1}')"

  echo ""
  echo "📋 Package contents:"
  ls -lh "${OUTPUT_DIR}"

  echo ""
  echo "🎉 Tor packaging complete!"
else
  echo "❌ Failed to copy tor.exe"
  exit 1
fi

# Cleanup option
if [ "$1" == "--cleanup" ]; then
  echo "🧹 Cleaning up build directory..."
  rm -rf "${BUILD_DIR}"
fi
