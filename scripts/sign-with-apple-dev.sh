#!/bin/bash

# Apple Developer Code Signing Script for BitcoinZ Blue
# This script builds and signs the app with your Apple Developer certificate

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Apple Developer Code Signing for BitcoinZ Blue${NC}"
echo "=================================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Check for required tools
command -v codesign >/dev/null 2>&1 || { echo -e "${RED}❌ codesign not found${NC}"; exit 1; }
command -v security >/dev/null 2>&1 || { echo -e "${RED}❌ security not found${NC}"; exit 1; }

# Find available signing identities
echo -e "\n${YELLOW}🔍 Available signing identities:${NC}"
IDENTITIES=$(security find-identity -v -p codesigning | grep "Developer ID Application" || true)

if [ -z "$IDENTITIES" ]; then
    echo -e "${RED}❌ No Developer ID Application certificates found!${NC}"
    echo -e "${YELLOW}Please install your Apple Developer certificate first.${NC}"
    echo ""
    echo "Steps:"
    echo "1. Download certificate from developer.apple.com"
    echo "2. Double-click to install in Keychain"
    echo "3. Run this script again"
    exit 1
fi

echo "$IDENTITIES"

# Let user choose identity or auto-select if only one
IDENTITY_COUNT=$(echo "$IDENTITIES" | wc -l | tr -d ' ')
if [ "$IDENTITY_COUNT" -eq 1 ]; then
    SIGNING_IDENTITY=$(echo "$IDENTITIES" | sed -n 's/.*"\(Developer ID Application[^"]*\)".*/\1/p')
    echo -e "\n${GREEN}✅ Auto-selected: $SIGNING_IDENTITY${NC}"
else
    echo -e "\n${YELLOW}Multiple identities found. Please choose:${NC}"
    echo "$IDENTITIES" | nl
    read -p "Enter number: " choice
    SIGNING_IDENTITY=$(echo "$IDENTITIES" | sed -n "${choice}p" | sed -n 's/.*"\(Developer ID Application[^"]*\)".*/\1/p')
fi

if [ -z "$SIGNING_IDENTITY" ]; then
    echo -e "${RED}❌ Invalid selection${NC}"
    exit 1
fi

echo -e "\n${BLUE}🔐 Using identity: $SIGNING_IDENTITY${NC}"

# Set environment variables for signing
export CSC_IDENTITY_AUTO_DISCOVERY=true
export APPLE_SIGNING_IDENTITY="$SIGNING_IDENTITY"
export HARDENED_RUNTIME=true

# Optional: Set Apple credentials for notarization
if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ] && [ -n "$APPLE_TEAM_ID" ]; then
    echo -e "${GREEN}✅ Apple credentials found - notarization will be attempted${NC}"
else
    echo -e "${YELLOW}⚠️  Apple credentials not set - skipping notarization${NC}"
    echo "   Set APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID for notarization"
fi

# Clean previous builds
echo -e "\n${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf dist/

# Build the app
echo -e "\n${BLUE}🔨 Building BitcoinZ Blue...${NC}"
yarn build

# Build with electron-builder using proper signing
echo -e "\n${BLUE}📦 Packaging with Apple Developer signing...${NC}"
npx electron-builder -m \
    -c.extraMetadata.main=build/electron.js \
    -c.mac.identity="$SIGNING_IDENTITY" \
    -c.mac.hardenedRuntime=true \
    -c.mac.gatekeeperAssess=false \
    -c.npmRebuild=false \
    -c.buildDependenciesFromSource=false \
    --publish never

# Verify signatures
echo -e "\n${BLUE}🔍 Verifying signatures...${NC}"
find dist -name "*.app" -type d | while read -r app; do
    echo -e "\n${YELLOW}Checking: $app${NC}"
    
    # Check signature
    if codesign --verify --deep --strict --verbose=2 "$app" 2>&1; then
        echo -e "${GREEN}✅ Signature valid${NC}"
    else
        echo -e "${RED}❌ Signature invalid${NC}"
        exit 1
    fi
    
    # Show signature details
    echo -e "${BLUE}Signature details:${NC}"
    codesign -dv --verbose=4 "$app" 2>&1 | head -10
done

# Check DMG files
find dist -name "*.dmg" -type f | while read -r dmg; do
    echo -e "\n${YELLOW}Checking DMG: $dmg${NC}"
    
    if codesign --verify --verbose=2 "$dmg" 2>&1; then
        echo -e "${GREEN}✅ DMG signature valid${NC}"
    else
        echo -e "${YELLOW}⚠️  DMG not signed (this is normal)${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${BLUE}📁 Output files:${NC}"
ls -la dist/

echo -e "\n${GREEN}✅ Your app is now properly signed with Apple Developer certificate!${NC}"
echo -e "${BLUE}📱 It should no longer trigger virus/malware warnings on macOS.${NC}"
