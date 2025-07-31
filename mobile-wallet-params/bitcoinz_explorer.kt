// BitcoinZ Blockchain Explorer Configuration
// Extracted from working BitcoinZ Blue desktop wallet

object BitcoinZExplorer {
    // Official BitcoinZ explorer
    const val BASE_URL = "https://explorer.getbtcz.com"
    
    // URL builders
    fun getTransactionUrl(txId: String): String {
        return "$BASE_URL/#/tx/$txId"
    }
    
    fun getAddressUrl(address: String): String {
        return "$BASE_URL/#/address/$address"
    }
    
    fun getBlockUrl(blockHeight: Long): String {
        return "$BASE_URL/#/block/$blockHeight"
    }
    
    // Deep link support
    fun createTransactionDeepLink(txId: String): String {
        return "bitcoinz://explorer/tx/$txId"
    }
    
    fun createAddressDeepLink(address: String): String {
        return "bitcoinz://explorer/address/$address"
    }
}
