#!/bin/bash

# Test Apple Developer Certificate Import
# This script helps verify your certificate and password work correctly

echo "🔐 Apple Certificate Test Script"
echo "================================"
echo ""

# Check if certificate exists
if [ ! -f "apple-certificates/apple-developer-certificate.p12" ]; then
    echo "❌ Certificate not found at: apple-certificates/apple-developer-certificate.p12"
    echo ""
    echo "Please ensure you have exported your certificate to this location."
    exit 1
fi

echo "✅ Found certificate file"

# Test the certificate password
echo ""
echo "🔑 Testing certificate with password..."
echo "   Password: Bitcoinz1234"

# Create a temporary keychain for testing
TEMP_KEYCHAIN="test-temp.keychain"
TEMP_KEYCHAIN_PWD="temp123"

# Remove temp keychain if it exists
security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null || true

# Create temporary keychain
echo "📦 Creating temporary keychain..."
security create-keychain -p "$TEMP_KEYCHAIN_PWD" "$TEMP_KEYCHAIN"

# Try to import the certificate
echo "🔄 Attempting to import certificate..."
if security import "apple-certificates/apple-developer-certificate.p12" \
    -P "Bitcoinz1234" \
    -k "$TEMP_KEYCHAIN" \
    -T /usr/bin/codesign \
    -T /usr/bin/security 2>&1; then
    
    echo "✅ Certificate imported successfully!"
    
    # List the imported identity
    echo ""
    echo "📋 Certificate details:"
    security find-identity -v -p codesigning "$TEMP_KEYCHAIN"
    
else
    echo "❌ Failed to import certificate!"
    echo ""
    echo "Possible issues:"
    echo "1. Wrong password (current: Bitcoinz1234)"
    echo "2. Corrupted certificate file"
    echo "3. Certificate doesn't include private key"
    echo ""
    echo "Try re-exporting from Keychain Access with the correct password."
fi

# Test base64 encoding
echo ""
echo "🔄 Testing base64 encoding..."

# Create base64 version
base64 -i "apple-certificates/apple-developer-certificate.p12" -o "test-base64.txt"

# Decode it back
base64 --decode -i "test-base64.txt" -o "test-decoded.p12"

# Compare files
if cmp -s "apple-certificates/apple-developer-certificate.p12" "test-decoded.p12"; then
    echo "✅ Base64 encoding/decoding works correctly"
    
    # Show the first few characters of base64 (safe to display)
    echo ""
    echo "📄 Base64 preview (first 100 chars):"
    head -c 100 "test-base64.txt"
    echo "..."
else
    echo "❌ Base64 encoding/decoding mismatch!"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null || true
rm -f "test-base64.txt" "test-decoded.p12"

echo ""
echo "✨ Test complete!"
echo ""
echo "📝 Next steps:"
echo "1. If import failed, re-export your certificate with password: Bitcoinz1234"
echo "2. Make sure APPLE_CERTIFICATE_PASSWORD secret is set to: Bitcoinz1234"
echo "3. Copy the contents of apple-certificate-base64.txt to APPLE_CERTIFICATE_BASE64 secret"