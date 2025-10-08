#!/bin/bash

# Build Tor from source for macOS with static linking and code signing
# This script downloads, builds, and signs Tor for bundling with the app

set -e  # Exit on error

# Configuration
TOR_VERSION="0.4.8.13"  # Latest stable as of 2024
TOR_URL="https://dist.torproject.org/tor-${TOR_VERSION}.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="${PROJECT_ROOT}/tor-build"
OUTPUT_DIR="${PROJECT_ROOT}/resources/tor/darwin"

echo "🔨 Building Tor ${TOR_VERSION} from source..."
echo "  Build directory: ${BUILD_DIR}"
echo "  Output directory: ${OUTPUT_DIR}"

# Create directories
mkdir -p "${BUILD_DIR}"
mkdir -p "${OUTPUT_DIR}"

# Download Tor source if not already present
TOR_TARBALL="${BUILD_DIR}/tor-${TOR_VERSION}.tar.gz"
if [ ! -f "${TOR_TARBALL}" ]; then
  echo "📥 Downloading Tor ${TOR_VERSION}..."
  curl -L "${TOR_URL}" -o "${TOR_TARBALL}"
else
  echo "✅ Tor tarball already downloaded"
fi

# Extract Tor source
TOR_SRC_DIR="${BUILD_DIR}/tor-${TOR_VERSION}"
if [ ! -d "${TOR_SRC_DIR}" ]; then
  echo "📦 Extracting Tor source..."
  cd "${BUILD_DIR}"
  tar -xzf "tor-${TOR_VERSION}.tar.gz"
else
  echo "✅ Tor source already extracted"
fi

# Install dependencies via Homebrew if needed
echo "🔍 Checking dependencies..."
if ! brew list libevent &>/dev/null; then
  echo "📦 Installing libevent..."
  brew install libevent
fi

if ! brew list openssl@3 &>/dev/null; then
  echo "📦 Installing openssl@3..."
  brew install openssl@3
fi

if ! brew list zlib &>/dev/null; then
  echo "📦 Installing zlib..."
  brew install zlib
fi

# Build Tor with static linking
echo "🔨 Configuring Tor build..."
cd "${TOR_SRC_DIR}"

# Get Homebrew paths for dependencies
LIBEVENT_PREFIX=$(brew --prefix libevent)
OPENSSL_PREFIX=$(brew --prefix openssl@3)
ZLIB_PREFIX=$(brew --prefix zlib)

# Configure with static linking where possible
# Note: Full static linking is difficult on macOS, but we minimize dynamic deps
./configure \
  --prefix="${BUILD_DIR}/tor-install" \
  --with-libevent-dir="${LIBEVENT_PREFIX}" \
  --with-openssl-dir="${OPENSSL_PREFIX}" \
  --with-zlib-dir="${ZLIB_PREFIX}" \
  --enable-static-libevent \
  --enable-static-openssl \
  --enable-static-zlib \
  --disable-asciidoc \
  --disable-systemd \
  --disable-libscrypt

echo "🔨 Building Tor..."
make -j$(sysctl -n hw.ncpu)

echo "📦 Installing Tor to build directory..."
make install

# Copy tor binary to resources
TOR_BINARY="${BUILD_DIR}/tor-install/bin/tor"
if [ -f "${TOR_BINARY}" ]; then
  echo "✅ Tor built successfully!"
  echo "   Size: $(du -h "${TOR_BINARY}" | awk '{print $1}')"

  # Copy to output directory
  cp "${TOR_BINARY}" "${OUTPUT_DIR}/tor"
  chmod +x "${OUTPUT_DIR}/tor"

  echo "📋 Checking dependencies..."
  otool -L "${OUTPUT_DIR}/tor"

  # Code signing (if certificate available)
  if [ -n "${APPLE_SIGNING_IDENTITY}" ] || [ -n "${CODESIGN_IDENTITY}" ]; then
    IDENTITY="${APPLE_SIGNING_IDENTITY:-$CODESIGN_IDENTITY}"
    echo "🔐 Signing Tor binary with identity: ${IDENTITY}"

    codesign --force \
      --sign "${IDENTITY}" \
      --options runtime \
      --timestamp \
      "${OUTPUT_DIR}/tor"

    echo "✅ Tor binary signed successfully"
    codesign -dv "${OUTPUT_DIR}/tor" 2>&1 | grep -E "Authority|Signature|Runtime"
  else
    echo "⚠️  No signing identity found, skipping code signing"
    echo "   Set APPLE_SIGNING_IDENTITY or CODESIGN_IDENTITY to sign"
  fi

  echo ""
  echo "🎉 Tor build complete!"
  echo "   Binary: ${OUTPUT_DIR}/tor"
else
  echo "❌ Tor binary not found after build"
  exit 1
fi

# Cleanup option
if [ "$1" == "--cleanup" ]; then
  echo "🧹 Cleaning up build directory..."
  rm -rf "${BUILD_DIR}"
fi
