#!/bin/bash
# BitcoinZ Blue Post-Install Fix
# Run this after moving the app to Applications

echo "🔧 BitcoinZ Blue Post-Install Fix"
echo "================================="
echo ""

# Look for the app in Applications
APP_PATH="/Applications/BitcoinZ Blue.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ BitcoinZ Blue.app not found in Applications"
    echo ""
    echo "Please first move BitcoinZ Blue.app to your Applications folder,"
    echo "then run this script again."
    echo ""
    echo "Press any key to exit..."
    read -n 1 -s
    exit 1
fi

echo "📍 Found: $APP_PATH"
echo ""
echo "🔐 Fixing app signature and permissions..."

# Remove quarantine attributes
sudo xattr -cr "$APP_PATH"

# Re-sign the app with ad-hoc signature
sudo codesign --force --deep --sign - "$APP_PATH"

# Fix permissions
sudo chmod -R 755 "$APP_PATH"

echo ""
echo "✅ Fixed! You can now open BitcoinZ Blue normally."
echo ""
echo "Try opening the app now from your Applications folder."
echo ""
echo "Press any key to exit..."
read -n 1 -s
