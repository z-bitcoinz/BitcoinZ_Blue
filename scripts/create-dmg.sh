#!/bin/bash

# BitcoinZ Blue DMG Creator
# Creates DMG files that preserve ad-hoc signatures better than ZIP

set -e

echo "📦 BitcoinZ Blue DMG Creator"
echo "============================"
echo ""

# Configuration
APP_NAME="BitcoinZ Blue"
VERSION="1.0.9"
DIST_DIR="dist"

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: dist directory not found. Please build first."
    exit 1
fi

# Function to create DMG
create_dmg() {
    local ARCH=$1
    local SOURCE_DIR=$2
    local DMG_NAME="${APP_NAME}-${VERSION}-${ARCH}.dmg"
    local TEMP_DIR="dmg-temp-${ARCH}"
    
    echo "🔨 Creating DMG for ${ARCH}..."
    
    # Create temporary directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Copy app
    if [ -d "${SOURCE_DIR}/${APP_NAME}.app" ]; then
        cp -R "${SOURCE_DIR}/${APP_NAME}.app" "$TEMP_DIR/"
    else
        echo "⚠️  Warning: ${APP_NAME}.app not found in ${SOURCE_DIR}"
        rm -rf "$TEMP_DIR"
        return
    fi
    
    # Create symbolic link to Applications
    ln -s /Applications "$TEMP_DIR/Applications"
    
    # Create DMG with nice settings
    hdiutil create -volname "${APP_NAME}" \
        -srcfolder "$TEMP_DIR" \
        -ov -format UDZO \
        -fs HFS+ \
        -imagekey zlib-level=9 \
        "${DIST_DIR}/${DMG_NAME}"
    
    # Sign the DMG
    echo "🔐 Signing DMG..."
    codesign --force --sign - "${DIST_DIR}/${DMG_NAME}"
    
    # Verify
    echo "✅ Created: ${DIST_DIR}/${DMG_NAME}"
    ls -lh "${DIST_DIR}/${DMG_NAME}"
    
    # Clean up
    rm -rf "$TEMP_DIR"
}

# Create DMGs for both architectures
if [ -d "${DIST_DIR}/mac-arm64" ]; then
    create_dmg "arm64" "${DIST_DIR}/mac-arm64"
fi

if [ -d "${DIST_DIR}/mac" ]; then
    create_dmg "x64" "${DIST_DIR}/mac"
fi

echo ""
echo "🎉 DMG creation complete!"
echo ""
echo "📋 Created files:"
ls -lh ${DIST_DIR}/*.dmg 2>/dev/null || echo "No DMG files found"
echo ""
echo "💡 These DMG files preserve signatures better than ZIP files"
echo "   when downloaded from the internet."
