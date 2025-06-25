#!/bin/bash

# BitcoinZ Blue Quick Local Build Script
# Builds for all platforms without prompts

set -e

echo "🚀 BitcoinZ Blue Quick Build - All Platforms"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Clean
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf dist build

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
yarn install

# Build native module
echo -e "${YELLOW}Building native module...${NC}"
yarn neon

# Build app
echo -e "${YELLOW}Building application...${NC}"
yarn build

# Copy native module
if [ -f "src/native.node" ]; then
    cp src/native.node build/
fi

# Set signing environment variables
export CSC_IDENTITY_AUTO_DISCOVERY=false
export CSC_LINK=""
export CSC_KEY_PASSWORD=""
export CODESIGN_IDENTITY="-"
export ELECTRON_BUILDER_SKIP_REBUILD=true

# Build for macOS
echo -e "${GREEN}🍎 Building for macOS...${NC}"
npx electron-builder -m \
    -c.mac.identity=null \
    -c.mac.type=distribution \
    -c.npmRebuild=false \
    -c.buildDependenciesFromSource=false \
    -c.extraMetadata.main=build/electron.js \
    --publish never

# Apply ad-hoc signing
find dist -name "*.app" -type d | while read -r app; do
    echo "Signing: $app"
    codesign --force --deep --sign - "$app"
    xattr -cr "$app"
done

# Build for Windows
echo -e "${GREEN}🪟 Building for Windows...${NC}"
npx electron-builder -w \
    -c.npmRebuild=false \
    -c.buildDependenciesFromSource=false \
    -c.extraMetadata.main=build/electron.js \
    --publish never

# Build for Linux
echo -e "${GREEN}🐧 Building for Linux...${NC}"
npx electron-builder -l \
    -c.npmRebuild=false \
    -c.buildDependenciesFromSource=false \
    -c.extraMetadata.main=build/electron.js \
    --publish never

# Show results
echo -e "${GREEN}🎉 Build Complete!${NC}"
echo ""
echo "Built artifacts:"
ls -la dist/

echo ""
echo -e "${YELLOW}Files created:${NC}"
echo "• macOS: BitcoinZ Blue-*-mac.zip"
echo "• Windows: BitcoinZ Blue Setup *.exe"
echo "• Linux: BitcoinZ Blue-*.AppImage, *.deb"
