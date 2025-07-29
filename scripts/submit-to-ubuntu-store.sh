#!/bin/bash

# Quick Ubuntu Store Submission Script
# This script helps you submit BitcoinZ Blue to Ubuntu Store via GitHub Actions

set -e

echo "🚀 BitcoinZ Blue Ubuntu Store Submission"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Get current version
VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $VERSION"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "It's recommended to commit all changes before creating a release"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/n): " continue_with_changes
    if [ "$continue_with_changes" != "y" ]; then
        echo "Please commit your changes and try again"
        exit 0
    fi
fi

echo ""
echo "🎯 Submission Options:"
echo "1. Create release tag (automatic submission)"
echo "2. Manual workflow trigger (requires GitHub CLI)"
echo "3. Show submission status"
echo "4. Exit"
echo ""

read -p "Choose an option (1-4): " option

case $option in
    1)
        echo ""
        echo "📋 Creating release tag for automatic submission..."
        echo ""
        
        # Check if tag already exists
        if git tag -l | grep -q "^v$VERSION$"; then
            echo "⚠️  Tag v$VERSION already exists"
            read -p "Do you want to delete and recreate it? (y/n): " recreate_tag
            if [ "$recreate_tag" = "y" ]; then
                git tag -d "v$VERSION"
                git push origin ":refs/tags/v$VERSION" 2>/dev/null || true
                echo "✅ Deleted existing tag"
            else
                echo "Cancelled"
                exit 0
            fi
        fi
        
        # Create and push tag
        echo "Creating tag v$VERSION..."
        git tag -a "v$VERSION" -m "Release BitcoinZ Blue v$VERSION for Ubuntu Store"
        
        echo "Pushing tag to trigger GitHub Actions..."
        git push origin "v$VERSION"
        
        echo ""
        echo "✅ Release tag created and pushed!"
        echo ""
        echo "🔗 Monitor progress at:"
        echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
        echo ""
        echo "📱 After successful build, install with:"
        echo "   sudo snap install bitcoinz-blue --edge"
        ;;
        
    2)
        echo ""
        echo "🔧 Manual workflow trigger..."
        echo ""
        
        # Check if GitHub CLI is installed
        if ! command -v gh &> /dev/null; then
            echo "❌ GitHub CLI (gh) is not installed"
            echo ""
            echo "Install GitHub CLI:"
            echo "  • macOS: brew install gh"
            echo "  • Ubuntu: sudo apt install gh"
            echo "  • Windows: winget install GitHub.cli"
            echo ""
            echo "Or use the web interface:"
            echo "1. Go to GitHub Actions tab"
            echo "2. Select 'Ubuntu Store Submission'"
            echo "3. Click 'Run workflow'"
            exit 1
        fi
        
        # Check if authenticated
        if ! gh auth status &> /dev/null; then
            echo "Please authenticate with GitHub CLI:"
            gh auth login
        fi
        
        echo "Available release channels:"
        echo "1. edge (latest builds, may be unstable)"
        echo "2. beta (testing releases)"
        echo "3. candidate (release candidates)"
        echo "4. stable (production releases)"
        echo ""
        
        read -p "Choose channel (1-4): " channel_choice
        
        case $channel_choice in
            1) CHANNEL="edge" ;;
            2) CHANNEL="beta" ;;
            3) CHANNEL="candidate" ;;
            4) CHANNEL="stable" ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        
        read -p "Force upload even if version exists? (y/n): " force_upload
        FORCE_UPLOAD="false"
        if [ "$force_upload" = "y" ]; then
            FORCE_UPLOAD="true"
        fi
        
        echo ""
        echo "🚀 Triggering workflow with:"
        echo "   Channel: $CHANNEL"
        echo "   Force upload: $FORCE_UPLOAD"
        echo ""
        
        gh workflow run ubuntu-store.yml \
            -f release_channel="$CHANNEL" \
            -f force_upload="$FORCE_UPLOAD"
        
        echo "✅ Workflow triggered!"
        echo ""
        echo "🔗 Monitor progress:"
        gh run list --workflow=ubuntu-store.yml --limit=1
        ;;
        
    3)
        echo ""
        echo "📊 Checking submission status..."
        echo ""
        
        # Check if GitHub CLI is available
        if command -v gh &> /dev/null && gh auth status &> /dev/null; then
            echo "🔄 Recent GitHub Actions runs:"
            gh run list --workflow=ubuntu-store.yml --limit=5
            echo ""
        fi
        
        # Check if snapcraft is available
        if command -v snapcraft &> /dev/null; then
            echo "📦 Checking Snapcraft status..."
            
            if snapcraft whoami &> /dev/null; then
                echo ""
                echo "📋 Store revisions:"
                snapcraft list-revisions bitcoinz-blue 2>/dev/null || echo "No revisions found (app not yet uploaded)"
                
                echo ""
                echo "📺 Release channels:"
                snapcraft list-releases bitcoinz-blue 2>/dev/null || echo "No releases found"
                
                echo ""
                echo "🔗 Store page: https://snapcraft.io/bitcoinz-blue"
            else
                echo "Not logged in to Snapcraft"
                echo "Login with: snapcraft login"
            fi
        else
            echo "Snapcraft not installed"
        fi
        ;;
        
    4)
        echo "Goodbye!"
        exit 0
        ;;
        
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📚 Useful commands:"
echo ""
echo "Check workflow status:"
echo "  gh run list --workflow=ubuntu-store.yml"
echo ""
echo "View workflow logs:"
echo "  gh run view --log"
echo ""
echo "Install from store:"
echo "  sudo snap install bitcoinz-blue --edge"
echo "  sudo snap install bitcoinz-blue --beta"
echo "  sudo snap install bitcoinz-blue --candidate"
echo "  sudo snap install bitcoinz-blue --stable"
echo ""
echo "Check installed version:"
echo "  snap list bitcoinz-blue"
echo ""
echo "View store page:"
echo "  https://snapcraft.io/bitcoinz-blue"
echo ""
echo "🎉 Happy submitting!"
