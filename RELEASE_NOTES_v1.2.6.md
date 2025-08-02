# BitcoinZ Blue v1.2.6 - Major Release

## 🎉 Executive Summary

BitcoinZ Blue v1.2.6 is a major release featuring significant improvements since v1.0.9. This release brings a complete UI/UX overhaul, enhanced security features, multi-currency support, contact backup functionality, and extensive platform-specific improvements. With over 80 commits worth of enhancements, this is our most comprehensive update yet.

## ✨ Major New Features

### 📇 Contact Management System
- **NEW: Contact Backup & Restore** - Export and import your address book
- **Export Contacts**: Save all contacts to a JSON file with automatic date-stamped naming
- **Import Contacts**: Restore from backup with intelligent duplicate detection
- **Smart Validation**: Automatic validation of addresses during import

### 💱 Multi-Currency Support
- **Currency Settings**: Support for multiple fiat currencies
- **Price Display**: Real-time price updates in your preferred currency
- **Header Integration**: Optional price display in the main header
- **Persistent Settings**: Currency preferences saved across sessions

### 🎨 Complete UI/UX Overhaul
- **Modern Interface**: Completely redesigned with improved aesthetics
- **Enhanced PIN Settings**: Beautiful new PIN protection interface
- **Improved Layouts**: Compact, responsive designs with better contrast
- **Professional About Section**: Updated branding and information display
- **Tab-based Help**: Organized help content with intuitive navigation

### 🔐 Security Improvements
- **Enhanced PIN Protection**: Improved UI for PIN management
- **Simplified Security**: Removed auto-lock based on user feedback
- **Manual Lock Control**: Full control with manual lock and lock-on-close
- **Secure Data Paths**: Fixed wallet data path handling

## 🛠️ Platform-Specific Enhancements

### 🍎 macOS
- **Developer ID Signing**: Complete notarization setup for trusted distribution
- **Ad-hoc Signing**: Eliminates "damaged app" errors
- **Universal Binary**: Full support for Intel and Apple Silicon (M1/M2/M3)
- **DMG Improvements**: Enhanced DMG creation and distribution

### 🐧 Linux
- **Ubuntu Store Ready**: Fully prepared snap package for store distribution
- **Enhanced Packaging**: Fixed snap creation with proper checksums
- **Desktop Integration**: Improved .desktop file and icon handling
- **Multi-Distribution**: Support for Debian, Ubuntu, Fedora, and more

### 🪟 Windows
- **Enhanced Security**: Improved self-signed certificates
- **SmartScreen**: Better compatibility with Windows security
- **Installer Updates**: Improved setup experience

## 🐛 Bug Fixes & Improvements

### User Interface
- Fixed white page issues with modern transaction loader
- Removed double scrollbar in Receive page
- Fixed settings menu UI inconsistencies
- Improved action button placement for better accessibility
- Fixed contrast issues throughout the application
- Removed non-functional menu items

### Functionality
- Fixed BitcoinZ explorer links in receive page
- Corrected version mismatches across components
- Fixed wallet data path issues
- Resolved permission problems in snap creation
- Fixed npm registry issues with retry logic

### Build System
- Updated to Node.js 18 for better compatibility
- Fixed OpenSSL legacy provider issues with Webpack 4
- Enhanced GitHub Actions workflows
- Improved certificate handling and auto-discovery
- Fixed Rust compilation warnings
- Automated artifact building process

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

## 🚀 Migration Guide

### Upgrading from v1.0.9
1. **Backup Your Wallet**: Always backup your wallet.dat before upgrading
2. **Export Contacts**: After upgrading, use Settings → Contacts Backup to export
3. **Currency Settings**: Configure your preferred display currency in Settings
4. **Security Review**: Review PIN settings (auto-lock has been removed)

### New Features to Explore
- Open Settings to access the new contact backup system
- Configure multi-currency display options
- Explore the redesigned Help section with tabs
- Enjoy the improved UI throughout the application

## 📊 Technical Details

### Dependencies
- Node.js 18 (required for development)
- Electron 13 with React 17
- Rust toolchain for native modules
- Enhanced build pipeline

### Compatibility
- **Linux**: Ubuntu 20.04+, Debian 11+, Fedora 35+
- **Windows**: Windows 10/11 (x64, x86)
- **macOS**: macOS 10.15+ (Intel and Apple Silicon)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Network**: Internet connection for blockchain sync

## 🔄 What Changed (Summary)

### Since v1.0.9
- **80+ commits** of improvements and fixes
- **Complete UI redesign** with modern aesthetics
- **New contact management** system with backup/restore
- **Multi-currency support** throughout the app
- **Enhanced security** with improved PIN interface
- **Platform improvements** for all operating systems
- **Build system overhaul** for reliability

### Breaking Changes
- Auto-lock functionality removed (by user request)
- Some menu items removed (non-functional items cleaned up)

## 🆘 Support

### Getting Help
- **GitHub Issues**: https://github.com/z-bitcoinz/BitcoinZ_Blue/issues
- **Community**: BitcoinZ Discord and forums
- **Documentation**: Updated help section within the app

### Known Issues
- None currently reported for this release

## 🙏 Acknowledgments

Thank you to all contributors and the BitcoinZ community for their continued support and feedback. This major release incorporates numerous community suggestions and improvements.

---

**Full Changelog**: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v1.0.9...v1.2.6

**Highlights**:
- 🎨 Complete UI/UX overhaul
- 📇 Contact backup and restore
- 💱 Multi-currency support
- 🔐 Enhanced security features
- 🚀 Major platform improvements