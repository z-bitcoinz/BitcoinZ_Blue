#!/bin/bash

echo "🔐 Simple Certificate Password Test"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check certificate file
CERT_FILE="apple-certificates/apple-developer-certificate.p12"

if [ ! -f "$CERT_FILE" ]; then
    echo -e "${RED}❌ Certificate not found at: $CERT_FILE${NC}"
    exit 1
fi

echo "📄 Certificate found: $CERT_FILE"
echo "   Size: $(ls -lh "$CERT_FILE" | awk '{print $5}')"
echo ""

echo "🔑 Let's test different passwords..."
echo ""

# Test function
test_password() {
    local password="$1"
    local desc="$2"
    
    printf "Testing: %-30s ... " "$desc"
    
    # Try to get info about the certificate
    if openssl pkcs12 -in "$CERT_FILE" -passin "pass:$password" -info -noout 2>/dev/null; then
        echo -e "${GREEN}✅ CORRECT PASSWORD!${NC}"
        echo ""
        echo -e "${GREEN}Found the correct password: $password${NC}"
        echo ""
        echo "📝 Next steps:"
        echo "1. Update APPLE_CERTIFICATE_PASSWORD secret to: $password"
        echo "2. Re-run the GitHub Actions workflow"
        return 0
    else
        echo -e "${RED}❌ Wrong${NC}"
        return 1
    fi
}

# Test the provided password
test_password "Bitcoinz1234" "Bitcoinz1234" && exit 0

# Test common variations
echo ""
echo "Testing common variations..."
test_password "bitcoinz1234" "bitcoinz1234 (lowercase)" && exit 0
test_password "BITCOINZ1234" "BITCOINZ1234 (uppercase)" && exit 0
test_password "BitcoinZ1234" "BitcoinZ1234 (capital Z)" && exit 0
test_password "Bitcoinz@1234" "Bitcoinz@1234 (with @)" && exit 0
test_password "Bitcoinz#1234" "Bitcoinz#1234 (with #)" && exit 0
test_password "Bitcoinz!1234" "Bitcoinz!1234 (with !)" && exit 0

echo ""
echo -e "${YELLOW}⚠️  Could not find the correct password${NC}"
echo ""
echo "The certificate was exported with a different password than 'Bitcoinz1234'"
echo ""
echo "Options:"
echo "1. Re-export the certificate from Keychain Access with password: Bitcoinz1234"
echo "2. Or remember the actual password you used and update the GitHub secret"
echo ""
echo "To re-export:"
echo "1. Open Keychain Access"
echo "2. Find: Developer ID Application: Rok Mikuz (D7PJLSKBT7)"
echo "3. Right-click → Export"
echo "4. Use password: Bitcoinz1234"
echo "5. Save as: apple-certificates/apple-developer-certificate.p12"