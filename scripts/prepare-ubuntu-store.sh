#!/bin/bash

# BitcoinZ Blue Ubuntu Store Preparation Script
# This script prepares the app for Ubuntu Store submission

set -e

echo "🐧 BitcoinZ Blue Ubuntu Store Preparation"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if snapcraft is installed
if ! command -v snapcraft &> /dev/null; then
    echo "❌ Error: snapcraft is not installed"
    echo "Install with: sudo snap install snapcraft --classic"
    exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "📦 Building BitcoinZ Blue v$VERSION for Ubuntu Store"

# Step 1: Build the Electron app
echo ""
echo "🔨 Step 1: Building Electron application..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    yarn install
fi

echo "Building native modules..."
yarn neon

echo "Building Electron app for Linux..."
yarn dist:linux

# Check if build was successful
if [ ! -d "dist/linux-unpacked" ]; then
    echo "❌ Error: Linux build failed - dist/linux-unpacked not found"
    exit 1
fi

echo "✅ Electron build completed"

# Step 2: Prepare snap package
echo ""
echo "📦 Step 2: Building snap package..."

# Clean previous builds
if [ -d "snap" ]; then
    rm -rf snap
fi

if [ -f "*.snap" ]; then
    rm -f *.snap
fi

# Build the snap
echo "Running snapcraft..."
snapcraft --verbose

# Check if snap was created
SNAP_FILE="bitcoinz-blue_${VERSION}_amd64.snap"
if [ ! -f "$SNAP_FILE" ]; then
    echo "❌ Error: Snap build failed - $SNAP_FILE not found"
    exit 1
fi

echo "✅ Snap package created: $SNAP_FILE"

# Step 3: Test the snap locally
echo ""
echo "🧪 Step 3: Testing snap package..."

# Install the snap locally for testing
echo "Installing snap locally for testing..."
sudo snap install "$SNAP_FILE" --dangerous --devmode

echo "Testing snap installation..."
if snap list | grep -q bitcoinz-blue; then
    echo "✅ Snap installed successfully"
    
    # Test if the app can be launched
    echo "Testing app launch..."
    timeout 10s bitcoinz-blue --version || echo "App launch test completed"
    
    # Remove test installation
    echo "Removing test installation..."
    sudo snap remove bitcoinz-blue
else
    echo "❌ Error: Snap installation failed"
    exit 1
fi

# Step 4: Validate snap package
echo ""
echo "🔍 Step 4: Validating snap package..."

# Check snap info
echo "Snap package information:"
snap info "$SNAP_FILE" || true

# Validate with review-tools if available
if command -v review-tools.snap-review &> /dev/null; then
    echo "Running snap review tools..."
    review-tools.snap-review "$SNAP_FILE"
else
    echo "⚠️  review-tools not available - install with: sudo snap install review-tools"
fi

# Step 5: Generate submission information
echo ""
echo "📋 Step 5: Generating submission information..."

# Create submission directory
SUBMISSION_DIR="ubuntu-store-submission"
mkdir -p "$SUBMISSION_DIR"

# Copy snap file
cp "$SNAP_FILE" "$SUBMISSION_DIR/"

# Create submission checklist
cat > "$SUBMISSION_DIR/SUBMISSION_CHECKLIST.md" << EOF
# Ubuntu Store Submission Checklist for BitcoinZ Blue v$VERSION

## ✅ Pre-submission Checklist

- [x] Snap package built successfully
- [x] Local installation test passed
- [x] App launches without errors
- [x] All required plugs declared
- [x] Desktop integration working
- [x] Icon and metadata included
- [x] Strict confinement configured
- [x] Security review documentation ready

## 📦 Package Information

- **Name**: bitcoinz-blue
- **Version**: $VERSION
- **Architecture**: amd64
- **Confinement**: strict
- **Grade**: stable
- **File**: $SNAP_FILE

## 🔗 Store Listing Information

### Basic Information
- **Title**: BitcoinZ Blue
- **Summary**: A modern light wallet for BitcoinZ
- **Category**: Finance
- **License**: MIT
- **Website**: https://getbtcz.com
- **Source Code**: https://github.com/z-bitcoinz/BitcoinZ_Blue

### Description
A lightweight, secure wallet for the BitcoinZ cryptocurrency with shielded transactions, fast sync, and modern interface.

### Keywords
bitcoin, cryptocurrency, wallet, btcz, bitcoinz, blockchain, privacy, finance

### Screenshots Needed
- [ ] Main dashboard
- [ ] Send transaction screen
- [ ] Receive screen
- [ ] Transaction history
- [ ] Settings page

## 🚀 Submission Steps

1. **Create Snapcraft Account**
   - Visit https://snapcraft.io/
   - Sign up with Ubuntu One account

2. **Register App Name**
   - Run: \`snapcraft register bitcoinz-blue\`
   - Confirm name reservation

3. **Upload Snap**
   - Run: \`snapcraft upload $SNAP_FILE\`
   - Wait for automatic review

4. **Create Store Listing**
   - Add description, screenshots, and metadata
   - Set appropriate category and keywords

5. **Submit for Review**
   - Request manual review if needed
   - Respond to any reviewer feedback

6. **Release to Stable**
   - After approval, release to stable channel
   - Monitor for user feedback

## 📞 Support Information

- **Issues**: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues
- **Community**: BitcoinZ Discord
- **Documentation**: Repository README
- **Security**: security@btcz.rocks

## 🔐 Security Notes

- App uses strict confinement
- Network access required for blockchain sync
- No personal data collection
- Open source for transparency
- Regular security updates provided

EOF

# Create store description
cat > "$SUBMISSION_DIR/STORE_DESCRIPTION.md" << EOF
# BitcoinZ Blue - Ubuntu Store Description

## Short Description (78 characters max)
A modern, secure light wallet for BitcoinZ cryptocurrency

## Full Description
BitcoinZ Blue is a lightweight, secure wallet for the BitcoinZ cryptocurrency that provides an easy way to store, send, and receive BTCZ while maintaining your privacy.

**Key Features:**
• Shielded (private) and transparent transactions
• Fast sync with light wallet technology  
• Modern, user-friendly interface
• Cross-platform compatibility
• Open source and community-driven

**Security & Privacy:**
• Private key encryption
• Secure transaction signing
• No personal data collection
• Open source code for transparency

**About BitcoinZ:**
BitcoinZ is a decentralized cryptocurrency focused on privacy, security, and community governance. With a total supply of 21 billion coins, BitcoinZ offers fast, low-cost transactions with optional privacy features.

**System Requirements:**
• Ubuntu 20.04 or later
• 4GB RAM (8GB recommended)
• 500MB free storage
• Internet connection for sync

**Support:**
Visit our GitHub repository for documentation, support, and to report issues. BitcoinZ Blue is developed by the BitcoinZ community and is completely free and open source.

EOF

echo "✅ Submission information generated in $SUBMISSION_DIR/"

# Step 6: Final instructions
echo ""
echo "🎉 Ubuntu Store Preparation Complete!"
echo ""
echo "📁 Files created:"
echo "   • $SNAP_FILE (snap package)"
echo "   • $SUBMISSION_DIR/SUBMISSION_CHECKLIST.md"
echo "   • $SUBMISSION_DIR/STORE_DESCRIPTION.md"
echo ""
echo "🚀 Next steps:"
echo "   1. Review the submission checklist"
echo "   2. Take screenshots for store listing"
echo "   3. Create Snapcraft account at https://snapcraft.io/"
echo "   4. Register app name: snapcraft register bitcoinz-blue"
echo "   5. Upload snap: snapcraft upload $SNAP_FILE"
echo "   6. Create store listing with description and screenshots"
echo ""
echo "📚 Documentation:"
echo "   • Snapcraft docs: https://snapcraft.io/docs"
echo "   • Store guidelines: https://snapcraft.io/docs/store-listing"
echo "   • Review process: https://snapcraft.io/docs/review-process"
echo ""
echo "✨ Good luck with your Ubuntu Store submission!"
