#!/bin/bash

# Build Tor from source for Linux with static linking
# This script downloads, builds, and packages Tor for bundling with the app

set -e  # Exit on error

# Configuration
TOR_VERSION="0.4.8.13"  # Latest stable as of 2024
TOR_URL="https://dist.torproject.org/tor-${TOR_VERSION}.tar.gz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="${PROJECT_ROOT}/tor-build"
OUTPUT_DIR="${PROJECT_ROOT}/resources/tor/linux"

echo "🔨 Building Tor ${TOR_VERSION} from source for Linux..."
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

# Install dependencies via apt-get if needed
echo "🔍 Checking dependencies..."
echo "📦 Installing build dependencies..."
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libevent-dev \
  libssl-dev \
  zlib1g-dev \
  liblzma-dev \
  libzstd-dev \
  pkg-config

# Build Tor with static linking
echo "🔨 Configuring Tor build..."
cd "${TOR_SRC_DIR}"

# Configure with static linking where possible
./configure \
  --prefix="${BUILD_DIR}/tor-install" \
  --enable-static-libevent \
  --enable-static-openssl \
  --enable-static-zlib \
  --disable-asciidoc \
  --disable-systemd \
  --disable-libscrypt

echo "🔨 Building Tor..."
make -j$(nproc)

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
  ldd "${OUTPUT_DIR}/tor" || true

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
