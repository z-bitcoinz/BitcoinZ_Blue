#!/bin/bash

# Apple Developer Certificate Signing Request (CSR) Generator
# This script creates a CSR for Developer ID Application certificate

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Apple Developer CSR Generator${NC}"
echo "=================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Your Apple Developer information
APPLE_ID="rokmikuz@gmail.com"
COMMON_NAME="Rok Mikuz"
TEAM_ID="D7PJLSKBT7"
ORG_NAME="BitcoinZ Blue"

echo -e "${YELLOW}📋 Using your Apple Developer information:${NC}"
echo "   Apple ID: $APPLE_ID"
echo "   Name: $COMMON_NAME"
echo "   Team ID: $TEAM_ID"
echo "   Organization: $ORG_NAME"

# Create output directory
OUTPUT_DIR="apple-certificates"
mkdir -p "$OUTPUT_DIR"

echo -e "\n${BLUE}🔑 Generating private key and CSR...${NC}"

# Generate private key
PRIVATE_KEY="$OUTPUT_DIR/private-key.pem"
openssl genrsa -out "$PRIVATE_KEY" 2048

echo -e "${GREEN}✅ Private key generated: $PRIVATE_KEY${NC}"

# Create CSR configuration file
CSR_CONFIG="$OUTPUT_DIR/csr.conf"
cat > "$CSR_CONFIG" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = $COMMON_NAME
emailAddress = $APPLE_ID
O = $ORG_NAME
C = US

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = codeSigning
EOF

# Generate CSR
CSR_FILE="$OUTPUT_DIR/CertificateSigningRequest.certSigningRequest"
openssl req -new -key "$PRIVATE_KEY" -out "$CSR_FILE" -config "$CSR_CONFIG"

echo -e "${GREEN}✅ Certificate Signing Request generated: $CSR_FILE${NC}"

# Display CSR information
echo -e "\n${BLUE}📋 CSR Information:${NC}"
openssl req -in "$CSR_FILE" -text -noout | grep -A 5 "Subject:"

echo -e "\n${GREEN}🎉 CSR Generation Complete!${NC}"
echo -e "${YELLOW}📁 Files created in: $OUTPUT_DIR/${NC}"
echo "   - Private key: private-key.pem"
echo "   - CSR file: CertificateSigningRequest.certSigningRequest"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Upload the CSR file to Apple Developer Portal:"
echo "   https://developer.apple.com/account/resources/certificates/add"
echo ""
echo "2. Select 'Developer ID Application' certificate type"
echo ""
echo "3. Upload this file:"
echo "   $(pwd)/$CSR_FILE"
echo ""
echo "4. Download the certificate and run the next script"

# Create certificate processing script
PROCESS_SCRIPT="$OUTPUT_DIR/process-certificate.sh"
cat > "$PROCESS_SCRIPT" << 'EOF'
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
EOF

chmod +x "$PROCESS_SCRIPT"

echo -e "\n${GREEN}📝 Created certificate processing script: $PROCESS_SCRIPT${NC}"
echo -e "${YELLOW}Run this script after downloading your certificate from Apple${NC}"

# Open the directory in Finder
open "$OUTPUT_DIR"

echo -e "\n${BLUE}🚀 Ready! The CSR file is ready to upload to Apple Developer Portal.${NC}"
