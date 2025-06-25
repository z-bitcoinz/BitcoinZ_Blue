# 🐛 Fix for Windows "Not a Valid Win32 Application" Error

## 🔍 Root Cause

The error occurs because:
1. The native Rust module (`.node` file) is platform-specific
2. When built on macOS, it creates a `.dylib` file
3. When built on Windows, it needs a `.dll` file
4. The current build copies the macOS binary to all platforms

## ❌ The Error

```
Uncaught Error: \\?\C:\Users\...\native-15dd7fb3aa072d22681582abe63d4a76.node is not a valid Win32 application.
```

## ✅ Solutions

### Solution 1: Build on Each Platform (Recommended)

The native module MUST be built on the target platform:
- macOS builds → macOS binary (.dylib)
- Windows builds → Windows binary (.dll)
- Linux builds → Linux binary (.so)

### Solution 2: Fix GitHub Actions

Update `.github/workflows/build-and-sign.yml` to ensure each platform builds its own native module:

```yaml
# Windows build job
- name: Build native module for Windows
  run: |
    cd native
    cargo build --release --target x86_64-pc-windows-msvc
    copy target\release\bitcoinz_wallet_lite.dll ..\src\native.node
```

### Solution 3: Cross-Compilation (Advanced)

Install cross-compilation toolchains:
```bash
# On macOS, to build for Windows:
rustup target add x86_64-pc-windows-gnu
brew install mingw-w64

# Build for Windows
cargo build --release --target x86_64-pc-windows-gnu
```

## 🛠️ Immediate Fix

### For Local Development

1. **On Windows Machine:**
```powershell
# Install Rust if not present
# Download from https://rustup.rs/

# Build the native module
cd native
cargo build --release
copy target\release\bitcoinz_wallet_lite.dll ..\src\native.node

# Then build the app
cd ..
yarn build
yarn dist:win
```

2. **For macOS Users Building for Windows:**
Cannot build Windows native modules on macOS without cross-compilation setup.

### Fix the Build Process

Update `scripts/build-native.js` to handle platform differences better:

```javascript
// Add platform check
if (process.platform === 'win32' && !fs.existsSync(libPath)) {
  console.error('ERROR: Windows native module not found!');
  console.error('Windows builds must be done on Windows or with cross-compilation.');
  process.exit(1);
}
```

## 📋 Proper Multi-Platform Build Setup

### 1. Use GitHub Actions (Already Set Up)
- Each OS builds its own native module
- No cross-compilation needed
- Most reliable method

### 2. Update package.json Scripts
```json
"scripts": {
  "build:native:win": "cd native && cargo build --release --target x86_64-pc-windows-msvc",
  "build:native:mac": "cd native && cargo build --release",
  "build:native:linux": "cd native && cargo build --release"
}
```

### 3. Pre-built Binaries
Store pre-built native modules for each platform:
```
native-modules/
  ├── win32-x64/
  │   └── native.node
  ├── darwin-x64/
  │   └── native.node
  ├── darwin-arm64/
  │   └── native.node
  └── linux-x64/
      └── native.node
```

## 🎯 Action Items

1. **Immediate**: Users must build on their target platform
2. **Short-term**: Update build scripts to detect platform mismatches
3. **Long-term**: Set up proper cross-compilation or use pre-built binaries

## 💡 Why This Happens

Electron apps with native modules are complex because:
- JavaScript/TypeScript code is cross-platform
- Native Rust/C++ modules are platform-specific
- Each platform needs its own compiled binary
- Cross-compilation is difficult to set up

## ✅ Verification

After fixing, the native module should:
- Be a `.dll` file on Windows
- Be a `.dylib` file on macOS
- Be a `.so` file on Linux
- Match the target architecture (x64, arm64, etc.)

## 🚨 Important Note

**You cannot use a macOS-built app on Windows!** Each platform needs its own build.
