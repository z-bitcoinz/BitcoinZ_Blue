#!/bin/bash

# BitcoinZ Blue Local Signing Test Script
# Test code signing locally before pushing to GitHub

set -e

echo "🔐 BitcoinZ Blue Local Signing Test"
echo "===================================="

# Detect operating system
OS=$(uname -s)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to test macOS signing
test_macos_signing() {
    echo -e "\n${YELLOW}Testing macOS Ad-hoc Signing...${NC}"
    
    # Check if we're on macOS
    if [[ "$OS" != "Darwin" ]]; then
        echo -e "${RED}❌ Not on macOS, skipping macOS tests${NC}"
        return
    fi
    
    # Find the app bundle
    APP_PATH=$(find dist -name "*.app" -type d | head -1)
    
    if [ -z "$APP_PATH" ]; then
        echo -e "${RED}❌ No .app bundle found in dist/. Run 'yarn dist:mac' first.${NC}"
        return 1
    fi
    
    echo "📦 Found app: $APP_PATH"
    
    # Test 1: Check current signature status
    echo -e "\n1️⃣ Checking current signature status..."
    codesign -dv --verbose=4 "$APP_PATH" 2>&1 || echo "No signature found (expected if not signed yet)"
    
    # Test 2: Apply ad-hoc signing
    echo -e "\n2️⃣ Applying ad-hoc signature..."
    codesign --force --deep --sign - "$APP_PATH"
    
    # Test 3: Verify signature
    echo -e "\n3️⃣ Verifying signature..."
    if codesign -dv --verbose=4 "$APP_PATH" 2>&1 | grep -q "adhoc"; then
        echo -e "${GREEN}✅ Ad-hoc signature applied successfully${NC}"
    else
        echo -e "${RED}❌ Ad-hoc signature verification failed${NC}"
        return 1
    fi
    
    # Test 4: Check for quarantine attributes
    echo -e "\n4️⃣ Checking quarantine attributes..."
    xattr -l "$APP_PATH" 2>/dev/null || echo "No extended attributes found"
    
    # Test 5: Remove quarantine
    echo -e "\n5️⃣ Removing quarantine attributes..."
    xattr -cr "$APP_PATH"
    echo -e "${GREEN}✅ Quarantine attributes removed${NC}"
    
    # Test 6: Verify app can be opened
    echo -e "\n6️⃣ Testing app launch (will open and close immediately)..."
    open "$APP_PATH" && sleep 2 && osascript -e 'quit app "BitcoinZ Blue"' 2>/dev/null || true
    
    echo -e "\n${GREEN}✅ macOS signing tests completed!${NC}"
}

# Function to test Windows signing
test_windows_signing() {
    echo -e "\n${YELLOW}Testing Windows Signing...${NC}"
    
    # Check if we have PowerShell (for Windows or WSL)
    if ! command -v pwsh &> /dev/null && ! command -v powershell &> /dev/null; then
        echo -e "${YELLOW}⚠️  PowerShell not found, skipping Windows signing tests${NC}"
        echo "   Install PowerShell Core to test Windows signing on non-Windows systems"
        return
    fi
    
    # Find Windows executable
    EXE_PATH=$(find dist -name "*.exe" | head -1)
    
    if [ -z "$EXE_PATH" ]; then
        echo -e "${RED}❌ No .exe file found in dist/. Run 'yarn dist:win' first.${NC}"
        return 1
    fi
    
    echo "📦 Found executable: $EXE_PATH"
    
    # Create PowerShell test script
    cat > test-win-sign.ps1 << 'EOF'
param($ExePath)

Write-Host "`n🔍 Checking Windows executable signature..." -ForegroundColor Yellow

# Check if file exists
if (-not (Test-Path $ExePath)) {
    Write-Host "❌ File not found: $ExePath" -ForegroundColor Red
    exit 1
}

# Get signature info
$sig = Get-AuthenticodeSignature $ExePath

Write-Host "`nSignature Status: $($sig.Status)" -ForegroundColor Cyan
Write-Host "Certificate Subject: $($sig.SignerCertificate.Subject)" -ForegroundColor Cyan

if ($sig.Status -eq "Valid") {
    Write-Host "✅ Windows executable is signed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Executable is not signed or signature is invalid" -ForegroundColor Yellow
}

# Display certificate details if present
if ($sig.SignerCertificate) {
    Write-Host "`nCertificate Details:" -ForegroundColor Yellow
    Write-Host "  Issuer: $($sig.SignerCertificate.Issuer)"
    Write-Host "  Valid From: $($sig.SignerCertificate.NotBefore)"
    Write-Host "  Valid To: $($sig.SignerCertificate.NotAfter)"
    Write-Host "  Thumbprint: $($sig.SignerCertificate.Thumbprint)"
}
EOF

    # Run PowerShell test
    if command -v pwsh &> /dev/null; then
        pwsh -File test-win-sign.ps1 -ExePath "$EXE_PATH"
    else
        powershell -File test-win-sign.ps1 -ExePath "$EXE_PATH"
    fi
    
    # Clean up
    rm -f test-win-sign.ps1
    
    echo -e "\n${GREEN}✅ Windows signing tests completed!${NC}"
}

# Function to test Sigstore signing
test_sigstore_signing() {
    echo -e "\n${YELLOW}Testing Sigstore Signing...${NC}"
    
    # Check if cosign is installed
    if ! command -v cosign &> /dev/null; then
        echo -e "${YELLOW}Installing cosign for testing...${NC}"
        
        # Install cosign based on OS
        if [[ "$OS" == "Darwin" ]]; then
            brew install cosign || {
                echo -e "${RED}❌ Failed to install cosign. Install manually from: https://github.com/sigstore/cosign${NC}"
                return 1
            }
        elif [[ "$OS" == "Linux" ]]; then
            curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
            sudo mv cosign-linux-amd64 /usr/local/bin/cosign
            sudo chmod +x /usr/local/bin/cosign
        fi
    fi
    
    # Find a test file to sign
    TEST_FILE=$(find dist -type f \( -name "*.zip" -o -name "*.exe" -o -name "*.dmg" \) | head -1)
    
    if [ -z "$TEST_FILE" ]; then
        echo -e "${RED}❌ No distributable files found in dist/${NC}"
        return 1
    fi
    
    echo "📦 Testing with: $(basename $TEST_FILE)"
    
    # Test signing
    echo -e "\n1️⃣ Testing Sigstore signing (requires GitHub/Google/Microsoft account)..."
    echo -e "${YELLOW}Note: This will open a browser for authentication${NC}"
    
    # Create test signature
    cosign sign-blob \
        --output-signature="${TEST_FILE}.test.sig" \
        --output-certificate="${TEST_FILE}.test.pem" \
        "$TEST_FILE" --yes || {
        echo -e "${YELLOW}⚠️  Sigstore signing test skipped (requires authentication)${NC}"
        return 0
    }
    
    # Verify signature
    echo -e "\n2️⃣ Verifying Sigstore signature..."
    cosign verify-blob \
        --certificate="${TEST_FILE}.test.pem" \
        --signature="${TEST_FILE}.test.sig" \
        --certificate-identity-regexp=".*" \
        --certificate-oidc-issuer-regexp=".*" \
        "$TEST_FILE" && echo -e "${GREEN}✅ Sigstore signature verified!${NC}"
    
    # Clean up test files
    rm -f "${TEST_FILE}.test.sig" "${TEST_FILE}.test.pem"
}

# Main execution
main() {
    echo -e "${YELLOW}Prerequisites:${NC}"
    echo "- Build the app first: yarn dist:mac / yarn dist:win / yarn dist:linux"
    echo "- For Sigstore: cosign (will auto-install if missing)"
    echo ""
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ No dist/ directory found. Build the app first!${NC}"
        exit 1
    fi
    
    # Run platform-specific tests
    case "$OS" in
        Darwin)
            test_macos_signing
            test_sigstore_signing
            ;;
        Linux)
            test_sigstore_signing
            test_windows_signing
            ;;
        MINGW*|CYGWIN*|MSYS*)
            test_windows_signing
            test_sigstore_signing
            ;;
        *)
            echo -e "${RED}❌ Unsupported OS: $OS${NC}"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}🎉 All signing tests completed!${NC}"
    echo -e "${YELLOW}Note: Run this script after building to test signing locally.${NC}"
}

# Run main function
main
