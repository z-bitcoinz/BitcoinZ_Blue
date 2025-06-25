# macOS Security Solutions for BitcoinZ Blue

## ✅ Good News: No More "Damaged App" Errors!

BitcoinZ Blue now uses **ad-hoc code signing** which prevents the "damaged and can't be opened" error. However, you may still see an "unidentified developer" warning on first launch.

## 🔒 Why macOS Shows Security Warnings

macOS Gatekeeper warns about apps from unidentified developers to protect users. BitcoinZ Blue is safe and now properly signed, just not with a paid Apple Developer certificate.

## ✅ How to Open BitcoinZ Blue

### For Downloaded Apps (Recommended Method)
1. Download the appropriate ZIP file for your Mac (Intel or Apple Silicon)
2. Extract the ZIP file
3. **Right-click** on `BitcoinZ Blue.app` → **Open**
4. Click **"Open"** when macOS shows the security dialog
5. The app will open normally from now on

### Alternative: System Settings
1. Try to open the app normally (double-click)
2. When blocked, go to **System Settings** → **Privacy & Security**
3. Look for BitcoinZ Blue and click **"Open Anyway"**
4. Enter your password when prompted

### For Advanced Users: Terminal
```bash
# If the above methods don't work, use Terminal:
sudo spctl --add --label "BitcoinZ Blue" "/Applications/BitcoinZ Blue.app"
sudo spctl --enable --label "BitcoinZ Blue"
```

## 🎯 Current Signing Implementation (Free)

### What We Use:
1. **Ad-hoc Code Signing**: Prevents "damaged app" errors
2. **Proper Entitlements**: Configured permissions for app functionality
3. **Sigstore Signatures**: Additional cryptographic verification

### How It Works:
- GitHub Actions automatically applies ad-hoc signing during builds
- Quarantine attributes are removed from the app bundle
- Users only see "unidentified developer" warning (not "damaged")
- One-time approval process for users

## 🛠️ For Developers - Testing Locally

### Test Signing Script
```bash
# Run our automated test script
./scripts/test-signing-local.sh

# Or manually test:
# 1. Build the app
yarn dist:mac

# 2. Apply ad-hoc signature
codesign --force --deep --sign - "dist/mac/BitcoinZ Blue.app"

# 3. Verify signature
codesign -dv --verbose=4 "dist/mac/BitcoinZ Blue.app"

# 4. Remove quarantine
xattr -cr "dist/mac/BitcoinZ Blue.app"
```

### Verification Commands
```bash
# Check signature status
codesign -dv --verbose=4 "BitcoinZ Blue.app"

# Verify entitlements
codesign -d --entitlements - "BitcoinZ Blue.app"

# Check Gatekeeper assessment
spctl -a -v "BitcoinZ Blue.app"
```

## 📋 Build Configuration

Our `package.json` includes:
```json
"mac": {
  "identity": null,              // Uses ad-hoc signing
  "hardenedRuntime": false,      // Better compatibility
  "gatekeeperAssess": false,     // Skip assessment during build
  "entitlements": "./configs/entitlements.mac.plist",
  "entitlementsInherit": "./configs/entitlements.mac.inherit.plist"
}
```

## � Additional Security: Sigstore

We also provide Sigstore signatures for cryptographic verification:
```bash
# Verify Sigstore signature (requires cosign)
cosign verify-blob \
  --certificate="BitcoinZ-Blue.pem" \
  --signature="BitcoinZ-Blue.sig" \
  "BitcoinZ-Blue-mac.zip"
```

## 📝 Release Notes Template

```
✅ macOS Security Improvements:
• No more "damaged app" errors thanks to ad-hoc signing
• One-time security approval still required

To open BitcoinZ Blue:
1. Right-click the app → Select "Open"
2. Click "Open" in the security dialog
3. The app will open normally from now on

For additional verification, check our Sigstore signatures.
```

## 🚀 Future Improvements

While our free signing solution works well, future options include:
- Apple Developer Program membership ($99/year) for full notarization
- Third-party signing services
- Community-funded developer certificate
