#!/bin/bash

# Sigstore Code Signing Script for BitcoinZ Blue
# Provides free, transparent code signing for open source projects

set -e

echo "🔒 Starting Sigstore code signing process..."

# Install cosign (Sigstore's signing tool)
if ! command -v cosign &> /dev/null; then
    echo "Installing cosign..."
    curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
    sudo mv cosign-linux-amd64 /usr/local/bin/cosign
    sudo chmod +x /usr/local/bin/cosign
fi

# Sign all release artifacts
DIST_DIR="dist"
ARTIFACTS=(
    "BitcoinZ Blue Setup 1.0.0.exe"
    "BitcoinZ Blue-1.0.0-win.zip"
    "BitcoinZ Blue-1.0.0-arm64-mac.zip"
    "BitcoinZ Blue-1.0.0-x64-mac.zip"
    "BitcoinZ Blue-1.0.0.AppImage"
    "bitcoinz-wallet-lite_1.0.0_amd64.deb"
)

cd "$DIST_DIR"

for artifact in "${ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        echo "🔐 Signing: $artifact"
        
        # Sign with Sigstore (keyless signing)
        cosign sign-blob \
            --output-signature="${artifact}.sig" \
            --output-certificate="${artifact}.pem" \
            "$artifact"
            
        # Generate SLSA provenance
        cosign attest \
            --predicate=<(echo '{"buildType":"https://github.com/z-bitcoinz/BitcoinZ_Blue"}') \
            --type=slsaprovenance \
            "$artifact"
            
        echo "✅ Signed: $artifact"
        echo "   Signature: ${artifact}.sig"
        echo "   Certificate: ${artifact}.pem"
    else
        echo "⚠️  File not found: $artifact"
    fi
done

# Create verification script for users
cat > verify-signatures.sh << 'EOF'
#!/bin/bash

# BitcoinZ Blue Signature Verification Script
# Verifies Sigstore signatures for downloaded files

echo "🔍 Verifying BitcoinZ Blue signatures..."

# Install cosign if not present
if ! command -v cosign &> /dev/null; then
    echo "Installing cosign for verification..."
    curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
    sudo mv cosign-linux-amd64 /usr/local/bin/cosign
    sudo chmod +x /usr/local/bin/cosign
fi

# Verify each file
for file in *.{exe,zip,AppImage,deb}; do
    if [ -f "$file" ] && [ -f "${file}.sig" ] && [ -f "${file}.pem" ]; then
        echo "🔐 Verifying: $file"
        
        if cosign verify-blob \
            --certificate="${file}.pem" \
            --signature="${file}.sig" \
            --certificate-identity-regexp=".*" \
            --certificate-oidc-issuer-regexp=".*" \
            "$file"; then
            echo "✅ Valid signature: $file"
        else
            echo "❌ Invalid signature: $file"
        fi
    fi
done

echo "🎉 Verification complete!"
EOF

chmod +x verify-signatures.sh

echo "🎉 Sigstore signing complete!"
echo ""
echo "📋 Files signed:"
for artifact in "${ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        echo "  ✅ $artifact"
        echo "     📝 ${artifact}.sig"
        echo "     📜 ${artifact}.pem"
    fi
done

echo ""
echo "🔍 Users can verify signatures with:"
echo "   ./verify-signatures.sh"
echo ""
echo "📖 Learn more about Sigstore: https://sigstore.dev"
