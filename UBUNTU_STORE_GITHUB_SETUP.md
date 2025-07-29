# 🐧 Ubuntu Store GitHub Actions Setup Guide

## 📋 Overview

This guide shows you how to set up automated Ubuntu Store submission using GitHub Actions. The workflow will automatically build and submit your BitcoinZ Blue wallet to the Ubuntu Store whenever you create a new release tag.

## 🔧 Prerequisites

### 1. Ubuntu One Account
- Create account at: https://login.ubuntu.com/
- This is required for Snapcraft access

### 2. Snapcraft Developer Account
- Sign up at: https://snapcraft.io/
- Use your Ubuntu One account to log in

### 3. Register App Name
You need to register the app name before first submission:

```bash
# Install snapcraft locally
sudo snap install snapcraft --classic

# Login to your account
snapcraft login

# Register the app name (one-time only)
snapcraft register bitcoinz-blue
```

## 🔑 Setting Up Store Credentials

### Step 1: Export Snapcraft Credentials

On your local machine with snapcraft installed and logged in:

```bash
# Export your credentials to a file
snapcraft export-login credentials.txt

# View the credentials (this is what you'll add to GitHub)
cat credentials.txt
```

**⚠️ Important**: Keep these credentials secure! They provide full access to your Snapcraft account.

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SNAPCRAFT_STORE_CREDENTIALS`
5. Value: Paste the entire contents of `credentials.txt`
6. Click **Add secret**

### Step 3: Clean Up Local Credentials

```bash
# Remove the credentials file from your local machine
rm credentials.txt

# Optionally logout locally (you can login again when needed)
snapcraft logout
```

## 🚀 Using the GitHub Actions Workflow

### Automatic Submission (Recommended)

The workflow automatically triggers when you create a release tag:

```bash
# Create and push a new version tag
git tag v1.1.0
git push origin v1.1.0
```

This will:
1. ✅ Build the Electron app for Linux
2. ✅ Create the Snap package
3. ✅ Test the package locally
4. ✅ Upload to Ubuntu Store (edge channel)
5. ✅ Release to the specified channel

### Manual Submission

You can also trigger the workflow manually:

1. Go to **Actions** tab in your GitHub repository
2. Select **Ubuntu Store Submission** workflow
3. Click **Run workflow**
4. Choose options:
   - **Release channel**: edge, beta, candidate, or stable
   - **Force upload**: Override existing version if needed
5. Click **Run workflow**

## 📺 Release Channels

### Channel Strategy:
- **edge**: Latest builds, may be unstable
- **beta**: Testing releases for community feedback
- **candidate**: Release candidates, stable but not final
- **stable**: Production releases for general users

### Typical Flow:
```
edge → beta → candidate → stable
```

### Promoting Between Channels:

```bash
# Get revision number
snapcraft list-revisions bitcoinz-blue

# Promote to next channel
snapcraft release bitcoinz-blue <revision> <channel>

# Example: Promote revision 5 to stable
snapcraft release bitcoinz-blue 5 stable
```

## 📦 Store Listing Management

### After First Upload:

1. **Visit Store Dashboard**: https://snapcraft.io/bitcoinz-blue/listing
2. **Add Screenshots**: Upload high-quality app screenshots
3. **Improve Description**: Use the content from `STORE_DESCRIPTION.md`
4. **Set Categories**: Finance, Utility
5. **Add Keywords**: bitcoin, cryptocurrency, wallet, btcz, bitcoinz
6. **Contact Information**: Add support links

### Required Screenshots:
- 📱 Main dashboard showing balance
- 💸 Send transaction screen
- 📥 Receive screen with QR code
- 📊 Transaction history
- ⚙️ Settings page

## 🔍 Monitoring Submissions

### Check Workflow Status:
1. Go to **Actions** tab in GitHub
2. Click on the latest **Ubuntu Store Submission** run
3. Monitor each step's progress
4. Check logs for any errors

### Check Store Status:
```bash
# List all revisions
snapcraft list-revisions bitcoinz-blue

# Check current releases
snapcraft list-releases bitcoinz-blue

# View store metrics
snapcraft metrics bitcoinz-blue
```

### Store Dashboard:
- Visit: https://snapcraft.io/bitcoinz-blue/releases
- Monitor download statistics
- Check review status
- Respond to user feedback

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Credentials Error
```
Error: Invalid credentials
```
**Solution**: Re-export and update the `SNAPCRAFT_STORE_CREDENTIALS` secret

#### 2. Name Not Registered
```
Error: The name 'bitcoinz-blue' is not registered
```
**Solution**: Run `snapcraft register bitcoinz-blue` locally first

#### 3. Version Already Exists
```
Error: Version already exists
```
**Solution**: Use `force_upload: true` in manual workflow or increment version

#### 4. Build Failures
```
Error: Linux build failed
```
**Solution**: Check the build logs, ensure all dependencies are available

### Debug Commands:

```bash
# Test snap locally
sudo snap install bitcoinz-blue_1.1.0_amd64.snap --dangerous --devmode

# Check snap info
snap info bitcoinz-blue

# View snap logs
snap logs bitcoinz-blue

# Remove for testing
sudo snap remove bitcoinz-blue
```

## 📋 Workflow Configuration

### Customizing the Workflow:

Edit `.github/workflows/ubuntu-store.yml` to:
- Change default release channel
- Add additional testing steps
- Modify build parameters
- Add notifications (Slack, Discord, etc.)

### Environment Variables:

```yaml
env:
  SNAPCRAFT_STORE_CREDENTIALS: ${{ secrets.SNAPCRAFT_STORE_CREDENTIALS }}
  DEFAULT_CHANNEL: "edge"  # Change default channel
  ENABLE_TESTING: "true"   # Enable/disable local testing
```

## 🎯 Best Practices

### 1. Version Management
- Use semantic versioning (1.1.0, 1.1.1, etc.)
- Tag releases consistently
- Update package.json version before tagging

### 2. Testing Strategy
- Always test in edge channel first
- Get community feedback in beta
- Use candidate for final testing
- Only promote to stable when confident

### 3. Store Optimization
- Keep store listing updated
- Respond to user reviews
- Monitor download metrics
- Regular security updates

### 4. Community Engagement
- Announce new releases
- Gather feedback from users
- Document known issues
- Provide clear support channels

## 🚀 Next Steps

1. ✅ **Set up credentials** following this guide
2. ✅ **Test the workflow** with a manual trigger
3. ✅ **Create a release tag** to trigger automatic submission
4. ✅ **Update store listing** with screenshots and description
5. ✅ **Monitor and promote** through release channels
6. ✅ **Announce to community** when stable

## 📞 Support

### GitHub Actions Issues:
- Check workflow logs in Actions tab
- Review this setup guide
- Open issue in repository

### Snapcraft Issues:
- Snapcraft documentation: https://snapcraft.io/docs
- Snapcraft forum: https://forum.snapcraft.io/
- Ubuntu Store support: https://snapcraft.io/contact

### BitcoinZ Blue Issues:
- GitHub Issues: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues
- Community Discord: BitcoinZ server
- Developer contact: Through GitHub

---

**🎉 You're now ready to automatically submit BitcoinZ Blue to the Ubuntu Store using GitHub Actions!**
