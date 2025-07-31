// BitcoinZ Network Parameters for Android
// Extracted from working BitcoinZ Blue desktop wallet

object BitcoinZNetworkParams {
    // Core network parameters
    const val COIN_TYPE = 177                    // BIP44 coin type
    const val SAPLING_ACTIVATION_HEIGHT = 328_500L  // Block height
    const val BRANCH_ID = 0x76b809bb            // Sapling branch ID
    
    // Address prefixes
    const val TRANSPARENT_PREFIX = "t1"          // Transparent addresses
    const val SHIELDED_PREFIX = "zs"            // Shielded addresses
    
    // Network identifiers
    const val NETWORK_NAME = "bitcoinz_mainnet"
    const val CURRENCY_CODE = "BTCZ"
    const val CURRENCY_SYMBOL = "BTCZ"
    
    // Address validation
    fun isValidTransparentAddress(address: String): Boolean {
        return address.startsWith("t1") && address.length >= 34
    }
    
    fun isValidShieldedAddress(address: String): Boolean {
        return address.startsWith("zs") && address.length >= 78
    }
    
    fun isValidBitcoinZAddress(address: String): Boolean {
        return isValidTransparentAddress(address) || isValidShieldedAddress(address)
    }
}
