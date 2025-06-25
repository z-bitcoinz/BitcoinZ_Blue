# 🔐 BitcoinZ Blue Free Code Signing Implementation

## 📋 Overview

BitcoinZ Blue uses a comprehensive free code signing strategy to eliminate "damaged app" errors and provide security verification without expensive certificates.

## ✅ What We've Implemented

### 1. **macOS: Ad-hoc Signing**
- ✅ Prevents "damaged and can't be opened" errors
- ✅ Automatic signing in GitHub Actions
- ✅ Proper entitlements configuration
- ✅ Users only see "unidentified developer" (not "damaged")

### 2. **Windows: Enhanced Self-Signing**
- ✅ Improved self-signed certificates with proper extensions
- ✅ SHA256 hashing and timestamp servers
- ✅ Certificate export for transparency
- ✅ Reduces SmartScreen warnings

### 3. **All Platforms: Sigstore**
- ✅ Free cryptographic signatures
- ✅ Public verification logs
- ✅ Industry-standard security
- ✅ No certificate costs

## 🚀 Quick Start for Users

### macOS Users
```bash
# No more "damaged app" errors!
# Just right-click → Open on first launch
```

### Windows Users
```bash
# If SmartScreen appears:
# Click "More info" → "Run anyway"
# This only happens once
```

### Verify Signatures (Optional)
```bash
# Install cosign: https://github.com/sigstore/cosign
cosign verify-blob \
  --certificate="app.pem" \
  --signature="app.sig" \
  "app-file"
```

## 🛠️ Developer Guide

### Test Signing Locally
```bash
# Run our automated test script
./scripts/test-signing-local.sh

# This will:
# - Test platform-specific signing
# - Verify signatures
# - Check Sigstore integration
```

### Manual Testing

#### macOS
```bash
# Build the app
yarn dist:mac

# Apply ad-hoc signature
codesign --force --deep --sign - "dist/mac/BitcoinZ Blue.app"

# Verify
codesign -dv --verbose=4 "dist/mac/BitcoinZ Blue.app"
```

#### Windows
```powershell
# Check signature
Get-AuthenticodeSignature "dist\BitcoinZ Blue Setup.exe"

# View certificate details
$cert = Get-AuthenticodeSignature "dist\BitcoinZ Blue Setup.exe" | Select-Object -ExpandProperty SignerCertificate
$cert | Format-List *
```

## 📁 Project Configuration

### package.json
```json
{
  "build": {
    "mac": {
      "identity": null,              // Ad-hoc signing
      "hardenedRuntime": false,      // Better compatibility
      "gatekeeperAssess": false,
      "entitlements": "./configs/entitlements.mac.plist",
      "entitlementsInherit": "./configs/entitlements.mac.inherit.plist"
    }
  }
}
```

### GitHub Actions Workflow
- Location: `.github/workflows/build-and-sign.yml`
- Automatically signs all builds
- Applies Sigstore signatures
- Uploads signed artifacts

### Entitlements
- Location: `configs/entitlements.mac.plist`
- Configures app permissions
- Enables network access
- Disables sandbox for compatibility

## 🔍 How It Works

### Build Process
1. **GitHub Actions triggers** on push/tag
2. **Platform builds** execute (mac/win/linux)
3. **Code signing** applied automatically
4. **Sigstore signatures** generated
5. **Artifacts uploaded** with signatures

### Signing Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Build     │ --> │  Platform    │ --> │  Sigstore   │
│   App       │     │  Signing     │     │  Signing    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       v                    v                     v
  [App Files]      [Signed Binaries]     [.sig & .pem]
```

## 📊 Comparison: Before vs After

| Issue | Before | After |
|-------|---------|--------|
| macOS "damaged" error | ❌ Yes | ✅ No |
| Windows SmartScreen | ❌ Severe | ✅ Reduced |
| Signature verification | ❌ None | ✅ Sigstore |
| Cost | N/A | ✅ Free |
| User experience | ❌ Poor | ✅ Good |

## 🔒 Security Benefits

1. **Integrity**: Files can't be tampered with
2. **Transparency**: Public verification possible
3. **Trust**: Cryptographic proof of authenticity
4. **Free**: No certificate expenses

## 📝 Release Checklist

- [ ] Code changes committed
- [ ] GitHub Actions workflow runs
- [ ] Signing steps complete (check logs)
- [ ] Artifacts include signatures
- [ ] Test on clean system
- [ ] Update release notes

## 🆘 Troubleshooting

### macOS Issues
```bash
# If app won't open
xattr -cr "/Applications/BitcoinZ Blue.app"
sudo spctl --add --label "BitcoinZ Blue" "/Applications/BitcoinZ Blue.app"
```

### Windows Issues
```powershell
# Check if signed
Get-AuthenticodeSignature "BitcoinZ Blue.exe"

# If blocked by policy
Unblock-File -Path "BitcoinZ Blue.exe"
```

### Sigstore Issues
```bash
# Update cosign
brew upgrade cosign  # macOS
# or download latest from GitHub

# Verify with debug output
cosign verify-blob --certificate="app.pem" --signature="app.sig" "app" --verbose
```

## 🚧 Future Improvements

1. **Apple Developer Certificate** ($99/year)
   - Full notarization
   - No security warnings

2. **EV Code Signing Certificate** ($300+/year)
   - Instant SmartScreen reputation
   - Maximum trust

3. **Community Funding**
   - Crowdfund certificates
   - Shared developer account

## 📚 Resources

- [Sigstore Documentation](https://docs.sigstore.dev/)
- [Apple Code Signing](https://developer.apple.com/documentation/security/code_signing_services)
- [Windows Authenticode](https://docs.microsoft.com/en-us/windows/win32/seccrypto/authenticode)
- [Our Implementation](.github/workflows/build-and-sign.yml)

## 💡 Key Takeaways

- ✅ **Free solution works**: No more "damaged" errors on macOS
- ✅ **Security improved**: Sigstore provides verification
- ✅ **User experience**: One-time approval instead of blocking
- ✅ **Fully automated**: GitHub Actions handles everything
- ✅ **Transparent**: Anyone can verify our signatures

---

**Questions?** Open an issue on GitHub or check our security documentation:
- [macOS Security](MACOS_SECURITY.md)
- [Windows Security](WINDOWS_SECURITY.md)
