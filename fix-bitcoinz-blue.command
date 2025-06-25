#!/bin/bash
# BitcoinZ Blue Download Fix
# Double-click this file to fix the "damaged app" error

echo "🔧 BitcoinZ Blue Download Fix"
echo "============================="
echo ""

# Find the app
APP_PATH=$(find ~/Downloads ~/Desktop -name "BitcoinZ Blue.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ BitcoinZ Blue.app not found in Downloads or Desktop"
    echo ""
    echo "Please drag the BitcoinZ Blue app onto this window and press Enter:"
    read -r APP_PATH
    # Clean up the path
    APP_PATH=$(echo "$APP_PATH" | tr -d '\' | sed 's/\\//g' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
fi

if [ -d "$APP_PATH" ]; then
    echo ""
    echo "📍 Found: $APP_PATH"
    echo "🔐 Removing quarantine attribute..."
    xattr -cr "$APP_PATH"
    echo "✅ Fixed! You can now open BitcoinZ Blue normally."
    echo ""
    echo "Try opening the app now by double-clicking it."
else
    echo "❌ App not found at: $APP_PATH"
    echo "Please make sure you've extracted the app from the ZIP file first."
fi

echo ""
echo "Press any key to exit..."
read -n 1 -s
