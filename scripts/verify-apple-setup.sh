#!/bin/bash

# BitcoinZ Blue - Apple Developer Setup Verification Script
# This script helps verify your Apple Developer setup for code signing

echo "🍎 Apple Developer Setup Verification"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

echo "📋 Checking local certificate setup..."
echo ""

# Check for Developer ID certificates
echo "🔍 Looking for Developer ID certificates in keychain..."
CERTS=$(security find-identity -v -p codesigning | grep "Developer ID Application")

if [ -z "$CERTS" ]; then
    echo -e "${RED}❌ No Developer ID Application certificate found${NC}"
    echo ""
    echo "To create one:"
    echo "1. Go to https://developer.apple.com/account/resources/certificates"
    echo "2. Click '+' to create new certificate"
    echo "3. Select 'Developer ID Application'"
    echo "4. Follow the instructions to create and download"
    echo ""
else
    echo -e "${GREEN}✅ Found Developer ID certificate(s):${NC}"
    echo "$CERTS"
    echo ""
    
    # Extract the first certificate hash
    CERT_HASH=$(echo "$CERTS" | head -1 | awk '{print $2}')
    CERT_NAME=$(echo "$CERTS" | head -1 | awk -F'"' '{print $2}')
    
    echo "📌 Recommended for APPLE_SIGNING_IDENTITY secret:"
    echo -e "${GREEN}   $CERT_HASH${NC}"
    echo "   (This is the certificate hash - use this to avoid GitHub masking)"
    echo ""
fi

# Check if certificate is exportable
echo "📦 Checking if certificate can be exported..."
if [ -n "$CERT_NAME" ]; then
    # Try to find in login keychain
    if security find-certificate -c "$CERT_NAME" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Certificate found in keychain${NC}"
        
        echo ""
        echo "📝 To export your certificate:"
        echo "1. Open Keychain Access"
        echo "2. Find: $CERT_NAME"
        echo "3. Right-click → Export"
        echo "4. Save as: apple-certificate.p12"
        echo "5. Set a password (remember it for APPLE_CERTIFICATE_PASSWORD)"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Certificate may need to be imported to keychain${NC}"
    fi
fi

# Check for existing p12 file
if [ -f "apple-certificate.p12" ]; then
    echo -e "${GREEN}✅ Found apple-certificate.p12${NC}"
    
    # Convert to base64
    echo "🔄 Converting to base64..."
    base64 -i apple-certificate.p12 -o apple-certificate-base64.txt
    
    if [ -f "apple-certificate-base64.txt" ]; then
        echo -e "${GREEN}✅ Created apple-certificate-base64.txt${NC}"
        echo ""
        echo "📋 Use the contents of this file for APPLE_CERTIFICATE_BASE64 secret"
    fi
else
    echo -e "${YELLOW}⚠️  No apple-certificate.p12 found${NC}"
    echo "   Export your certificate from Keychain Access first"
fi

echo ""
echo "🔑 GitHub Secrets Checklist:"
echo "=============================="
echo ""
echo "Add these to: Settings → Secrets and variables → Actions"
echo ""

# Create a checklist
echo "Required secrets:"
echo "  [ ] APPLE_CERTIFICATE_BASE64 - Contents of apple-certificate-base64.txt"
echo "  [ ] APPLE_CERTIFICATE_PASSWORD - Password you set when exporting .p12"
echo "  [ ] APPLE_ID - Your Apple ID email (e.g., you@example.com)"
echo "  [ ] APPLE_ID_PASSWORD - App-specific password from appleid.apple.com"
echo "  [ ] APPLE_TEAM_ID - Your team ID: D7PJLSKBT7"
echo ""
echo "Optional:"
echo "  [ ] APPLE_SIGNING_IDENTITY - Certificate hash: $CERT_HASH (auto-discovered if not set)"

echo ""
echo "📱 To create an app-specific password:"
echo "1. Go to https://appleid.apple.com"
echo "2. Sign in with your Apple ID"
echo "3. Go to 'Sign-In and Security' → 'App-Specific Passwords'"
echo "4. Click 'Generate Password'"
echo "5. Name it: 'BitcoinZ Blue Notarization'"
echo "6. Copy the generated password for APPLE_ID_PASSWORD secret"

echo ""
echo "🎯 Next Steps:"
echo "1. Ensure all certificates are properly exported"
echo "2. Add all secrets to GitHub"
echo "3. Push code and check the build logs"
echo ""

# Test signing locally
if [ -n "$CERT_NAME" ]; then
    echo "🧪 Testing local code signing..."
    
    # Create a test file
    echo '#!/bin/bash\necho "test"' > test-sign.sh
    chmod +x test-sign.sh
    
    # Try to sign it
    if codesign --sign "$CERT_NAME" test-sign.sh 2>/dev/null; then
        echo -e "${GREEN}✅ Local code signing works!${NC}"
        codesign -dv test-sign.sh 2>&1 | grep -E "Identifier=|Authority=|TeamIdentifier="
    else
        echo -e "${RED}❌ Local code signing failed${NC}"
        echo "   Make sure your certificate has private key access"
    fi
    
    # Cleanup
    rm -f test-sign.sh
fi

echo ""
echo "✨ Verification complete!"