# 🆓 Free Code Signing for Open Source Projects

## 📋 Overview

While most code signing requires payment, there are some special programs and workarounds for open source projects to get free or reduced-cost signing.

## 🍎 macOS Free Signing Options

### 1. **Apple Developer Program for Open Source**
Unfortunately, Apple does NOT offer free Developer accounts for open source projects. The $99/year fee applies to everyone.

### 2. **Open Source Signing Services**

#### SignPath.io
- **Free tier** for open source projects
- Supports Windows code signing
- Does NOT support macOS signing
- Requirements: Public GitHub repo, active development

#### GitHub Actions Self-Hosted Runners
Some organizations share their Apple Developer certificates:
- Run builds on their infrastructure
- Must trust the organization
- Very rare and usually for major projects

### 3. **Community Certificates**
Some open source communities share certificates:
- **Homebrew**: Distributes signed apps
- **MacPorts**: Similar to Homebrew
- Must be accepted into their repositories

### 4. **Alternative Distribution Methods**

#### Homebrew Cask (Recommended)
```ruby
cask "bitcoinz-blue" do
  version "1.0.6"
  sha256 "YOUR_SHA256"
  
  url "https://github.com/z-bitcoinz/BitcoinZ_Blue/releases/download/v#{version}/BitcoinZ-Blue.dmg"
  name "BitcoinZ Blue"
  
  app "BitcoinZ Blue.app"
end
```
- No signing required
- Homebrew handles installation
- Users trust Homebrew

## 🪟 Windows Free Signing Options

### 1. **SignPath.io (Free for Open Source)**
```yaml
# .github/workflows/build.yml
- name: Sign with SignPath
  uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: ${{ secrets.SIGNPATH_API_TOKEN }}
    organization-id: YOUR_ORG_ID
    project-slug: YOUR_PROJECT
    signing-policy-slug: opensource-signing
    artifact-configuration-slug: windows-exe
```

### 2. **Certum Open Source Certificate**
- ~$30/year (heavily discounted)
- Requires open source license
- Hardware token required

### 3. **Sigstore (Experimental)**
```yaml
- name: Sign with Sigstore
  uses: sigstore/cosign-installer@v3
- run: |
    cosign sign-blob --bundle app.exe.bundle app.exe
```

## 🐧 Linux Signing

### 1. **GPG Signing (Free)**
```bash
gpg --armor --detach-sign app.AppImage
```

### 2. **Sigstore**
Already implemented in your workflow!

## 🎯 Best Practices for Open Source

### 1. **Current Best Approach**
Your current implementation is actually the standard for open source:
- Ad-hoc signing for macOS
- Sigstore for verification
- Clear documentation
- User education

### 2. **What Major Projects Do**

#### Electron
- Uses ad-hoc signing
- Provides clear instructions
- Users accept security warnings

#### VS Code (Microsoft)
- Microsoft pays for certificates
- But VS Code forks use ad-hoc

#### Brave Browser
- Pays for full signing
- Funded by company

### 3. **The Reality**
Most open source projects:
- Use ad-hoc signing
- Provide fix scripts
- Document the process
- Wait for donations to pay for certs

## 🚀 Recommended Strategy

### Phase 1: Current (Free)
✅ What you have now:
- Ad-hoc signing
- DMG distribution
- Fix scripts
- Documentation

### Phase 2: Growing Project
When you get donations/sponsors:
1. Apple Developer ($99/year)
2. Windows EV Certificate ($300/year)

### Phase 3: Alternative
Consider web-based wallet:
- No signing issues
- PWA for desktop-like experience
- Lower barrier for users

## 📝 Template for README

```markdown
## Installation

### macOS Users
Due to Apple's policies, open source projects face signing challenges:

1. Download the DMG
2. Right-click → Open (bypasses security warning)
3. If you see "damaged app" after installing:
   - Run the included fix script
   - Or: `sudo xattr -cr "/Applications/BitcoinZ Blue.app"`

We're an open source project and don't pay Apple's $99/year fee.
Consider donating to help us get proper signing!

### Why No "Verified" Signature?
- Apple charges $99/year for signing
- We're a community project with no funding
- Your security: Check our source code on GitHub
- Alternative: Install via Homebrew (coming soon)
```

## 🎉 Conclusion

Your current solution is the industry standard for unfunded open source projects. The "damaged app" issue is unfortunate but expected without paying Apple. Focus on:

1. **Clear documentation** ✅ (You have this)
2. **Easy fix scripts** ✅ (You have this)
3. **Consider Homebrew** distribution
4. **Accept donations** for future signing

There's no magical free signing for macOS - even major open source projects face this issue!
