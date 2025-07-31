# 🚀 Quick Apple Developer Setup

## ⚡ Fast Track to Stop Virus Warnings

### 1. **Get Your Apple Info** (5 minutes)

```bash
# 1. Login to developer.apple.com → Membership
# Copy your Team ID (like ABC123DEFG)

# 2. Login to appleid.apple.com → App-Specific Passwords
# Generate password for "BitcoinZ Blue Notarization"

# 3. Download Developer ID certificate from developer.apple.com
# Export as .p12 with password
```

### 2. **Convert Certificate** (2 minutes)

```bash
# Convert your certificate to base64
base64 -i your-certificate.p12 -o certificate-base64.txt
```

### 3. **Add GitHub Secrets** (3 minutes)

Go to: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret | Value |
|--------|-------|
| `APPLE_CERTIFICATE_BASE64` | Contents of `certificate-base64.txt` |
| `APPLE_CERTIFICATE_PASSWORD` | Your .p12 password |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_ID_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Your Team ID |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (TEAMID)` |

### 4. **Find Your Signing Identity** (1 minute)

```bash
# Run this on your Mac to find the exact name:
security find-identity -v -p codesigning | grep "Developer ID Application"

# Copy the full name in quotes, like:
# "Developer ID Application: John Doe (ABC123DEFG)"
```

### 5. **Test Locally** (5 minutes)

```bash
# Test with your Apple Developer certificate
./scripts/sign-with-apple-dev.sh
```

### 6. **Push to GitHub** (Auto-build)

```bash
git add .
git commit -m "Add Apple Developer code signing"
git push
```

## ✅ **Result**

After setup:
- ✅ **No more virus warnings**
- ✅ **Verified developer status**
- ✅ **Automatic notarization**
- ✅ **Gatekeeper approval**

## 🆘 **Need Help?**

### Common Issues:

**"No certificates found"**
```bash
# Install certificate in Keychain Access
# Make sure it's in "login" keychain
```

**"Invalid signing identity"**
```bash
# Check exact name with:
security find-identity -v -p codesigning
```

**"Notarization failed"**
```bash
# Verify Apple ID credentials
# Make sure app-specific password is correct
```

## 📞 **Support**

- Check: `APPLE_DEVELOPER_SETUP.md` for detailed instructions
- Run: `./scripts/sign-with-apple-dev.sh` for local testing
- Issues: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues

---

**Total setup time: ~15 minutes**
**Result: Professional, virus-free macOS app! 🎉**
