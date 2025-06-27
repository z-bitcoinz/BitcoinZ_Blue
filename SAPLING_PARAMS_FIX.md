# Sapling Parameters Fix

## Summary

Fixed the "missing Sapling parameters" error that was preventing shielded transactions. The solution works across all platforms (macOS, Linux, Windows).

## What Was Done

### 1. Embedded Parameters (Primary Solution)
- Updated `native/Cargo.toml` to enable the `embed_params` feature by default
- Updated build script to pass `--features embed_params` to cargo
- This embeds the 50MB parameter files directly in the native module
- No external files needed - works on all platforms

### 2. Fallback Parameter Setup Script
- Created `scripts/setup-params.js` for users who need external parameters
- Automatically detects the correct directory per platform:
  - **macOS**: `~/Library/Application Support/BitcoinZ-LightWallet-Params/`
  - **Windows**: `%APPDATA%/BitcoinZ-LightWallet-Params/`
  - **Linux**: `~/.bitcoinz-lightwallet-params/`
- Can copy from development directory or download from Zcash servers
- Verifies SHA256 hashes for security

## How It Works

### With Embedded Parameters (Default)
1. Parameters are compiled into the native module during build
2. No external files needed
3. Works immediately after installation
4. Slightly larger binary size (~50MB increase)

### With External Parameters (Fallback)
1. Run `node scripts/setup-params.js`
2. Script creates platform-specific directory
3. Copies or downloads parameter files
4. Verifies integrity with SHA256 hashes

## Testing

To test sending shielded transactions:
1. Rebuild the native module: `yarn neon`
2. Start the wallet
3. Send to a shielded address (zs1...)
4. Transaction should complete without parameter errors

## Platform Compatibility

✅ **macOS**: Embedded parameters + fallback to Application Support
✅ **Windows**: Embedded parameters + fallback to AppData
✅ **Linux**: Embedded parameters + fallback to home directory

## Benefits

- **No manual setup** - Parameters embedded by default
- **Cross-platform** - Same solution works everywhere
- **Secure** - SHA256 verification prevents tampering
- **Flexible** - Can use embedded or external parameters
- **Developer-friendly** - Parameters in repo for easy development