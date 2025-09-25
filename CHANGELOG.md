# Changelog

## v2.0.0 (2025-09-25)

Major release with protocol upgrades, key management improvements, and multiple critical fixes.

### Breaking/Important Changes
- Switch to z-bitcoinz forks of librustzcash and orchard to support >21M BTCZ supply
- Enable HD address discovery on restore, improving wallet restoration reliability

### Key Management & UX
- Export Private Keys modal redesigned: structured list, wallet order, 16/16 truncation
- Copy actions: per-item Copy Key/Copy Line, Copy All, Download .txt
- Copy success feedback for all copy actions
- Import: accept BitcoinZ HRPs (btcz-secret-extended-key-main, btczxviews)
- Import: accept transparent WIF keys (K/L/5…)

### Amounts & Conversions
- Correct zatoshis→BTCZ conversion for balance change detection
- Fix large amount handling up to 21 billion BTCZ
- Fix “Too Many Decimals” in currency conversions

### Build & CI
- CI: install protoc on all platforms; use system protoc on macOS
- Windows: fix “Missing inputs” transaction error
- macOS/Windows/Linux: small build reliability improvements
- TypeScript cleanups and misc fixes

### Misc
- Logo/rescan display fixes
- Docs updates

Full changelog: https://github.com/z-bitcoinz/BitcoinZ_Blue/compare/v1.2.6...v2.0.0

