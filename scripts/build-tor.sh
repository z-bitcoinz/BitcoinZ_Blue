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

if ! brew list xz &>/dev/null; then
  echo "📦 Installing xz (liblzma)..."
  brew install xz
fi

if ! brew list zstd &>/dev/null; then
  echo "📦 Installing zstd..."
  brew install zstd
fi

# Build Tor with static linking
echo "🔨 Configuring Tor build..."
cd "${TOR_SRC_DIR}"

# Get Homebrew paths for dependencies
LIBEVENT_PREFIX=$(brew --prefix libevent)
OPENSSL_PREFIX=$(brew --prefix openssl@3)
ZLIB_PREFIX=$(brew --prefix zlib)
XZ_PREFIX=$(brew --prefix xz)
ZSTD_PREFIX=$(brew --prefix zstd)

# Set up LDFLAGS and CPPFLAGS for static linking
export LDFLAGS="-L${LIBEVENT_PREFIX}/lib -L${OPENSSL_PREFIX}/lib -L${ZLIB_PREFIX}/lib -L${XZ_PREFIX}/lib -L${ZSTD_PREFIX}/lib"
export CPPFLAGS="-I${LIBEVENT_PREFIX}/include -I${OPENSSL_PREFIX}/include -I${ZLIB_PREFIX}/include -I${XZ_PREFIX}/include -I${ZSTD_PREFIX}/include"

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

  echo "📋 Checking dependencies before fixup..."
  otool -L "${OUTPUT_DIR}/tor"

  # Fix dynamic library paths to use @executable_path
  echo "🔧 Fixing dynamic library paths..."

  # Get list of non-system dynamic libraries
  DYLIBS=$(otool -L "${OUTPUT_DIR}/tor" | grep -v ":" | grep -E "(liblzma|libzstd)" | awk '{print $1}')

  for dylib in $DYLIBS; do
    lib_name=$(basename "$dylib")
    echo "  Fixing: $lib_name"

    # Copy the library to output directory
    if [ -f "$dylib" ]; then
      cp "$dylib" "${OUTPUT_DIR}/${lib_name}"
      chmod 644 "${OUTPUT_DIR}/${lib_name}"

      # Change the reference in tor binary to use @executable_path
      install_name_tool -change "$dylib" "@executable_path/${lib_name}" "${OUTPUT_DIR}/tor"

      # Also fix the library's own ID
      install_name_tool -id "@executable_path/${lib_name}" "${OUTPUT_DIR}/${lib_name}"
    fi
  done

  echo "📋 Checking dependencies after fixup..."
  otool -L "${OUTPUT_DIR}/tor"

  # Code signing (if certificate available)
  if [ -n "${APPLE_SIGNING_IDENTITY}" ] || [ -n "${CODESIGN_IDENTITY}" ]; then
    IDENTITY="${APPLE_SIGNING_IDENTITY:-$CODESIGN_IDENTITY}"
    echo "🔐 Signing Tor binary and libraries with identity: ${IDENTITY}"

    # Sign all bundled libraries first
    for lib in "${OUTPUT_DIR}"/*.dylib; do
      if [ -f "$lib" ]; then
        echo "  Signing: $(basename "$lib")"
        codesign --force \
          --sign "${IDENTITY}" \
          --options runtime \
          --timestamp \
          "$lib"
      fi
    done

    # Sign the tor binary last
    codesign --force \
      --sign "${IDENTITY}" \
      --options runtime \
      --timestamp \
      "${OUTPUT_DIR}/tor"

    echo "✅ Tor binary and libraries signed successfully"
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
