# Apple Developer Code Signing Setup

## 🍎 Required Information from Your Apple Developer Account

### 1. **Apple Developer Team ID** ✅
- ~~Login to: https://developer.apple.com/account~~
- ~~Go to: **Membership** section~~
- ~~Find: **Team ID** (10-character string like `ABC123DEFG`)~~
- **✅ FOUND: D7PJLSKBT7**

### 2. **Create App-Specific Password**
- Login to: https://appleid.apple.com
- Go to: **Sign-In and Security** → **App-Specific Passwords**
- Click: **Generate Password**
- Label: `BitcoinZ Blue Notarization`
- **Save this password** - you'll need it for GitHub secrets

### 3. **Download Developer ID Certificate**
- Login to: https://developer.apple.com/account/resources/certificates
- Look for: **Developer ID Application** certificate
- If none exists, create one:
  1. Click **+** to create new certificate
  2. Select **Developer ID Application**
  3. Upload your Certificate Signing Request (CSR)
  4. Download the certificate (.cer file)

### 4. **Export Certificate as .p12**
- Open **Keychain Access** on your Mac
- Import the downloaded certificate
- Find the certificate in **My Certificates**
- Right-click → **Export**
- Format: **Personal Information Exchange (.p12)**
- Set a password (save this password!)
- Save as `apple-certificate.p12`

### 5. **Convert Certificate to Base64**
```bash
# Convert .p12 to base64 for GitHub secrets
base64 -i apple-certificate.p12 -o apple-certificate-base64.txt
```

## 🔑 Required GitHub Secrets

Add these to your repository: **Settings** → **Secrets and variables** → **Actions**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `APPLE_CERTIFICATE_BASE64` | Contents of `apple-certificate-base64.txt` | Base64 encoded certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password you set for .p12 | Certificate password |
| `APPLE_ID` | Your Apple ID email | Apple Developer account email |
| `APPLE_ID_PASSWORD` | App-specific password | Generated app password |
| `APPLE_TEAM_ID` | Your 10-character Team ID | From developer.apple.com |
| `APPLE_SIGNING_IDENTITY` | Certificate hash (recommended) | e.g., "02F6A77001793A193A90D3DDA7597FE71B6D3AFC" (OPTIONAL - will auto-discover) |

## 📋 How to Find Your Signing Identity

```bash
# List all available signing identities
security find-identity -v -p codesigning

# You'll see output like:
# 1) 02F6A77001793A193A90D3DDA7597FE71B6D3AFC "Developer ID Application: Your Name (ABC123DEFG)"

# You can use either:
# - The hash: 02F6A77001793A193A90D3DDA7597FE71B6D3AFC (recommended)
# - The full name: "Developer ID Application: Your Name (ABC123DEFG)"
```

**Important Notes**:
- The `APPLE_SIGNING_IDENTITY` secret is **optional** - the build will auto-discover it
- If you do set it, **use only the 40-character hash**, not the full name
- The build system will always use the discovered hash to avoid GitHub Actions masking issues
- Full certificate names often get masked by GitHub, causing signing failures

## 🚀 Next Steps

1. **Gather all information above**
2. **Add GitHub secrets**
3. **Update package.json configuration**
4. **Test the signing process**

## ⚠️ Important Notes

- **Keep certificates secure** - Never commit them to Git
- **Use app-specific passwords** - Not your main Apple ID password
- **Test locally first** - Verify signing works on your Mac
- **Notarization takes time** - Can take 5-15 minutes per build

## 🔍 Verification

After setup, your apps will:
- ✅ **Not trigger virus warnings**
- ✅ **Pass Gatekeeper checks**
- ✅ **Show as "verified developer"**
- ✅ **Install without security warnings**

## 🧪 Testing Your Setup

Run the verification script to check your local setup:
```bash
./scripts/verify-apple-setup.sh
```

This script will:
- Check for Developer ID certificates
- Guide you through the export process
- Verify your signing works locally
- Show you exactly which GitHub secrets to add
