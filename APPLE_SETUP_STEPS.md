# Quick Apple Developer Setup for BitcoinZ Blue

## What You Need to Do Right Now

### 1. Create Developer ID Certificate (10 minutes)

1. Go to https://developer.apple.com/account
2. Click **Certificates, IDs & Profiles**
3. Click **Certificates** → **+** button
4. Select **Developer ID Application** (NOT Mac App Store)
5. Follow the steps to create a Certificate Signing Request (CSR) using Keychain Access
6. Download the certificate and double-click to install it

### 2. Export Certificate for GitHub (5 minutes)

1. Open **Keychain Access** on your Mac
2. Find your **Developer ID Application: Your Name** certificate
3. Right-click → Export
4. Save as `.p12` file with a strong password
5. Remember this password - you'll need it for GitHub secrets

### 3. Create App-Specific Password (2 minutes)

1. Go to https://appleid.apple.com/account/manage
2. Sign in and go to **Security**
3. Under **App-Specific Passwords**, click **Generate Password**
4. Label it "BitcoinZ Blue Notarization"
5. Save the generated password

### 4. Set Up GitHub Secrets (5 minutes)

Go to https://github.com/z-bitcoinz/BitcoinZ_Blue/settings/secrets/actions and add:

1. **APPLE_CERTIFICATE_BASE64**
   ```bash
   base64 -i your-certificate.p12 | pbcopy
   ```
   Paste the result

2. **APPLE_CERTIFICATE_PASSWORD**
   The password you used when exporting the .p12 file

3. **APPLE_ID**
   Your Apple ID email (e.g., you@example.com)

4. **APPLE_ID_PASSWORD**
   The app-specific password from step 3

5. **APPLE_TEAM_ID**
   Find this at https://developer.apple.com/account → Membership → Team ID

6. **APPLE_PROVIDER_SHORT_NAME** (optional)
   Usually same as APPLE_TEAM_ID for individual accounts

### 5. Test Your Setup

```bash
# Test locally first
cd /Users/mac/Code/lightwallet/BitcoinZ_Blue_Debug
./scripts/test-code-signing.sh

# If that works, push to trigger a build
git push origin master
```

## Important Notes

- The certificate lasts for 5 years
- Keep your .p12 file backed up securely
- The app-specific password never expires unless you revoke it
- First notarization may take 5-30 minutes (Apple's processing time)

## What This Gives You

✅ No more "unidentified developer" warnings
✅ No more "app is damaged" errors  
✅ Users can open your app normally without right-clicking
✅ Your app passes macOS Gatekeeper security
✅ Professional distribution for BitcoinZ Blue

## Troubleshooting

If notarization fails:
1. Check Xcode is installed: `xcode-select --install`
2. Verify certificate: `security find-identity -p codesigning`
3. Check Apple's status: https://developer.apple.com/system-status/

## Costs

- Apple Developer Program: $99/year
- No per-notarization fees
- Unlimited app notarizations

Ready to start? The whole process takes about 20-30 minutes!