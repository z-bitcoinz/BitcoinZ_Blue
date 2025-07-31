// BitcoinZ Lightwalletd Server Configuration
// Extracted from working BitcoinZ Blue desktop wallet

object BitcoinZServers {
    // Primary servers (working and tested)
    const val PRIMARY_SERVER = "https://lightd.btcz.rocks:9067"
    const val BACKUP_SERVER = "https://lightd.btcz.rocks:443"
    const val LOCAL_SERVER = "http://localhost:9067"
    
    // Server list for mobile wallet
    val AVAILABLE_SERVERS = listOf(
        ServerConfig("BitcoinZ Official", PRIMARY_SERVER, true),
        ServerConfig("BitcoinZ Backup", BACKUP_SERVER, false),
        ServerConfig("Local Node", LOCAL_SERVER, false)
    )
    
    data class ServerConfig(
        val name: String,
        val url: String,
        val isDefault: Boolean
    )
    
    // Connection settings
    const val CONNECTION_TIMEOUT = 30_000L      // 30 seconds
    const val READ_TIMEOUT = 60_000L           // 60 seconds
    const val RETRY_ATTEMPTS = 3
    
    // SSL/TLS settings
    const val USE_SSL = true
    const val VERIFY_CERTIFICATES = true
}
