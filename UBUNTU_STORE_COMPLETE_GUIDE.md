# 🐧 Complete Ubuntu Store Submission Guide

## 🎉 Overview

BitcoinZ Blue v1.1.0 is now **fully prepared** for Ubuntu Store submission with automated GitHub Actions workflow! This guide provides everything you need to submit your wallet to the Ubuntu Store.

## 📁 Files Created

### ✅ GitHub Actions Workflow
- **`.github/workflows/ubuntu-store.yml`** - Automated build and submission
- **`UBUNTU_STORE_GITHUB_SETUP.md`** - Detailed setup instructions

### ✅ Configuration Files
- **`snapcraft.yaml`** - Snap package configuration
- **`RELEASE_NOTES_v1.1.0.md`** - Release documentation

### ✅ Helper Scripts
- **`scripts/setup-ubuntu-store.sh`** - Interactive setup wizard
- **`scripts/submit-to-ubuntu-store.sh`** - Quick submission tool
- **`test-version.js`** - Version consistency checker

### ✅ Documentation
- **`UBUNTU_STORE_READY.md`** - Readiness confirmation
- **`UBUNTU_STORE_COMPLETE_GUIDE.md`** - This comprehensive guide

## 🚀 Quick Start (3 Steps)

### Step 1: Setup (One-time)
```bash
# Run the interactive setup wizard
./scripts/setup-ubuntu-store.sh
```

This will:
- ✅ Check prerequisites (snapcraft, accounts)
- ✅ Register app name "bitcoinz-blue"
- ✅ Export credentials for GitHub Actions
- ✅ Guide you through GitHub Secrets setup

### Step 2: Submit to Store
```bash
# Option A: Automatic (create release tag)
git tag v1.1.0
git push origin v1.1.0

# Option B: Manual (using helper script)
./scripts/submit-to-ubuntu-store.sh
```

### Step 3: Monitor & Promote
- 📊 Check GitHub Actions for build status
- 🔍 Monitor Ubuntu Store review process
- 📈 Promote through channels: edge → beta → candidate → stable

## 📋 Detailed Process

### 1. Prerequisites Setup

#### A. Create Accounts
- **Ubuntu One**: https://login.ubuntu.com/
- **Snapcraft**: https://snapcraft.io/

#### B. Install Tools
```bash
# Install snapcraft
sudo snap install snapcraft --classic

# Install GitHub CLI (optional, for manual triggers)
# macOS: brew install gh
# Ubuntu: sudo apt install gh
```

#### C. Register App Name
```bash
snapcraft login
snapcraft register bitcoinz-blue
```

### 2. GitHub Secrets Configuration

#### A. Export Credentials
```bash
snapcraft export-login credentials.txt
cat credentials.txt  # Copy this content
```

#### B. Add to GitHub
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Create secret: `SNAPCRAFT_STORE_CREDENTIALS`
3. Paste the credentials content
4. Delete local credentials file: `rm credentials.txt`

### 3. Submission Methods

#### Method A: Automatic (Recommended)
```bash
# Create and push release tag
git tag v1.1.0
git push origin v1.1.0
```

**What happens:**
1. 🔨 GitHub Actions builds Linux app
2. 📦 Creates snap package
3. 🧪 Tests package locally
4. 📤 Uploads to Ubuntu Store (edge channel)
5. 🚀 Releases to specified channel

#### Method B: Manual Workflow
1. Go to **GitHub Actions** tab
2. Select **Ubuntu Store Submission**
3. Click **Run workflow**
4. Choose options:
   - **Release channel**: edge/beta/candidate/stable
   - **Force upload**: true/false
5. Click **Run workflow**

#### Method C: Using Helper Script
```bash
./scripts/submit-to-ubuntu-store.sh
```

Interactive menu with options:
- Create release tag
- Manual workflow trigger
- Check submission status

## 📺 Release Channel Strategy

### Channel Progression
```
edge → beta → candidate → stable
```

### Channel Purposes
- **edge**: Latest builds, automatic from main branch
- **beta**: Community testing, feedback gathering
- **candidate**: Release candidates, final testing
- **stable**: Production releases, general users

### Promoting Between Channels
```bash
# List revisions
snapcraft list-revisions bitcoinz-blue

# Promote revision to next channel
snapcraft release bitcoinz-blue <revision> <channel>

# Example: Promote revision 5 to stable
snapcraft release bitcoinz-blue 5 stable
```

## 🖼️ Store Listing Optimization

### After First Upload
1. **Visit Store Dashboard**: https://snapcraft.io/bitcoinz-blue/listing
2. **Add Screenshots** (required):
   - 📱 Main dashboard with balance
   - 💸 Send transaction screen
   - 📥 Receive screen with QR code
   - 📊 Transaction history
   - ⚙️ Settings page

3. **Optimize Description**:
   - Use content from `ubuntu-store-submission/STORE_DESCRIPTION.md`
   - Highlight key features
   - Include security information

4. **Set Metadata**:
   - **Category**: Finance
   - **Keywords**: bitcoin, cryptocurrency, wallet, btcz, bitcoinz, blockchain
   - **Contact**: GitHub issues link
   - **Website**: https://getbtcz.com

## 🔍 Monitoring & Management

### GitHub Actions Monitoring
```bash
# Check recent runs
gh run list --workflow=ubuntu-store.yml

# View specific run logs
gh run view <run-id> --log

# Watch live run
gh run watch
```

### Snapcraft Monitoring
```bash
# Check revisions
snapcraft list-revisions bitcoinz-blue

# Check releases
snapcraft list-releases bitcoinz-blue

# View metrics
snapcraft metrics bitcoinz-blue

# Check store status
snap info bitcoinz-blue
```

### Installation Testing
```bash
# Install from different channels
sudo snap install bitcoinz-blue --edge
sudo snap install bitcoinz-blue --beta
sudo snap install bitcoinz-blue --candidate
sudo snap install bitcoinz-blue --stable

# Check installed version
snap list bitcoinz-blue

# View app logs
snap logs bitcoinz-blue

# Remove for testing
sudo snap remove bitcoinz-blue
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
**Symptoms**: GitHub Actions workflow fails during build
**Solutions**:
- Check Node.js/Rust versions in workflow
- Verify all dependencies are available
- Review build logs for specific errors

#### 2. Credentials Issues
**Symptoms**: "Invalid credentials" error
**Solutions**:
- Re-export credentials: `snapcraft export-login`
- Update GitHub secret with new credentials
- Ensure secret name is exactly `SNAPCRAFT_STORE_CREDENTIALS`

#### 3. Name Registration
**Symptoms**: "Name not registered" error
**Solutions**:
- Run `snapcraft register bitcoinz-blue` locally
- Ensure you're logged in: `snapcraft login`
- Check if name is available

#### 4. Version Conflicts
**Symptoms**: "Version already exists" error
**Solutions**:
- Increment version in package.json
- Use `force_upload: true` in manual workflow
- Check existing revisions: `snapcraft list-revisions`

### Debug Commands
```bash
# Test snap locally
sudo snap install *.snap --dangerous --devmode

# Check snap structure
unsquashfs -l *.snap

# Validate snap
review-tools.snap-review *.snap

# Check desktop integration
snap run bitcoinz-blue
```

## 📊 Success Metrics

### Key Performance Indicators
- **Download Count**: Monitor via Snapcraft dashboard
- **User Ratings**: Respond to store reviews
- **Issue Reports**: Track GitHub issues
- **Community Feedback**: Monitor Discord/forums

### Store Optimization
- **Search Ranking**: Optimize keywords and description
- **Conversion Rate**: Improve screenshots and description
- **User Retention**: Monitor usage patterns
- **Update Adoption**: Track version distribution

## 🎯 Best Practices

### 1. Version Management
- Use semantic versioning consistently
- Update package.json before tagging
- Create meaningful release notes
- Test thoroughly before stable release

### 2. Quality Assurance
- Always test in edge channel first
- Get community feedback in beta
- Use candidate for final validation
- Monitor for issues after stable release

### 3. Community Engagement
- Announce releases to BitcoinZ community
- Respond to user feedback promptly
- Maintain clear documentation
- Provide multiple support channels

### 4. Security Practices
- Keep dependencies updated
- Monitor security advisories
- Respond quickly to vulnerabilities
- Maintain transparent communication

## 📞 Support Resources

### Technical Support
- **GitHub Issues**: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues
- **Workflow Logs**: GitHub Actions tab
- **Build Problems**: Check workflow YAML

### Snapcraft Support
- **Documentation**: https://snapcraft.io/docs
- **Forum**: https://forum.snapcraft.io/
- **Store Support**: https://snapcraft.io/contact

### Community Support
- **BitcoinZ Discord**: Community discussions
- **Developer Contact**: Through GitHub
- **User Guides**: Repository documentation

## 🎉 Conclusion

BitcoinZ Blue v1.1.0 is now **completely ready** for Ubuntu Store submission! 

### What You Have:
- ✅ **Automated Workflow**: GitHub Actions handles everything
- ✅ **Complete Documentation**: Step-by-step guides
- ✅ **Helper Scripts**: Easy-to-use automation tools
- ✅ **Version Consistency**: All references updated to v1.1.0
- ✅ **Store Configuration**: Optimized snap package
- ✅ **Security Compliance**: Meets all store requirements

### Next Steps:
1. **Run setup**: `./scripts/setup-ubuntu-store.sh`
2. **Submit**: Create release tag or use manual workflow
3. **Monitor**: Check GitHub Actions and store status
4. **Optimize**: Add screenshots and improve listing
5. **Promote**: Move through release channels
6. **Announce**: Share with BitcoinZ community

**🚀 You're ready to bring BitcoinZ Blue to millions of Ubuntu users!**

Good luck with your Ubuntu Store submission! 🎊
