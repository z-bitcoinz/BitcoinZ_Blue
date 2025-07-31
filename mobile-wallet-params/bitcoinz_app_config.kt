// BitcoinZ Mobile App Configuration
// Extracted from working BitcoinZ Blue desktop wallet

object BitcoinZAppConfig {
    // App identity
    const val APP_NAME = "BitcoinZ Blue Mobile"
    const val PACKAGE_NAME = "com.bitcoinz.blue.mobile"
    const val VERSION_NAME = "1.0.0"
    const val VERSION_CODE = 1
    
    // Branding
    const val PRIMARY_COLOR = "#1e3c72"          // BitcoinZ Blue
    const val SECONDARY_COLOR = "#2a5298"        // Lighter blue
    const val ACCENT_COLOR = "#4a90e2"           // Accent blue
    
    // Data storage
    const val WALLET_DATA_DIR = "bitcoinz-lightwallet"
    const val DATABASE_NAME = "bitcoinz_wallet.db"
    const val PREFERENCES_NAME = "bitcoinz_prefs"
    
    // Security
    const val MIN_CONFIRMATIONS = 1              // Received funds
    const val SHIELD_CONFIRMATIONS = 2           // Auto-shielded funds
    const val SESSION_TIMEOUT = 300_000L         // 5 minutes
    
    // Features
    const val SUPPORTS_UNIFIED_ADDRESSES = false // BitcoinZ doesn't support UA
    const val SUPPORTS_ORCHARD = false           // BitcoinZ doesn't support Orchard
    const val SUPPORTS_SAPLING = true            // BitcoinZ supports Sapling
    const val AUTO_SHIELD_ENABLED = true         // Auto-shield transparent funds
}
