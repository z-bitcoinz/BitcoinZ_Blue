#!/bin/bash

# BitcoinZ Blue - Local Code Signing Test Script
# This script helps test code signing locally before pushing to CI/CD

set -e

echo "🔍 BitcoinZ Blue - Code Signing Test"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists codesign; then
    echo -e "${RED}❌ codesign not found. This script must be run on macOS.${NC}"
    exit 1
fi

if ! command_exists security; then
    echo -e "${RED}❌ security command not found.${NC}"
    exit 1
fi

# Find signing identities
echo -e "\n🔑 Available signing identities:"
security find-identity -v -p codesigning | grep -E "Developer ID Application|Apple Development" || {
    echo -e "${YELLOW}⚠️  No Developer ID certificates found${NC}"
    echo "   You can still test with ad-hoc signing"
}

# Check for app
APP_PATH="dist/mac/BitcoinZ Blue.app"
if [ ! -d "$APP_PATH" ]; then
    APP_PATH="dist/mac-arm64/BitcoinZ Blue.app"
    if [ ! -d "$APP_PATH" ]; then
        APP_PATH="dist/mac-x64/BitcoinZ Blue.app"
        if [ ! -d "$APP_PATH" ]; then
            echo -e "${RED}❌ No app found to sign. Please run 'yarn dist:mac' first.${NC}"
            exit 1
        fi
    fi
fi

echo -e "\n📱 Found app: $APP_PATH"

# Ask user for signing method
echo -e "\n🔐 Choose signing method:"
echo "1) Ad-hoc signing (no certificate required)"
echo "2) Developer ID signing (requires certificate)"
echo -n "Enter choice (1 or 2): "
read -r choice

case $choice in
    1)
        echo -e "\n${YELLOW}Using ad-hoc signing...${NC}"
        SIGN_IDENTITY="-"
        ;;
    2)
        echo -e "\n${GREEN}Using Developer ID signing...${NC}"
        echo "Enter your signing identity (e.g., 'Developer ID Application: Your Name (TEAMID)'):"
        read -r SIGN_IDENTITY
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Remove existing signatures and extended attributes
echo -e "\n🧹 Cleaning existing signatures..."
codesign --remove-signature "$APP_PATH" 2>/dev/null || true
xattr -cr "$APP_PATH"

# Sign the app
echo -e "\n✍️  Signing app..."
if [ "$SIGN_IDENTITY" = "-" ]; then
    # Ad-hoc signing
    codesign --force --deep --sign - "$APP_PATH"
else
    # Developer ID signing with hardened runtime
    codesign --force --deep --sign "$SIGN_IDENTITY" \
        --options runtime \
        --entitlements configs/entitlements.mac.plist \
        "$APP_PATH"
fi

# Verify the signature
echo -e "\n🔍 Verifying signature..."
if codesign --verify --deep --strict --verbose=2 "$APP_PATH"; then
    echo -e "${GREEN}✅ Signature verification passed${NC}"
else
    echo -e "${RED}❌ Signature verification failed${NC}"
    exit 1
fi

# Display signature info
echo -e "\n📋 Signature details:"
codesign -dv --verbose=4 "$APP_PATH" 2>&1 | grep -E "Authority|TeamIdentifier|Signature|Info.plist"

# Check Gatekeeper
echo -e "\n🛡️  Checking Gatekeeper assessment..."
if [ "$SIGN_IDENTITY" != "-" ]; then
    if spctl -a -t exec -vvv "$APP_PATH" 2>&1 | grep -q "accepted"; then
        echo -e "${GREEN}✅ Gatekeeper check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Gatekeeper check failed (app may need notarization)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Gatekeeper check (ad-hoc signed apps are not accepted)${NC}"
fi

# Test DMG creation if requested
echo -e "\n📦 Do you want to create and sign a DMG? (y/n)"
read -r create_dmg

if [ "$create_dmg" = "y" ]; then
    DMG_PATH="dist/BitcoinZ-Blue-test.dmg"
    
    echo "Creating DMG..."
    if [ -f "scripts/create-dmg.sh" ]; then
        # Use existing script
        ./scripts/create-dmg.sh
    else
        # Simple DMG creation
        hdiutil create -volname "BitcoinZ Blue" -srcfolder "$APP_PATH" -ov -format UDZO "$DMG_PATH"
    fi
    
    if [ -f "$DMG_PATH" ] && [ "$SIGN_IDENTITY" != "-" ]; then
        echo "Signing DMG..."
        codesign --force --sign "$SIGN_IDENTITY" "$DMG_PATH"
        
        echo -e "\n🔍 Verifying DMG signature..."
        codesign -dv --verbose=4 "$DMG_PATH"
    fi
fi

echo -e "\n✨ ${GREEN}Code signing test complete!${NC}"

# Provide next steps
echo -e "\n📋 Next steps:"
if [ "$SIGN_IDENTITY" = "-" ]; then
    echo "• Your app is ad-hoc signed (suitable for local testing)"
    echo "• To distribute, you'll need a Developer ID certificate"
else
    echo "• Your app is signed with Developer ID"
    echo "• For distribution, you should notarize the app"
    echo "• Use 'xcrun notarytool submit' to notarize"
fi

echo -e "\n🔗 Resources:"
echo "• Apple Code Signing: https://developer.apple.com/support/code-signing/"
echo "• Notarization: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution"