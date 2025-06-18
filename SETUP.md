# BitcoinZ Light Wallet - Setup Guide

This guide will help you set up and run the BitcoinZ Light Wallet from source code.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js v14 or v16** (NOT v17+ due to OpenSSL compatibility)
   - Download from: https://nodejs.org/en/download/releases/
   - Or use nvm: `nvm install 16 && nvm use 16`

2. **Rust v1.62 or higher**
   - Install from: https://www.rust-lang.org/tools/install
   - Run: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

3. **Git**
   - Download from: https://git-scm.com/downloads

4. **Build Tools**
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Windows**: Visual Studio Build Tools or Visual Studio 2019+
   - **Linux**: `sudo apt-get install build-essential` (Ubuntu/Debian)

## Setup Instructions

### 1. Clone the Repositories

```bash
# Create a working directory
mkdir bitcoinz-dev && cd bitcoinz-dev

# Clone the main wallet repository
git clone https://github.com/ztx-protocol/bitcoinz-light-wallet.git

# Clone the required dependency (MUST be in the same parent directory)
git clone https://github.com/ztx-protocol/zecwallet-light-cli-bitcoinz.git

# Your directory structure should look like:
# bitcoinz-dev/
# ├── bitcoinz-light-wallet/
# └── zecwallet-light-cli-bitcoinz/
```

### 2. Install Dependencies

```bash
cd bitcoinz-light-wallet

# Install Node.js dependencies
yarn install

# Install cargo-cp-artifact globally
npm install -g cargo-cp-artifact
```

### 3. Build and Run

```bash
# Build the native Rust module
yarn neon

# Start the development server
yarn start
```

The wallet should now open in an Electron window and start syncing with the BitcoinZ network.

## Troubleshooting

### Node.js Version Issues

If you encounter an error like `error:0308010C:digital envelope routines::unsupported`, you're using Node.js v17+. Either:

1. Downgrade to Node.js v16:
   ```bash
   nvm install 16
   nvm use 16
   ```

2. Or the project has been configured to use legacy OpenSSL provider for compatibility.

### Build Errors

If the build fails:

1. Ensure both repositories are cloned in the same parent directory
2. Check that Rust is properly installed: `rustc --version`
3. On Windows, ensure you have Visual Studio Build Tools installed

### Native Module Issues

If you see "Did not copy cdylib:bitcoinz-wallet-lite":

1. The build script has been updated to handle this automatically
2. If it still fails, manually copy the library:
   ```bash
   # macOS
   cp native/target/release/libbitcoinz_wallet_lite.dylib src/native.node
   
   # Linux
   cp native/target/release/libbitcoinz_wallet_lite.so src/native.node
   
   # Windows
   copy native\target\release\bitcoinz_wallet_lite.dll src\native.node
   ```

## Building Distributions

To create installable packages:

```bash
# macOS
yarn dist:mac

# Windows
yarn dist:win

# Linux
yarn dist:linux
```

The built packages will be in the `dist/` directory.

## Development Notes

- The wallet uses a hybrid architecture: Electron (frontend) + Rust (crypto/backend)
- Default server connections are configured for the BitcoinZ network
- Private keys are encrypted and stored locally
- The wallet supports both transparent (t1) and shielded (zs) addresses

## Support

If you encounter issues:

1. Check the console output for error messages
2. Ensure all prerequisites are correctly installed
3. Open an issue at: https://github.com/ztx-protocol/bitcoinz-light-wallet/issues