# macOS Security Solutions for BitcoinZ Blue

## 🔒 Why macOS Blocks the App

macOS Gatekeeper blocks unsigned applications downloaded from the internet to protect users from malware. BitcoinZ Blue is safe, but it's not signed with an Apple Developer certificate.

## ✅ Solutions for Users

### Method 1: Right-Click to Open (Recommended)
1. Download the appropriate ZIP file for your Mac
2. Extract the ZIP file
3. **Right-click** on `BitcoinZ Blue.app` → **Open**
4. Click **"Open"** when macOS asks for confirmation
5. The app will now run normally in the future

### Method 2: Terminal Command
```bash
# Remove quarantine attribute
sudo xattr -rd com.apple.quarantine "/Applications/BitcoinZ Blue.app"
```

### Method 3: System Preferences
1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"** if the app was blocked
3. Enter your password when prompted

## 🛠️ For Developers - Code Signing Options

### Option 1: Apple Developer Certificate ($99/year)
```bash
# Sign the app with Apple Developer certificate
codesign --force --deep --sign "Developer ID Application: Your Name" "BitcoinZ Blue.app"

# Notarize with Apple
xcrun notarytool submit "BitcoinZ Blue.dmg" --keychain-profile "notarytool-profile" --wait
```

### Option 2: Self-Signed Certificate (Free)
```bash
# Create self-signed certificate
security create-keypair -a rsa -s 2048 -f "BitcoinZ Blue Certificate"

# Sign the app
codesign --force --deep --sign "BitcoinZ Blue Certificate" "BitcoinZ Blue.app"
```

### Option 3: Ad-hoc Signing (Free)
```bash
# Ad-hoc sign (removes some restrictions)
codesign --force --deep --sign - "BitcoinZ Blue.app"
```

## 📋 Build Process Integration

Add to package.json:
```json
"afterSign": "./afterSignHook.js",
"mac": {
  "identity": null,
  "hardenedRuntime": false
}
```

## 🔍 Verification Commands

```bash
# Check code signature
codesign -dv --verbose=4 "BitcoinZ Blue.app"

# Check quarantine attributes
xattr -l "BitcoinZ Blue.app"

# Verify app structure
spctl -a -v "BitcoinZ Blue.app"
```

## 📝 User Instructions Template

Include this in release notes:

```
⚠️ macOS Security Notice:
macOS may show a security warning when opening BitcoinZ Blue for the first time.

To open the app:
1. Right-click on BitcoinZ Blue.app
2. Select "Open" from the menu
3. Click "Open" in the security dialog

This is normal for unsigned applications and only needs to be done once.
```
