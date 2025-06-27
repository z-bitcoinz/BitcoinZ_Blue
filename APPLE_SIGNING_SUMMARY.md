# Apple Code Signing Implementation Summary

This document summarizes the Apple code signing and notarization implementation for BitcoinZ Blue wallet.

## What Has Been Implemented

### 1. Documentation Created

- **[APPLE_CODE_SIGNING_GUIDE.md](./APPLE_CODE_SIGNING_GUIDE.md)** - Comprehensive guide for setting up Apple certificates
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - Step-by-step instructions for configuring GitHub secrets
- **This summary document** - Overview of the implementation

### 2. Build Configuration Updated

#### package.json
- Added `afterSign` hook for notarization
- Updated macOS build configuration:
  - `hardenedRuntime: true` - Required for notarization
  - `notarize` configuration with team ID placeholder
  - Proper entitlements configuration

#### Entitlements Files
- **configs/entitlements.mac.plist** - Main app entitlements with all necessary permissions
- **configs/entitlements.mac.inherit.plist** - Already existed, used for child processes

### 3. GitHub Actions Workflow Updated

The `.github/workflows/build-and-sign.yml` has been enhanced with:

1. **Certificate Import Step**
   - Imports Developer ID certificate from secrets
   - Creates temporary keychain for secure storage
   - Falls back to ad-hoc signing if no certificate

2. **Enhanced Build Process**
   - Detects if certificate is available
   - Uses proper signing with hardened runtime
   - Falls back to ad-hoc signing for testing

3. **DMG Signing**
   - Signs DMG files after creation
   - Only runs if certificate is available

4. **Notarization Step**
   - Submits apps to Apple for notarization
   - Waits for completion (up to 30 minutes)
   - Staples ticket to DMG for offline verification

### 4. Supporting Scripts

#### notarize.js
- Electron Builder hook for automatic notarization
- Uses new `notarytool` instead of deprecated `altool`
- Handles all error cases gracefully

#### afterSignHook.js (Updated)
- Enhanced to support Developer ID signing
- Falls back to ad-hoc signing when needed
- Handles notarization with proper credentials

#### scripts/test-code-signing.sh
- Local testing script for code signing
- Supports both ad-hoc and Developer ID signing
- Provides detailed verification output

## How It Works

### With Apple Credentials (Production)

1. **Build Phase**
   - Electron Builder creates the app
   - Signs with Developer ID certificate
   - Applies hardened runtime and entitlements

2. **Post-Build Phase**
   - Creates DMG with signed app
   - Signs the DMG file
   - Submits to Apple for notarization
   - Staples notarization ticket

3. **Result**
   - Fully signed and notarized app
   - No Gatekeeper warnings
   - Can be distributed outside App Store

### Without Apple Credentials (Testing/Development)

1. **Build Phase**
   - Electron Builder creates the app
   - Applies ad-hoc signature
   - No hardened runtime

2. **Post-Build Phase**
   - Creates DMG with ad-hoc signed app
   - No notarization

3. **Result**
   - App runs locally without "damaged" errors
   - Shows warning when downloaded from internet
   - Suitable for testing and development

## Required GitHub Secrets

Configure these in your repository settings:

1. **APPLE_CERTIFICATE_BASE64** - Base64 encoded .p12 certificate
2. **APPLE_CERTIFICATE_PASSWORD** - Password for the certificate
3. **APPLE_ID** - Your Apple ID email
4. **APPLE_ID_PASSWORD** - App-specific password
5. **APPLE_TEAM_ID** - Your Apple Developer Team ID
6. **APPLE_SIGNING_IDENTITY** - Full certificate name

## Testing the Implementation

### Local Testing

```bash
# Test with ad-hoc signing
yarn dist:mac

# Test with Developer ID (requires local certificate)
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
yarn dist:mac

# Use the test script
./scripts/test-code-signing.sh
```

### CI/CD Testing

1. Push to a test branch
2. Check Actions tab for workflow execution
3. Download artifacts and verify signing:
   ```bash
   codesign -dv --verbose=4 "BitcoinZ Blue.app"
   spctl -a -t exec -vvv "BitcoinZ Blue.app"
   ```

## Maintenance

### Certificate Renewal (Every 5 Years)

1. Create new certificate in Apple Developer portal
2. Export as .p12 with password
3. Update GitHub secrets:
   - APPLE_CERTIFICATE_BASE64
   - APPLE_CERTIFICATE_PASSWORD
   - APPLE_SIGNING_IDENTITY (if changed)

### App-Specific Password Rotation

1. Revoke old password at appleid.apple.com
2. Generate new app-specific password
3. Update APPLE_ID_PASSWORD secret

### Monitoring

- Check workflow runs for signing/notarization errors
- Monitor certificate expiration date
- Test downloads periodically to ensure Gatekeeper acceptance

## Troubleshooting

### Common Issues

1. **"Certificate not found"**
   - Check certificate is properly base64 encoded
   - Verify password is correct
   - Ensure certificate type is "Developer ID Application"

2. **"Notarization failed"**
   - Check all binaries are signed
   - Verify hardened runtime is enabled
   - Ensure entitlements are correct

3. **"Gatekeeper still shows warning"**
   - Verify notarization completed
   - Check stapling was successful
   - Try removing quarantine: `xattr -cr "BitcoinZ Blue.app"`

### Debug Commands

```bash
# Check certificate in keychain
security find-identity -v -p codesigning

# Verify app signature
codesign -dv --verbose=4 "BitcoinZ Blue.app"

# Check Gatekeeper assessment
spctl -a -t exec -vvv "BitcoinZ Blue.app"

# View entitlements
codesign -d --entitlements - "BitcoinZ Blue.app"
```

## Next Steps for Users

1. **Get Apple Developer Account** ($99/year)
2. **Create Certificates** following [APPLE_CODE_SIGNING_GUIDE.md](./APPLE_CODE_SIGNING_GUIDE.md)
3. **Configure GitHub Secrets** following [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)
4. **Test the build** by pushing to a branch
5. **Download and verify** the signed artifacts

## Benefits

- ✅ No more "damaged app" warnings
- ✅ Automatic signing in CI/CD
- ✅ Professional distribution outside App Store
- ✅ User trust and security
- ✅ Fallback to ad-hoc signing for development

## Resources

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Electron Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Electron Builder Configuration](https://www.electron.build/configuration/mac)