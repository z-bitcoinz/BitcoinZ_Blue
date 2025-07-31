#!/bin/bash

# Process downloaded Apple Developer certificate

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Processing Apple Developer Certificate${NC}"

# Check for downloaded certificate
CERT_FILE=""
for file in *.cer; do
    if [ -f "$file" ]; then
        CERT_FILE="$file"
        break
    fi
done

if [ -z "$CERT_FILE" ]; then
    echo -e "${RED}❌ No .cer file found in current directory${NC}"
    echo "Please download your Developer ID Application certificate from Apple"
    echo "and place it in this directory, then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Found certificate: $CERT_FILE${NC}"

# Install certificate in keychain
echo -e "${YELLOW}📥 Installing certificate in keychain...${NC}"
security import "$CERT_FILE" -k ~/Library/Keychains/login.keychain-db

# Find the certificate in keychain
echo -e "${YELLOW}🔍 Finding certificate in keychain...${NC}"
CERT_NAME=$(security find-identity -v -p codesigning | grep "Developer ID Application.*Rok Mikuz" | sed -n 's/.*"\(Developer ID Application[^"]*\)".*/\1/p' | head -1)

if [ -z "$CERT_NAME" ]; then
    echo -e "${RED}❌ Certificate not found in keychain${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Certificate found: $CERT_NAME${NC}"

# Export as .p12
echo -e "${YELLOW}📤 Exporting certificate as .p12...${NC}"
echo "You will be prompted to set a password for the .p12 file."
echo "Remember this password - you'll need it for GitHub secrets!"

P12_FILE="apple-developer-certificate.p12"
security export -k ~/Library/Keychains/login.keychain-db -t identities -f pkcs12 -o "$P12_FILE" "$CERT_NAME"

echo -e "${GREEN}✅ Certificate exported: $P12_FILE${NC}"

# Convert to base64
echo -e "${YELLOW}🔄 Converting to base64...${NC}"
base64 -i "$P12_FILE" -o certificate-base64.txt

echo -e "${GREEN}✅ Base64 file created: certificate-base64.txt${NC}"

echo -e "\n${BLUE}📋 GitHub Secrets Information:${NC}"
echo "APPLE_CERTIFICATE_BASE64:"
echo "$(cat certificate-base64.txt)"
echo ""
echo "APPLE_SIGNING_IDENTITY:"
echo "$CERT_NAME"
echo ""
echo "APPLE_TEAM_ID:"
echo "D7PJLSKBT7"
echo ""
echo "APPLE_ID:"
echo "rokmikuz@gmail.com"

echo -e "\n${GREEN}🎉 Certificate processing complete!${NC}"
echo -e "${YELLOW}Next: Add these values to your GitHub repository secrets${NC}"
