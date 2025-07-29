#!/bin/bash

# BitcoinZ Blue Ubuntu Store Setup for macOS
# This script sets up Ubuntu Store submission without requiring local snapcraft

set -e

echo "🍎 BitcoinZ Blue Ubuntu Store Setup (macOS)"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $VERSION"

echo ""
echo "🎯 This setup will prepare Ubuntu Store submission via GitHub Actions."
echo "Since you're on macOS, we'll use the automated GitHub workflow instead of local snapcraft."
echo ""

# Step 1: Check GitHub repository
echo "🔍 Step 1: Checking GitHub repository..."

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get repository info
REPO_URL=$(git config --get remote.origin.url)
if [[ $REPO_URL == *"github.com"* ]]; then
    REPO_NAME=$(echo $REPO_URL | sed 's/.*github.com[:/]\([^.]*\).*/\1/')
    echo "✅ GitHub repository: $REPO_NAME"
else
    echo "❌ Error: Not a GitHub repository"
    echo "Ubuntu Store automation requires GitHub Actions"
    exit 1
fi

# Step 2: Account setup guidance
echo ""
echo "👤 Step 2: Account setup required"
echo ""
echo "You need to create these accounts:"
echo "1. 🔗 Ubuntu One account: https://login.ubuntu.com/"
echo "2. 🏪 Snapcraft developer account: https://snapcraft.io/"
echo ""
echo "📋 Steps to complete:"
echo "   a) Create Ubuntu One account if you don't have one"
echo "   b) Sign up for Snapcraft using your Ubuntu One account"
echo "   c) You'll register the app name through GitHub Actions"
echo ""

read -p "Have you created both accounts? (y/n): " accounts_ready

if [ "$accounts_ready" != "y" ]; then
    echo ""
    echo "Please create your accounts first:"
    echo "1. Ubuntu One: https://login.ubuntu.com/"
    echo "2. Snapcraft: https://snapcraft.io/"
    echo ""
    echo "Then run this script again."
    exit 0
fi

# Step 3: GitHub Actions setup
echo ""
echo "🤖 Step 3: GitHub Actions workflow setup"
echo ""

if [ -f ".github/workflows/ubuntu-store.yml" ]; then
    echo "✅ Ubuntu Store workflow already exists"
else
    echo "❌ Ubuntu Store workflow not found"
    echo "Please ensure .github/workflows/ubuntu-store.yml exists"
    exit 1
fi

# Step 4: Credentials setup guidance
echo ""
echo "🔑 Step 4: Store credentials setup"
echo ""
echo "Since you're on macOS, you'll need to set up credentials differently:"
echo ""
echo "Option A - Use GitHub Codespaces (Recommended):"
echo "1. Go to your GitHub repository"
echo "2. Click 'Code' → 'Codespaces' → 'Create codespace'"
echo "3. In the codespace terminal, run:"
echo "   sudo snap install snapcraft --classic"
echo "   snapcraft login"
echo "   snapcraft register bitcoinz-blue"
echo "   snapcraft export-login credentials.txt"
echo "   cat credentials.txt"
echo "4. Copy the credentials and add to GitHub Secrets"
echo ""
echo "Option B - Use Ubuntu VM/Container:"
echo "1. Set up Ubuntu environment (VM, Docker, etc.)"
echo "2. Install snapcraft and follow normal setup"
echo ""
echo "Option C - Manual registration (Advanced):"
echo "1. Use the GitHub Actions workflow to register"
echo "2. Handle credentials through the automated process"
echo ""

read -p "Which option would you like to use? (A/B/C): " setup_option

case $setup_option in
    [Aa])
        echo ""
        echo "🚀 GitHub Codespaces Setup:"
        echo "=========================="
        echo ""
        echo "1. Go to: https://github.com/$REPO_NAME"
        echo "2. Click 'Code' button"
        echo "3. Select 'Codespaces' tab"
        echo "4. Click 'Create codespace on main'"
        echo "5. Wait for codespace to load"
        echo "6. In the terminal, run these commands:"
        echo ""
        echo "   sudo snap install snapcraft --classic"
        echo "   snapcraft login"
        echo "   snapcraft register bitcoinz-blue"
        echo "   snapcraft export-login credentials.txt"
        echo "   cat credentials.txt"
        echo ""
        echo "7. Copy the entire output from 'cat credentials.txt'"
        echo "8. Go to GitHub Settings → Secrets → Actions"
        echo "9. Create secret: SNAPCRAFT_STORE_CREDENTIALS"
        echo "10. Paste the credentials as the value"
        echo ""
        ;;
    [Bb])
        echo ""
        echo "🐧 Ubuntu Environment Setup:"
        echo "============================"
        echo ""
        echo "Set up Ubuntu environment and run:"
        echo "   sudo snap install snapcraft --classic"
        echo "   snapcraft login"
        echo "   snapcraft register bitcoinz-blue"
        echo "   snapcraft export-login credentials.txt"
        echo "   cat credentials.txt"
        echo ""
        echo "Then add the credentials to GitHub Secrets"
        echo ""
        ;;
    [Cc])
        echo ""
        echo "🔧 Manual Registration:"
        echo "======================"
        echo ""
        echo "The GitHub Actions workflow will handle registration automatically"
        echo "when you have the proper credentials set up."
        echo ""
        ;;
    *)
        echo "Invalid option selected"
        exit 1
        ;;
esac

# Step 5: GitHub Secrets setup
echo ""
echo "🔐 Step 5: GitHub Secrets configuration"
echo ""
echo "After getting your credentials, add them to GitHub:"
echo ""
echo "1. Go to: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. Name: SNAPCRAFT_STORE_CREDENTIALS"
echo "4. Value: [paste your credentials from snapcraft export-login]"
echo "5. Click 'Add secret'"
echo ""

read -p "Have you added the SNAPCRAFT_STORE_CREDENTIALS secret? (y/n): " secret_added

if [ "$secret_added" != "y" ]; then
    echo ""
    echo "⚠️  Please add the GitHub secret before proceeding with submission"
    echo ""
fi

# Step 6: Test submission
echo ""
echo "🧪 Step 6: Test the setup"
echo ""
echo "You can now test the Ubuntu Store submission:"
echo ""
echo "Option A - Create release tag (automatic):"
echo "   git tag v$VERSION"
echo "   git push origin v$VERSION"
echo ""
echo "Option B - Manual workflow trigger:"
echo "   1. Go to: https://github.com/$REPO_NAME/actions"
echo "   2. Select 'Ubuntu Store Submission'"
echo "   3. Click 'Run workflow'"
echo "   4. Choose 'edge' channel for testing"
echo "   5. Click 'Run workflow'"
echo ""

# Step 7: Monitoring
echo ""
echo "📊 Step 7: Monitor submission"
echo ""
echo "After triggering the workflow:"
echo "1. Monitor: https://github.com/$REPO_NAME/actions"
echo "2. Check logs for any errors"
echo "3. Visit store: https://snapcraft.io/bitcoinz-blue"
echo "4. Test installation: sudo snap install bitcoinz-blue --edge"
echo ""

# Final summary
echo ""
echo "✅ Setup Summary"
echo "================"
echo ""
echo "📋 Completed:"
echo "  • Version updated to v$VERSION"
echo "  • GitHub Actions workflow ready"
echo "  • Repository verified: $REPO_NAME"
echo ""
echo "📝 Next steps:"
echo "  • Set up Snapcraft credentials (via Codespaces/Ubuntu)"
echo "  • Add SNAPCRAFT_STORE_CREDENTIALS to GitHub Secrets"
echo "  • Test submission with workflow trigger"
echo "  • Monitor build and submission process"
echo ""
echo "🔗 Useful links:"
echo "  • Repository: https://github.com/$REPO_NAME"
echo "  • Actions: https://github.com/$REPO_NAME/actions"
echo "  • Secrets: https://github.com/$REPO_NAME/settings/secrets/actions"
echo "  • Codespaces: https://github.com/$REPO_NAME/codespaces"
echo ""

# Quick submission option
echo ""
read -p "Would you like to trigger a test submission now? (y/n): " trigger_now

if [ "$trigger_now" = "y" ]; then
    if [ "$secret_added" = "y" ]; then
        echo ""
        echo "🚀 Triggering test submission..."
        
        # Check if GitHub CLI is available
        if command -v gh &> /dev/null; then
            if gh auth status &> /dev/null; then
                echo "Using GitHub CLI to trigger workflow..."
                gh workflow run ubuntu-store.yml -f release_channel=edge -f force_upload=false
                echo "✅ Workflow triggered!"
                echo "Monitor at: https://github.com/$REPO_NAME/actions"
            else
                echo "GitHub CLI not authenticated. Please use web interface:"
                echo "https://github.com/$REPO_NAME/actions/workflows/ubuntu-store.yml"
            fi
        else
            echo "GitHub CLI not available. Please use web interface:"
            echo "https://github.com/$REPO_NAME/actions/workflows/ubuntu-store.yml"
        fi
    else
        echo "❌ Cannot trigger submission without GitHub Secrets set up"
        echo "Please add SNAPCRAFT_STORE_CREDENTIALS first"
    fi
fi

echo ""
echo "🎉 macOS Setup Complete!"
echo ""
echo "Your BitcoinZ Blue wallet is ready for Ubuntu Store submission"
echo "using GitHub Actions automation! 🚀"
