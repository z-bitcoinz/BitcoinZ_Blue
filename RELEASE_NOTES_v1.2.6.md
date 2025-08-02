# BitcoinZ Blue v1.2.6 Release

## 🎉 New Features & Improvements

### ✨ Contact Management Enhancements
- **Contact Backup & Restore**: Export and import your contacts for easy backup and migration
- **Export Contacts**: Save all your contacts to a JSON file with a single click
- **Import Contacts**: Restore contacts from backup files with automatic duplicate detection
- **Smart Import**: Skips duplicate contacts and provides detailed import statistics

### 🔐 Security Updates
- **Removed Auto-lock**: Auto-lock functionality has been removed per user feedback
- **Manual Lock Control**: Retain full control with manual lock and lock-on-close features
- **PIN Protection**: Continue using 4-digit PIN for wallet security

### 🛠️ Technical Improvements
- **Version Update**: Updated to v1.2.6 across all components
- **Settings Menu**: Reorganized settings with new Contacts Backup section
- **User Experience**: Simplified security settings for better usability

## 📦 Installation

### 🐧 Linux
- **Snap Package**: `bitcoinz-wallet-lite_1.2.6_amd64.snap`
- **Debian Package**: `bitcoinz-wallet-lite_1.2.6_amd64.deb`
- **AppImage**: `BitcoinZ-Blue-1.2.6.AppImage`

### 🪟 Windows
- **Setup Installer**: `BitcoinZ Blue Setup 1.2.6.exe`
- **Portable ZIP**: `BitcoinZ-Blue-1.2.6-win.zip`

### 🍎 macOS
- **Apple Silicon (M1/M2/M3)**: `BitcoinZ Blue-1.2.6-arm64.dmg`
- **Intel CPUs**: `BitcoinZ Blue-1.2.6-x64.dmg`

## 🔧 What's Changed

### Contact Backup Feature
The new contact backup and restore functionality allows you to:
1. **Export Contacts**: Click "Export Contacts" in Settings to save all contacts
2. **Import Contacts**: Click "Import Contacts" to restore from a backup file
3. **Automatic Naming**: Export files are automatically named with the current date
4. **JSON Format**: Human-readable format for easy verification

### Security Settings Update
- Removed auto-lock timer functionality based on user feedback
- Maintained manual lock and lock-on-close features
- Simplified security settings interface

### File Format
Exported contact files use the following JSON structure:
```json
[
  {
    "label": "Contact Name",
    "address": "BitcoinZ Address"
  }
]
```

## 📊 Compatibility

### Supported Platforms
- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 35+
- **Windows**: Windows 10/11 (x64, x86)
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection for blockchain sync
- **Node.js**: v14 or v16 for development (NOT v17+)

## 🚀 Migration Guide

### From Previous Versions
1. Your existing contacts are automatically available
2. We recommend exporting contacts as a backup after upgrading
3. All wallet data and settings are preserved

### Contact Migration
1. Open Settings → Contacts Backup
2. Click "Export Contacts" to create a backup
3. Save the JSON file in a secure location
4. To restore: Click "Import Contacts" and select your backup file

## 🛡️ Security Notes

### PIN Protection
- Your 4-digit PIN continues to protect wallet access
- Lock-on-close feature remains available
- Manual lock provides immediate security when needed

### Backup Security
- Contact files contain only public addresses and labels
- No private keys or sensitive data in exports
- Store backup files securely like any personal data

## 🆘 Support

### Getting Help
- **GitHub Issues**: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues
- **Community**: BitcoinZ Discord and forums
- **Documentation**: Complete guides in repository

### Known Issues
- None reported in this release

## 📝 Developer Notes

### Building from Source
```bash
# Install dependencies
yarn install

# Build native module
yarn neon

# Start development
yarn start

# Build for production
yarn build
```

### Changes for Developers
- Removed auto-lock interval from `LockContext.tsx`
- Added contact backup/import handlers to `SettingsModal.tsx`
- Updated version to 1.2.6 in `package.json`

---

**Full Changelog**: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v1.1.0...v1.2.6

**Contact Backup**: Easy export and import of your address book
**Security**: Simplified settings with manual lock control
**Cross-Platform**: Consistent experience across all platforms