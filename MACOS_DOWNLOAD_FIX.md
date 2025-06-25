# 🔧 Fix for "Damaged App" After Download

## 🐛 The Problem

When you download a macOS app from the internet, macOS adds a "quarantine" attribute that:
1. Marks the app as downloaded from the internet
2. Triggers Gatekeeper security checks
3. Can invalidate ad-hoc signatures
4. Results in the "damaged app" error

## ✅ Solutions

### Option 1: Remove Quarantine Attribute (Recommended for Users)

After downloading, run this in Terminal:
```bash
xattr -cr "/path/to/BitcoinZ Blue.app"
```

Or create a simple script for users:
```bash
#!/bin/bash
# fix-downloaded-app.sh
xattr -cr "$1"
echo "✅ App fixed! You can now open it normally."
```

### Option 2: Notarization (Requires Apple Developer Account)

The proper solution is Apple notarization ($99/year):
1. Sign with Developer ID
2. Submit to Apple for notarization
3. Staple the notarization ticket
4. Users can download without issues

### Option 3: Distribution Methods That Preserve Signatures

#### 3a. DMG Distribution (Best Free Option)
Create a DMG that preserves the signature:

```bash
#!/bin/bash
# create-dmg.sh

APP_NAME="BitcoinZ Blue"
VERSION="1.0.6"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"

# Create temporary directory
mkdir -p dmg-contents
cp -R "dist/mac-arm64/${APP_NAME}.app" dmg-contents/

# Create DMG
hdiutil create -volname "${APP_NAME}" \
  -srcfolder dmg-contents \
  -ov -format UDZO \
  "${DMG_NAME}"

# Sign the DMG itself
codesign --force --sign - "${DMG_NAME}"

# Clean up
rm -rf dmg-contents

echo "✅ Created ${DMG_NAME}"
```

#### 3b. Package Distribution
Use macOS Installer packages (.pkg):
```bash
productbuild --component "BitcoinZ Blue.app" \
  /Applications \
  --sign - \
  "BitcoinZ Blue.pkg"
```

### Option 4: Server-Side Solutions

#### 4a. Set Extended Attributes on Server
If hosting on your own server, set these headers:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="BitcoinZ Blue.zip"
X-Content-Type-Options: nosniff
```

#### 4b. Use GitHub Releases
GitHub Releases handle downloads better than direct links.

## 🛠️ Immediate Fix Script

Create this script for users to fix downloaded apps:

```bash
#!/bin/bash
# save as: fix-bitcoinz-blue.command

echo "🔧 BitcoinZ Blue Download Fix"
echo "============================="
echo ""

# Find the app
APP_PATH=$(find ~/Downloads ~/Desktop -name "BitcoinZ Blue.app" -type d 2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
    echo "❌ BitcoinZ Blue.app not found in Downloads or Desktop"
    echo "Please drag the app onto this window and press Enter:"
    read -r APP_PATH
    APP_PATH=$(echo "$APP_PATH" | tr -d '\' | sed 's/\\//g')
fi

if [ -d "$APP_PATH" ]; then
    echo "📍 Found: $APP_PATH"
    echo "🔐 Removing quarantine..."
    xattr -cr "$APP_PATH"
    echo "✅ Fixed! You can now open BitcoinZ Blue normally."
    echo ""
    echo "Press any key to exit..."
    read -n 1
else
    echo "❌ App not found at: $APP_PATH"
fi
```

## 📋 For Your Build Process

Update your build script to create DMGs:

```bash
# Add to build-local-now.sh after macOS build

echo "📦 Creating DMG for distribution..."
APP_NAME="BitcoinZ Blue"
VERSION="1.0.6"

# For ARM64
hdiutil create -volname "${APP_NAME}" \
  -srcfolder "dist/mac-arm64" \
  -ov -format UDZO \
  "dist/${APP_NAME}-${VERSION}-arm64.dmg"

# For Intel
hdiutil create -volname "${APP_NAME}" \
  -srcfolder "dist/mac" \
  -ov -format UDZO \
  "dist/${APP_NAME}-${VERSION}-intel.dmg"

# Sign DMGs
codesign --force --sign - "dist/${APP_NAME}-${VERSION}-arm64.dmg"
codesign --force --sign - "dist/${APP_NAME}-${VERSION}-intel.dmg"
```

## 🎯 Best Practice Summary

1. **For Distribution**: Use DMG format instead of ZIP
2. **For Users**: Provide the fix script
3. **Long-term**: Consider Apple Developer account for proper signing
4. **Alternative**: Use package managers like Homebrew

## 💡 Why This Happens

macOS quarantine is designed to protect users from malicious software. When a file is downloaded:
1. Browser adds `com.apple.quarantine` attribute
2. macOS checks the signature when opened
3. Ad-hoc signatures aren't trusted for internet downloads
4. Result: "damaged" error

The fix removes this quarantine attribute, allowing the app to run with its ad-hoc signature intact.
