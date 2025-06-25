#!/bin/bash

# BitcoinZ Blue - Fix Downloaded App Script
# This script fixes macOS security issues with downloaded BitcoinZ Blue apps

echo "🔧 BitcoinZ Blue - Fix Downloaded App"
echo "======================================"

# Check if app path is provided
if [ $# -eq 0 ]; then
    echo "Usage: ./fix-downloaded-app.sh \"/path/to/BitcoinZ Blue.app\""
    echo ""
    echo "Example:"
    echo "  ./fix-downloaded-app.sh \"~/Downloads/BitcoinZ Blue.app\""
    echo ""
    echo "Or drag and drop the app onto this script in Terminal"
    exit 1
fi

APP_PATH="$1"

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo "❌ Error: App not found at: $APP_PATH"
    exit 1
fi

echo "📱 Found app: $APP_PATH"

# Remove quarantine attributes
echo "🔓 Removing quarantine attributes..."
sudo xattr -r -d com.apple.quarantine "$APP_PATH" 2>/dev/null || true
sudo xattr -r -d com.apple.metadata:kMDItemWhereFroms "$APP_PATH" 2>/dev/null || true

# Clear all extended attributes
echo "🧹 Clearing extended attributes..."
sudo xattr -c "$APP_PATH" 2>/dev/null || true

# Make executable
echo "⚡ Making app executable..."
chmod +x "$APP_PATH/Contents/MacOS/"* 2>/dev/null || true

# Re-sign with ad-hoc signature
echo "🔐 Re-signing app..."
codesign --force --deep --sign - --options runtime "$APP_PATH" 2>/dev/null || true

# Verify signature
echo "🔍 Verifying signature..."
if codesign --verify --verbose "$APP_PATH" 2>/dev/null; then
    echo "✅ App signature is valid"
else
    echo "⚠️  Warning: Could not verify signature, but app should still work"
fi

echo ""
echo "✅ BitcoinZ Blue app has been fixed!"
echo "🚀 You can now run the app normally"
echo ""
echo "If you still have issues:"
echo "1. Right-click the app → Open"
echo "2. Click 'Open' when prompted about security"
echo "3. The app should work normally after that"
