# BitcoinZ Mobile Wallet Parameters

This directory contains all network parameters and configuration extracted from the working BitcoinZ Blue desktop wallet.

## Files Generated

1. **bitcoinz_network_params.kt** - Core network parameters (coin type, activation heights, etc.)
2. **bitcoinz_servers.kt** - Lightwalletd server configuration
3. **bitcoinz_currency.kt** - Price API and currency formatting
4. **bitcoinz_explorer.kt** - Blockchain explorer integration
5. **bitcoinz_sapling.kt** - Sapling parameter configuration
6. **bitcoinz_app_config.kt** - App-specific configuration
7. **build_gradle_config.gradle** - Android build configuration

## Usage

Copy these files to your Zashi Android fork and adapt them for BitcoinZ mobile wallet development.

## Verification

All parameters have been extracted from the working BitcoinZ Blue desktop wallet and are proven to work with the BitcoinZ network.

## Next Steps

1. Fork Zashi Android repository
2. Replace Zcash parameters with BitcoinZ parameters
3. Update branding and UI
4. Test network connectivity
5. Build and distribute

Generated from BitcoinZ Blue v1.1.0
