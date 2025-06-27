# Apple Code Signing Guide for BitcoinZ Blue

This guide provides step-by-step instructions for setting up proper Apple code signing and notarization for BitcoinZ Blue wallet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating Apple Developer Certificates](#creating-apple-developer-certificates)
3. [Exporting Certificates for CI/CD](#exporting-certificates-for-cicd)
4. [Setting up GitHub Secrets](#setting-up-github-secrets)
5. [Understanding the Signing Process](#understanding-the-signing-process)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Active Apple Developer Account ($99/year)
- macOS computer with Xcode installed
- Admin access to the BitcoinZ Blue GitHub repository

## Creating Apple Developer Certificates

### Step 1: Access Apple Developer Portal

1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in with your Apple ID
3. Navigate to "Certificates, Identifiers & Profiles"

### Step 2: Create Developer ID Application Certificate

1. Click the "+" button to create a new certificate
2. Select "Developer ID Application" (for distributing apps outside the Mac App Store)
3. Click "Continue"

### Step 3: Generate Certificate Signing Request (CSR)

1. Open Keychain Access on your Mac
2. Go to Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
3. Fill in:
   - Email Address: Your email
   - Common Name: "BitcoinZ Blue Developer ID"
   - CA Email Address: Leave blank
   - Select "Saved to disk"
4. Save the CSR file

### Step 4: Complete Certificate Creation

1. Upload the CSR file to Apple Developer Portal
2. Download the generated certificate
3. Double-click to install in Keychain Access

### Step 5: Create Developer ID Installer Certificate (Optional)

Repeat steps 2-4 but select "Developer ID Installer" instead. This is used for signed .pkg installers.

## Exporting Certificates for CI/CD

### Step 1: Export Certificate and Private Key

1. Open Keychain Access
2. Find your "Developer ID Application" certificate
3. Right-click and select "Export"
4. Choose format: Personal Information Exchange (.p12)
5. Set a strong password (you'll need this later)
6. Save as `DeveloperIDApplication.p12`

### Step 2: Encode Certificate for GitHub

In Terminal, run:
```bash
base64 -i DeveloperIDApplication.p12 -o DeveloperIDApplication.p12.base64
```

### Step 3: Create App-Specific Password for Notarization

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and go to Security
3. Under "App-Specific Passwords", click "Generate Password"
4. Name it "BitcoinZ Blue Notarization"
5. Save the generated password securely

## Setting up GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following repository secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `APPLE_CERTIFICATE_BASE64` | Contents of DeveloperIDApplication.p12.base64 | Base64 encoded certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Your P12 password | Password set during certificate export |
| `APPLE_ID` | your@email.com | Apple ID email |
| `APPLE_ID_PASSWORD` | App-specific password | Generated in previous step |
| `APPLE_TEAM_ID` | Your Team ID | Found in Apple Developer account |
| `APPLE_SIGNING_IDENTITY` | "Developer ID Application: Your Name (TEAMID)" | Full certificate name |

### Finding Your Team ID

1. Go to [developer.apple.com](https://developer.apple.com)
2. Click on "Membership" in the sidebar
3. Your Team ID is listed there (10 characters, e.g., "ABC1234567")

### Finding Your Signing Identity

In Terminal, run:
```bash
security find-identity -v -p codesigning
```

Look for the line containing "Developer ID Application" and copy the full name.

## Understanding the Signing Process

### Code Signing

Code signing ensures:
- The app hasn't been modified since signing
- Users know who published the app
- macOS Gatekeeper allows the app to run

### Notarization

Notarization is Apple's automated security scan that:
- Checks for malicious content
- Verifies code signing
- Issues a ticket that allows Gatekeeper to verify the app

### Stapling

After notarization, the ticket is "stapled" to the app so it can be verified offline.

## Build Configuration Updates

The workflow has been updated to:

1. **Import Certificate**: Securely imports the certificate into a temporary keychain
2. **Sign Application**: Signs the .app bundle with your Developer ID
3. **Create DMG**: Packages the signed app in a DMG
4. **Sign DMG**: Signs the DMG file
5. **Notarize**: Submits to Apple for notarization
6. **Staple**: Attaches the notarization ticket
7. **Verify**: Confirms signing and notarization

## Troubleshooting

### Certificate Issues

**Problem**: "Certificate not found"
- Verify the certificate name matches exactly
- Check that the certificate is valid and not expired
- Ensure the certificate type is "Developer ID Application"

**Problem**: "The specified item could not be found in the keychain"
- The certificate might not be properly imported
- Check the base64 encoding is correct
- Verify the P12 password is correct

### Notarization Issues

**Problem**: "Unable to notarize"
- Ensure all binaries are signed
- Check that the app doesn't contain unsigned dylibs
- Verify hardened runtime is enabled
- Check entitlements are properly configured

**Problem**: "Network error during notarization"
- Apple's notarization service might be down
- Check your internet connection
- Try again in a few minutes

### Gatekeeper Issues

**Problem**: App still shows as damaged
- Ensure notarization completed successfully
- Verify the ticket was stapled
- Try removing quarantine: `xattr -cr /path/to/BitcoinZ\ Blue.app`

## Testing Locally

To test signing locally before pushing:

```bash
# Sign the app
codesign --force --deep --sign "Developer ID Application: Your Name (TEAMID)" \
  --options runtime \
  --entitlements configs/entitlements.mac.plist \
  "dist/mac/BitcoinZ Blue.app"

# Verify signing
codesign --verify --deep --strict --verbose=2 "dist/mac/BitcoinZ Blue.app"

# Check notarization status
spctl -a -t exec -vvv "dist/mac/BitcoinZ Blue.app"
```

## Security Best Practices

1. **Never commit certificates or passwords** to the repository
2. **Rotate passwords** periodically
3. **Use separate certificates** for development and production
4. **Monitor certificate expiration** (they last 5 years)
5. **Keep your Apple Developer account secure** with 2FA

## Additional Resources

- [Apple Developer - Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Apple Developer - Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)
- [Electron - Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Electron Builder - Code Signing](https://www.electron.build/code-signing)

## Next Steps

After setting up certificates and secrets:

1. Update the GitHub Actions workflow (already done in this repo)
2. Test the build process with a push to a test branch
3. Monitor the Actions tab for any issues
4. Download and test the signed artifacts

For any issues or questions, please open an issue in the BitcoinZ Blue repository.