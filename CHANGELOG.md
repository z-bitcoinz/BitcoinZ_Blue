# Changelog

## v2.1.0 (2025-10-06)

Major privacy enhancement - **Full Tor network support with SOCKS5 proxy integration**.

### 🧅 Tor & Privacy Features
- **NEW:** Complete Tor/SOCKS5 proxy support for anonymous connections
- **NEW:** BitcoinZ Tor Hidden Service server option in server list
- **NEW:** Automatic proxy configuration when selecting Tor server
- **NEW:** Comprehensive Tor documentation in Help section
- Rust backend implements SOCKS5 connectivity via hyper-socks2
- Native RPC command `setproxy` for dynamic proxy configuration
- Electron settings persistence for proxy preferences

### 🔧 Technical Implementation
**Rust Backend (lib/):**
- Added SOCKS5 support to GrpcConnector with hyper-socks2
- New ProxyConfig struct with enabled/url fields
- Updated LightClientConfig to include proxy_config
- Modified fetch_compact_blocks.rs to use proxy-aware connectors
- Created SetProxyCommand for proxy management via RPC

**Frontend (src/):**
- Added RPC.setProxy() method for JavaScript integration
- Updated ServerSelectModal with "BitcoinZ Tor Hidden Service" option
- Automatic proxy enable/disable based on server selection
- Added comprehensive Tor troubleshooting guide in Help.tsx

**Dependencies:**
- Added: `hyper-socks2@0.8`, `tower@0.4`, `hyper@0.14`
- Native module size: 66.5 MB (optimized release build)

### 🌐 Network Privacy
- Connect via Tor hidden service: `http://e4lxxtpwqfhbkdio6uq7lwcovwmoh624xj3itzjmctfm7hiartadd7qd.onion:9067`
- Default SOCKS5 proxy: `127.0.0.1:9050` (standard Tor port)
- Custom .onion server support via Custom Server option
- Full gRPC-over-Tor compatibility verified

### 📚 Documentation
- New "🧅 Tor Support & Privacy" section in Help
- Step-by-step Tor setup instructions
- Troubleshooting guide for common Tor issues
- Privacy best practices combining Tor + shielded addresses

### ✅ Compatibility
- Maintains full backward compatibility with regular servers
- Tor optional - wallet works normally without Tor installation
- No breaking changes to existing functionality
- All previous features remain intact

---

## v2.0.3 (2025-10-06)

Major security improvements - **85% reduction in critical npm vulnerabilities** without breaking changes.

### 🔒 Security Enhancements
- **MAJOR:** Fixed 22 of 26 critical npm vulnerabilities (85% reduction: 26 → 4)
- Removed deprecated 'request' package - eliminated 5 critical vulnerabilities
- Updated immer (8.0.1 → 10.1.3) - fixed 2 critical prototype pollution vulnerabilities
- Updated shell-quote (1.7.2 → 1.8.3) - fixed 1 critical command injection vulnerability
- Applied 28 automated safe security updates via `npm audit fix`
- Overall vulnerability reduction: 179 → 146 (18% improvement)

### 📊 Security Audit Results
| Severity | Before | After | Improvement |
|----------|--------|-------|-------------|
| Critical | 26 | 4 | **-22 (85%)** |
| High | 70 | 34 | -36 (51%) |
| Moderate | 58 | 102 | +44* |
| Low | 25 | 6 | -19 (76%) |
| **Total** | **179** | **146** | **-33 (18%)** |

*Note: Some high-severity issues were reclassified as moderate in newer advisories

### 🛡️ Security Impact
- **Production Security:** ✅ Excellent - All remaining critical vulnerabilities are in dev/build tools only
- **Wallet Core:** Unaffected - Rust cryptography, key management, and transaction signing remain secure
- **User Data:** Safe - No vulnerabilities affect runtime wallet operations

### 🧹 Code Cleanup
- Removed unused download functionality from LoadingScreen.tsx
- Cleaned up deprecated package dependencies
- Updated package overrides for better dependency security

### 📝 Technical Changes
**Dependencies:**
- Removed: `request`, `progress-stream` (deprecated packages)
- Added direct dependencies: `cipher-base`, `pbkdf2`
- Added npm overrides: `immer@^10.1.3`, `shell-quote@^1.8.3`
- Updated: 28 packages via automated security fixes

**Documentation:**
- Added comprehensive `SECURITY_AUDIT.md` with detailed vulnerability analysis
- Documented remaining vulnerabilities and mitigation strategies
- Included recommendations for future maintenance

### ✅ Testing & Verification
- Native Rust module builds successfully
- Production build completes without errors
- No functionality lost (removed code was unused)
- TypeScript compilation clean
- All existing features work as expected

### 🔄 Migration Notes
- No action required - all changes are backward compatible
- Builds may require `NODE_OPTIONS="--openssl-legacy-provider"` on Node.js 17+ (already handled in scripts)
- No user-facing changes or feature modifications

### 📚 Additional Information
See `SECURITY_AUDIT.md` for complete security analysis and recommendations.

Compare: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v2.0.2...v2.0.3

---

## v2.0.2 (2025-10-05)

Critical bug fixes for private key import, new Full Rescan feature, and enhanced documentation.

### 🔥 Critical Fixes
- **CRITICAL:** Fixed missing funds after private key import - wallet now correctly scans from imported key's birthday, not wallet's birthday (4edaeab)
- Added birthday-aware rescan with `rescanfromheight` command for custom height rescanning
- Users can now set birthday to 0 to scan entire blockchain (safest option)
- Enhanced import modal with comprehensive birthday explanation and collapsible help section

### ✨ New Features
- **Full Rescan:** Added "Full Rescan (from Sapling activation)" option to scan from block 328,500 (028b2d0)
- Both rescan options now clearly labeled in menu:
  - "Rescan (from wallet birthday)" - Quick rescan from wallet creation
  - "Full Rescan (from Sapling activation)" - Complete rescan ensuring all transactions found
- Informative modal explains Full Rescan process when triggered

### 📚 Documentation
- Added comprehensive "Understanding Spendable Balance (How Notes Work)" section in Help (4e2f514)
- Added "Importing Private Keys & Wallet Birthday" guide
- Explains UTXO/note system and why balance changes after sending
- Common troubleshooting scenarios for imports and rescans
- Detailed rescan process documentation

### 🎨 UI/UX Improvements
- Removed confusing 'Spendable now' display from Dashboard for cleaner UI (3c73d51)
- Better balance presentation and user understanding
- Enhanced import workflow with visual feedback

### 📝 Technical Changes
**Backend (Rust):**
- New `do_full_rescan()` method - rescans from Sapling activation
- New `do_rescan_from_height(height)` - rescans from custom block height
- New `FullRescanCommand` and `RescanFromHeightCommand` for CLI access
- Enhanced native bindings for new rescan commands

**Frontend (TypeScript/React):**
- New `RPC.doFullRescan()` and `RPC.doRescanFromHeight(height)` methods
- Enhanced import modal with birthday help section
- Informative modals for rescan operations
- Updated electron menu with clear rescan option labels
- IPC handlers for fullrescan events

### 🔄 Migration Notes
- Users with missing funds after importing keys should use "Full Rescan"
- When importing private keys, always specify correct birthday or use 0
- Both rescan options available in File menu

Compare: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v2.0.0...v2.0.2

---

## v2.0.1 (2025-09-30)

Minor UI improvements for balance display.

### Improved
- Deduct pending change from Spendable Funds to prevent overspending after send (5de69a3)
- Show 'Spendable now' on Dashboard for clarity

### Docs
- Note PIN/lock state remembered across app restarts (25b2a83)

Compare: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v2.0.0...v2.0.1

---

## v2.0.0 (2025-09-25)

Major release with protocol upgrades, improved wallet restoration, expanded key import/export, large-amount handling, and extensive stability/build fixes.

### Highlights
- Protocol: migrate to BTCZ forks of librustzcash and orchard to support >21M BTCZ supply (f504bed)
- Reliability: enable HD address discovery on restore for full account recovery (970925d)
- Keys/UX: redesigned export modal with Copy/Copy Line/Copy All/Download and copy feedback (b25f9dd, 6705afd)

### Breaking/Important
- Switch to BitcoinZ-specific forks for Zcash/Orchard crates to remove upstream 21M cap (f504bed)
- HD address discovery on restore; increases initial scan and applies BIP44 gap rules (970925d)

### Added
- Import transparent private keys (WIF K/L/5…) (a06c98b)
- Accept BitcoinZ HRPs in key import: btcz-secret-extended-key-main, btczxviews; keep Zcash-style HRPs for compatibility (20a8b48)
- Export modal: Copy All and Download .txt actions (b25f9dd)
- Remember PIN/lock state across app restarts (aa9f33b)

### Improved
- Private Keys export modal redesign: structured list, wallet order, 16/16 truncation; per-item Copy Key/Copy Line; visual copy feedback (b25f9dd, 6705afd)

### Fixed
- Correct zatoshis→BTCZ conversion in balance change detection (9e8f29b)
- Large-amount handling up to 21 billion BTCZ; string/bigint math to avoid precision loss (afb6226)
- EUR→BTCZ rounding to 8 decimals to prevent “Too many decimals” validation errors (7c456e9)
- Windows: fix “Missing inputs” transaction error with pre-broadcast UTXO validation and state updates (3059a61); add diagnostics (8243cdb)
- Windows: balance persistence after app restart; improved loading/recovery flow (6a3ba4a), syntax fix in LoadingScreen (094d92c)
- UI: fix missing logo during rescan; clean up noisy debug logs (f046a1b)
- TypeScript: remove invalid property and redundant private calls (a4b2042, 500548d)

### Build/CI
- Install protoc on all CI platforms and set PROTOC env; use system protoc on macOS to avoid CMake conflicts (f087d3f, c3c7741)
- macOS build: architecture separation; Windows: disable DevTools in production (3c4c3b1)

### Docs
- README: document large-amount support (80923a2)

Compare: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v1.2.6...v2.0.0

