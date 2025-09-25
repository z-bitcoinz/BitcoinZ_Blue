# Changelog

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

