# GitHub Secrets Setup for Apple Code Signing

This document provides step-by-step instructions for setting up GitHub repository secrets needed for Apple code signing and notarization.

## Required Secrets

You need to configure the following secrets in your GitHub repository:

| Secret Name | Required | Description |
|------------|----------|-------------|
| `APPLE_CERTIFICATE_BASE64` | Yes | Base64 encoded Developer ID certificate (.p12) |
| `APPLE_CERTIFICATE_PASSWORD` | Yes | Password for the .p12 certificate |
| `APPLE_ID` | Yes | Your Apple ID email |
| `APPLE_ID_PASSWORD` | Yes | App-specific password for notarization |
| `APPLE_TEAM_ID` | Yes | Your Apple Developer Team ID |
| `APPLE_SIGNING_IDENTITY` | Yes | Full signing identity string |

## Step-by-Step Setup

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Each Secret

Click **New repository secret** for each secret below:

#### APPLE_CERTIFICATE_BASE64

1. Export your certificate as described in [APPLE_CODE_SIGNING_GUIDE.md](./APPLE_CODE_SIGNING_GUIDE.md)
2. Encode it to base64:
   ```bash
   base64 -i DeveloperIDApplication.p12 -o cert.base64
   cat cert.base64 | pbcopy  # Copies to clipboard on macOS
   ```
3. Paste the entire base64 string as the secret value

#### APPLE_CERTIFICATE_PASSWORD

Enter the password you set when exporting the .p12 certificate

#### APPLE_ID

Enter your Apple ID email address (e.g., `developer@example.com`)

#### APPLE_ID_PASSWORD

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and navigate to **Security**
3. Under **App-Specific Passwords**, click **Generate Password**
4. Name it "BitcoinZ Blue Notarization"
5. Copy and use the generated password

#### APPLE_TEAM_ID

1. Go to [developer.apple.com](https://developer.apple.com)
2. Click **Membership** in the sidebar
3. Copy your Team ID (10 characters, e.g., "ABC1234567")

#### APPLE_SIGNING_IDENTITY

1. On your Mac, open Terminal
2. Run:
   ```bash
   security find-identity -v -p codesigning
   ```
3. Find the line with "Developer ID Application"
4. Copy the full identity string (e.g., "Developer ID Application: Your Name (ABC1234567)")

## Verifying Your Setup

After adding all secrets:

1. Go to **Actions** tab in your repository
2. Run a workflow manually or push a commit
3. Check the workflow logs for any authentication errors

## Security Best Practices

### DO:
- ✅ Use strong, unique passwords
- ✅ Enable 2FA on your Apple ID
- ✅ Rotate app-specific passwords periodically
- ✅ Keep your certificate password secure
- ✅ Monitor certificate expiration (5 years)

### DON'T:
- ❌ Share secrets with anyone
- ❌ Commit secrets to the repository
- ❌ Use your main Apple ID password
- ❌ Reuse passwords across services

## Troubleshooting

### "Bad decrypt" error
- The certificate password is incorrect
- The base64 encoding is corrupted

### "Unable to find identity" error
- The signing identity doesn't match exactly
- The certificate isn't a Developer ID type

### "Invalid credentials" error
- The Apple ID or password is incorrect
- The app-specific password has been revoked
- 2FA is not properly configured

### "Team ID not found" error
- The Team ID is incorrect
- Your account doesn't have access to the team

## Testing Locally

Before pushing to GitHub, test locally:

```bash
# Export your secrets temporarily
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABC1234567"

# Run the build
yarn dist:mac
```

## Certificate Renewal

Developer ID certificates expire after 5 years:

1. Create a new certificate before expiration
2. Update `APPLE_CERTIFICATE_BASE64` secret
3. Update `APPLE_SIGNING_IDENTITY` if it changed
4. Keep the old certificate until all signed apps expire

## Additional Resources

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Apple Developer - Code Signing](https://developer.apple.com/support/code-signing/)
- [Managing Apple Certificates](https://help.apple.com/xcode/mac/current/#/dev154b28f09)