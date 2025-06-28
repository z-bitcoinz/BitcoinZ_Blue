# BitcoinZ Blue v1.0.9 Release

## 🎉 Major Improvements

### ✨ Cross-Platform Enhancements
- **Fixed Linux Window Visibility**: App window now properly displays on Linux systems
- **Fixed Windows Module Loading**: Resolved "fs.existsSync is not a function" error
- **Fixed Windows Logo Display**: Logo now loads correctly with proper asset paths
- **Improved macOS DMG Creation**: Fixed x64 DMG artifact naming for better compatibility

### 🔐 Privacy Features
- **Automatic Sapling Parameters Setup**: First-run setup now automatically downloads and verifies privacy parameters
- **Cross-Platform Parameter Management**: Works seamlessly on Windows, macOS, and Linux
- **User-Friendly Setup Messages**: Clear progress indicators during parameter download

### 🚀 Performance & UX
- **Faster Sync Messages**: Updated to reflect light wallet speed - "Usually takes just a few minutes"
- **Simplified Progress Messages**: Cleaner download progress (e.g., "23 MB / 50 MB")
- **Better Error Handling**: Helpful error messages with link to getbtcz.com/support

### 🐛 Bug Fixes
- Fixed electron-builder configuration errors
- Fixed TypeScript linting issues in CI/CD
- Fixed Debian package post-install scripts
- Fixed native module loading in production builds
- Removed unused variables causing build failures

## 📦 Installation

### Windows
Download: `BitcoinZ-Blue-Setup-1.0.9.exe`

### macOS
- Apple Silicon (M1/M2): `BitcoinZ Blue-1.0.9-arm64.dmg`
- Intel: `BitcoinZ Blue-1.0.9-x64.dmg`

### Linux
- Debian/Ubuntu: `bitcoinz-wallet-lite_1.0.9_amd64.deb`
- AppImage: `BitcoinZ-Blue-1.0.9.AppImage`
- Snap: `bitcoinz-wallet-lite_1.0.9_amd64.snap`

## 🔧 Technical Details

- Node.js 16 compatibility
- Embedded Sapling parameters with automatic fallback
- Improved Electron security with hardened runtime
- Native module compiled per platform
- Fixed LD_LIBRARY_PATH for Linux desktop integration

## 📝 Notes

This release focuses on cross-platform compatibility and user experience improvements. All platforms now have consistent behavior for parameter setup and asset loading.

---

**Full Changelog**: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v1.0.8...v1.0.9