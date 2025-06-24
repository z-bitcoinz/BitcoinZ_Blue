#!/bin/bash

# VirusTotal Security Scan for BitcoinZ Blue
# Scans all release files with multiple antivirus engines

set -e

echo "🛡️  Starting VirusTotal security scan..."

# Check if API key is provided
if [ -z "$VIRUSTOTAL_API_KEY" ]; then
    echo "⚠️  VIRUSTOTAL_API_KEY not set. Skipping VirusTotal scan."
    echo "   Get a free API key at: https://www.virustotal.com/gui/join-us"
    exit 0
fi

DIST_DIR="dist"
VT_API="https://www.virustotal.com/vtapi/v2"

cd "$DIST_DIR"

# Function to upload and scan file
scan_file() {
    local file="$1"
    echo "🔍 Scanning: $file"
    
    # Upload file to VirusTotal
    response=$(curl -s -X POST "$VT_API/file/scan" \
        -F "apikey=$VIRUSTOTAL_API_KEY" \
        -F "file=@$file")
    
    # Extract scan ID
    scan_id=$(echo "$response" | grep -o '"scan_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$scan_id" ]; then
        echo "   📤 Uploaded. Scan ID: $scan_id"
        
        # Wait for scan to complete
        echo "   ⏳ Waiting for scan results..."
        sleep 30
        
        # Get scan results
        result=$(curl -s -X POST "$VT_API/file/report" \
            -d "apikey=$VIRUSTOTAL_API_KEY" \
            -d "resource=$scan_id")
        
        # Parse results
        positives=$(echo "$result" | grep -o '"positives":[0-9]*' | cut -d':' -f2)
        total=$(echo "$result" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        permalink=$(echo "$result" | grep -o '"permalink":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$positives" = "0" ]; then
            echo "   ✅ Clean: $file (0/$total detections)"
        else
            echo "   ⚠️  Detections: $file ($positives/$total)"
            echo "   🔗 Report: $permalink"
        fi
        
        # Save detailed report
        echo "$result" > "${file}.virustotal.json"
        echo "   📄 Detailed report saved: ${file}.virustotal.json"
    else
        echo "   ❌ Upload failed for: $file"
    fi
    
    echo ""
}

# Scan all release files
ARTIFACTS=(
    "BitcoinZ Blue Setup 1.0.0.exe"
    "BitcoinZ Blue-1.0.0-win.zip"
    "BitcoinZ Blue-1.0.0-arm64-mac.zip"
    "BitcoinZ Blue-1.0.0-x64-mac.zip"
    "BitcoinZ Blue-1.0.0.AppImage"
    "bitcoinz-wallet-lite_1.0.0_amd64.deb"
)

echo "🔍 Scanning ${#ARTIFACTS[@]} files with VirusTotal..."
echo ""

for artifact in "${ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        scan_file "$artifact"
    else
        echo "⚠️  File not found: $artifact"
    fi
done

# Create summary report
cat > virustotal-summary.md << EOF
# VirusTotal Security Scan Results

## BitcoinZ Blue v1.0.0 Security Report

**Scan Date:** $(date)
**Scanner:** VirusTotal (70+ antivirus engines)

### Results Summary

| File | Status | Detections | Report |
|------|--------|------------|--------|
EOF

for artifact in "${ARTIFACTS[@]}"; do
    if [ -f "$artifact" ] && [ -f "${artifact}.virustotal.json" ]; then
        positives=$(grep -o '"positives":[0-9]*' "${artifact}.virustotal.json" | cut -d':' -f2)
        total=$(grep -o '"total":[0-9]*' "${artifact}.virustotal.json" | cut -d':' -f2)
        permalink=$(grep -o '"permalink":"[^"]*"' "${artifact}.virustotal.json" | cut -d'"' -f4)
        
        if [ "$positives" = "0" ]; then
            status="✅ Clean"
        else
            status="⚠️ $positives detections"
        fi
        
        echo "| $artifact | $status | $positives/$total | [View Report]($permalink) |" >> virustotal-summary.md
    fi
done

cat >> virustotal-summary.md << EOF

### Security Notes

- **Clean files** have 0 detections from all antivirus engines
- **False positives** may occur with unsigned executables
- **All files** are built from open source code available on GitHub
- **Verification** is available through Sigstore signatures

### Verification Commands

\`\`\`bash
# Verify Sigstore signatures
./verify-signatures.sh

# Check file hashes
sha256sum *.{exe,zip,AppImage,deb}
\`\`\`

---
*Report generated automatically by BitcoinZ Blue security pipeline*
EOF

echo "🎉 VirusTotal scan complete!"
echo "📊 Summary report: virustotal-summary.md"
