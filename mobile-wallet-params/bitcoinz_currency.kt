// BitcoinZ Currency and Price Configuration
// Extracted from working BitcoinZ Blue desktop wallet

object BitcoinZCurrency {
    // CoinGecko integration
    const val COINGECKO_ID = "bitcoinz"
    const val PRICE_API_URL = "https://api.coingecko.com/api/v3/simple/price"
    
    // Supported fiat currencies
    val SUPPORTED_CURRENCIES = mapOf(
        "USD" to "$",
        "EUR" to "€",
        "GBP" to "£",
        "JPY" to "¥",
        "CAD" to "C$",
        "AUD" to "A$",
        "CHF" to "CHF",
        "CNY" to "¥",
        "KRW" to "₩",
        "BTC" to "₿"
    )
    
    // Price fetching
    fun getPriceApiUrl(currencies: List<String>): String {
        val currencyList = currencies.joinToString(",") { it.lowercase() }
        return "$PRICE_API_URL?ids=$COINGECKO_ID&vs_currencies=$currencyList"
    }
    
    // Formatting
    fun formatBtczAmount(amount: Double): String {
        return String.format("%.8f BTCZ", amount)
    }
    
    fun formatFiatAmount(amount: Double, currency: String): String {
        val symbol = SUPPORTED_CURRENCIES[currency] ?: currency
        return String.format("$symbol%.2f", amount)
    }
}
