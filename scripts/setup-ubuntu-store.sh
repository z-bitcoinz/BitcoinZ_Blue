#!/bin/bash

# BitcoinZ Blue Ubuntu Store Setup Script
# This script helps you set up Ubuntu Store submission via GitHub Actions

set -e

echo "🐧 BitcoinZ Blue Ubuntu Store Setup"
echo "===================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $VERSION"

echo ""
echo "This script will help you set up Ubuntu Store submission via GitHub Actions."
echo "Please follow the steps carefully."
echo ""

# Step 1: Check prerequisites
echo "🔍 Step 1: Checking prerequisites..."

# Check if snapcraft is installed
if command -v snapcraft &> /dev/null; then
    echo "✅ Snapcraft is installed"
    snapcraft --version
else
    echo "❌ Snapcraft is not installed"
    echo ""
    echo "Please install snapcraft:"
    echo "  sudo snap install snapcraft --classic"
    echo ""
    read -p "Press Enter after installing snapcraft to continue..."
    
    if ! command -v snapcraft &> /dev/null; then
        echo "❌ Snapcraft still not found. Please install it first."
        exit 1
    fi
fi

# Step 2: Account setup
echo ""
echo "👤 Step 2: Account setup"
echo ""
echo "You need:"
echo "1. Ubuntu One account (https://login.ubuntu.com/)"
echo "2. Snapcraft developer account (https://snapcraft.io/)"
echo ""
read -p "Do you have both accounts set up? (y/n): " accounts_ready

if [ "$accounts_ready" != "y" ]; then
    echo ""
    echo "Please set up your accounts first:"
    echo "1. Create Ubuntu One account: https://login.ubuntu.com/"
    echo "2. Sign up for Snapcraft: https://snapcraft.io/"
    echo "3. Run this script again when ready"
    exit 0
fi

# Step 3: Login and register
echo ""
echo "🔐 Step 3: Login and register app name"
echo ""

# Check if already logged in
if snapcraft whoami &> /dev/null; then
    echo "✅ Already logged in to Snapcraft"
    snapcraft whoami
else
    echo "Please log in to Snapcraft:"
    snapcraft login
fi

echo ""
echo "📝 Registering app name 'bitcoinz-blue'..."

# Try to register the name
if snapcraft register bitcoinz-blue 2>/dev/null; then
    echo "✅ App name 'bitcoinz-blue' registered successfully"
elif echo $? | grep -q "already registered"; then
    echo "✅ App name 'bitcoinz-blue' is already registered"
else
    echo "❌ Failed to register app name"
    echo "This might mean the name is taken by someone else."
    echo "You may need to choose a different name."
    exit 1
fi

# Step 4: Export credentials
echo ""
echo "🔑 Step 4: Export credentials for GitHub Actions"
echo ""

CREDENTIALS_FILE="snapcraft-credentials-$(date +%Y%m%d-%H%M%S).txt"

echo "Exporting credentials to: $CREDENTIALS_FILE"
snapcraft export-login "$CREDENTIALS_FILE"

if [ -f "$CREDENTIALS_FILE" ]; then
    echo "✅ Credentials exported successfully"
    echo ""
    echo "🔒 IMPORTANT SECURITY NOTICE:"
    echo "============================================"
    echo "The file '$CREDENTIALS_FILE' contains sensitive credentials."
    echo "You need to add this to GitHub Secrets, then DELETE the file."
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to your GitHub repository"
    echo "2. Navigate to Settings → Secrets and variables → Actions"
    echo "3. Click 'New repository secret'"
    echo "4. Name: SNAPCRAFT_STORE_CREDENTIALS"
    echo "5. Value: Copy the ENTIRE contents of '$CREDENTIALS_FILE'"
    echo "6. Click 'Add secret'"
    echo "7. DELETE the credentials file from your computer"
    echo ""
    echo "📄 Credentials file contents:"
    echo "----------------------------"
    cat "$CREDENTIALS_FILE"
    echo "----------------------------"
    echo ""
    
    read -p "Have you added the credentials to GitHub Secrets? (y/n): " credentials_added
    
    if [ "$credentials_added" = "y" ]; then
        echo "🗑️  Deleting credentials file for security..."
        rm "$CREDENTIALS_FILE"
        echo "✅ Credentials file deleted"
    else
        echo "⚠️  Please add the credentials to GitHub Secrets and then delete '$CREDENTIALS_FILE'"
    fi
else
    echo "❌ Failed to export credentials"
    exit 1
fi

# Step 5: Test the setup
echo ""
echo "🧪 Step 5: Testing the setup"
echo ""

echo "The GitHub Actions workflow is now ready!"
echo ""
echo "📁 Workflow file: .github/workflows/ubuntu-store.yml"
echo "📚 Setup guide: UBUNTU_STORE_GITHUB_SETUP.md"
echo ""

# Step 6: Instructions for first submission
echo "🚀 Step 6: How to submit to Ubuntu Store"
echo ""
echo "Option A - Automatic (Recommended):"
echo "  git tag v$VERSION"
echo "  git push origin v$VERSION"
echo ""
echo "Option B - Manual:"
echo "  1. Go to GitHub Actions tab"
echo "  2. Select 'Ubuntu Store Submission'"
echo "  3. Click 'Run workflow'"
echo "  4. Choose release channel (edge/beta/candidate/stable)"
echo "  5. Click 'Run workflow'"
echo ""

# Step 7: Store listing preparation
echo "📝 Step 7: Prepare store listing"
echo ""
echo "After first upload, you'll need to:"
echo "1. Visit: https://snapcraft.io/bitcoinz-blue/listing"
echo "2. Add screenshots (dashboard, send, receive, transactions, settings)"
echo "3. Improve description using STORE_DESCRIPTION.md"
echo "4. Set category: Finance"
echo "5. Add keywords: bitcoin, cryptocurrency, wallet, btcz, bitcoinz"
echo ""

# Final summary
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📋 Summary:"
echo "  • Snapcraft account: ✅ Ready"
echo "  • App name registered: ✅ bitcoinz-blue"
echo "  • GitHub credentials: ✅ Set up"
echo "  • Workflow ready: ✅ .github/workflows/ubuntu-store.yml"
echo ""
echo "🎯 Next steps:"
echo "  1. Create a release tag to trigger automatic submission"
echo "  2. Monitor the GitHub Actions workflow"
echo "  3. Update store listing with screenshots and description"
echo "  4. Test installation: sudo snap install bitcoinz-blue --edge"
echo "  5. Promote through channels: edge → beta → candidate → stable"
echo ""
echo "📞 Support:"
echo "  • GitHub Actions: Check workflow logs"
echo "  • Snapcraft: https://snapcraft.io/docs"
echo "  • BitcoinZ Blue: GitHub Issues"
echo ""
echo "🎉 You're ready to submit BitcoinZ Blue to the Ubuntu Store!"

# Optional: Logout for security
echo ""
read -p "Do you want to logout from Snapcraft locally for security? (y/n): " logout_choice

if [ "$logout_choice" = "y" ]; then
    snapcraft logout
    echo "✅ Logged out from Snapcraft locally"
    echo "💡 You can login again anytime with: snapcraft login"
fi

echo ""
echo "🚀 Happy submitting!"
