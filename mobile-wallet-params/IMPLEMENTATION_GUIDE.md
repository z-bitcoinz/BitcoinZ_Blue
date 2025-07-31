# 🚀 BitcoinZ Mobile Wallet Implementation Guide

## 📱 Step-by-Step Implementation

### **Prerequisites**
- Android Studio Arctic Fox or later
- JDK 11 or later
- Git
- Working BitcoinZ Blue desktop wallet (for reference)

## 🔧 Phase 1: Project Setup

### **1. Clone and Setup Zashi Android**
```bash
# Clone the base repository
git clone https://github.com/Electric-Coin-Company/zashi-android.git bitcoinz-mobile
cd bitcoinz-mobile

# Create new remote for BitcoinZ
git remote add bitcoinz https://github.com/z-bitcoinz/BitcoinZ-Mobile.git

# Create development branch
git checkout -b bitcoinz-mobile-dev
```

### **2. Update Project Identity**
```bash
# Update gradle.properties
sed -i 's/ZCASH_RELEASE_APP_NAME=.*/ZCASH_RELEASE_APP_NAME=BitcoinZ Blue Mobile/' gradle.properties
sed -i 's/ZCASH_RELEASE_PACKAGE_NAME=.*/ZCASH_RELEASE_PACKAGE_NAME=com.bitcoinz.blue.mobile/' gradle.properties

# Update app/build.gradle.kts
# Replace applicationId with "com.bitcoinz.blue.mobile"
```

### **3. Replace Branding Assets**
```bash
# Remove Zashi/Zcash branding
rm -rf ui-lib/src/main/res/common/ic_launcher*
rm -rf ui-lib/src/main/res/drawable/ic_*

# Add BitcoinZ Blue assets (copy from desktop wallet)
# - App icons
# - Splash screens  
# - Logo assets
```

## 🌐 Phase 2: Network Configuration

### **1. Update Network Parameters**

**File**: `configuration-impl-android-lib/src/main/java/co/electriccoin/zcash/configuration/AndroidConfigurationFactory.kt`

```kotlin
// Replace Zcash network parameters
object BitcoinZConfiguration {
    const val NETWORK_NAME = "bitcoinz_mainnet"
    const val COIN_TYPE = 177
    const val SAPLING_ACTIVATION_HEIGHT = 328_500L
    
    // Server configuration
    val DEFAULT_SERVERS = listOf(
        "https://lightd.btcz.rocks:9067",
        "https://lightd.btcz.rocks:443"
    )
}
```

### **2. Update SDK Configuration**

**File**: `sdk-ext-lib/src/main/java/cash/z/ecc/sdk/ext/ZcashSdk.kt`

```kotlin
// Update for BitcoinZ
object BitcoinZSdk {
    const val COIN_TYPE = 177
    const val SAPLING_ACTIVATION_HEIGHT = 328_500L
    
    // Address validation
    fun isValidBitcoinZAddress(address: String): Boolean {
        return address.startsWith("t1") || address.startsWith("zs")
    }
}
```

### **3. Server Configuration**

**File**: `app/src/main/java/co/electriccoin/zcash/ui/configuration/RemoteConfig.kt`

```kotlin
// BitcoinZ server endpoints
object BitcoinZServers {
    val PRODUCTION_SERVERS = listOf(
        "https://lightd.btcz.rocks:9067",
        "https://lightd.btcz.rocks:443"
    )
    
    val TESTNET_SERVERS = listOf(
        "http://localhost:9067"
    )
}
```

## 💰 Phase 3: Currency Integration

### **1. Price Provider**

**File**: `app/src/main/java/co/electriccoin/zcash/ui/screen/home/model/ExchangeRateProvider.kt`

```kotlin
class BitcoinZPriceProvider {
    private val apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoinz&vs_currencies=usd"
    
    suspend fun fetchPrice(): Double {
        // Implementation to fetch BitcoinZ price from CoinGecko
        return api.getBitcoinZPrice()
    }
}
```

### **2. Currency Formatting**

**File**: `ui-lib/src/main/java/co/electriccoin/zcash/ui/screen/home/model/WalletDisplayValues.kt`

```kotlin
// Update currency display for BitcoinZ
fun formatBitcoinZAmount(amount: Long): String {
    val btczAmount = amount / 100_000_000.0 // Convert satoshis to BTCZ
    return String.format("%.8f BTCZ", btczAmount)
}
```

## 🔍 Phase 4: Explorer Integration

### **1. Transaction Explorer**

**File**: `ui-lib/src/main/java/co/electriccoin/zcash/ui/screen/history/model/TransactionUi.kt`

```kotlin
// BitcoinZ explorer integration
fun getTransactionExplorerUrl(txId: String): String {
    return "https://explorer.getbtcz.com/#/tx/$txId"
}

fun getAddressExplorerUrl(address: String): String {
    return "https://explorer.getbtcz.com/#/address/$address"
}
```

## 🎨 Phase 5: UI Customization

### **1. Color Scheme**

**File**: `ui-lib/src/main/res/values/colors.xml`

```xml
<!-- BitcoinZ Blue theme -->
<color name="bitcoinz_blue_primary">#1e3c72</color>
<color name="bitcoinz_blue_secondary">#2a5298</color>
<color name="bitcoinz_blue_accent">#4a90e2</color>
<color name="bitcoinz_blue_background">#0f1419</color>
```

### **2. String Resources**

**File**: `ui-lib/src/main/res/values/strings.xml`

```xml
<!-- Update app strings -->
<string name="app_name">BitcoinZ Blue</string>
<string name="currency_symbol">BTCZ</string>
<string name="currency_name">BitcoinZ</string>
<string name="support_email">support@getbtcz.com</string>
```

### **3. App Theme**

**File**: `ui-lib/src/main/res/values/themes.xml`

```xml
<!-- BitcoinZ Blue theme -->
<style name="Theme.BitcoinZBlue" parent="Theme.Material3.DayNight">
    <item name="colorPrimary">@color/bitcoinz_blue_primary</item>
    <item name="colorSecondary">@color/bitcoinz_blue_secondary</item>
    <item name="colorAccent">@color/bitcoinz_blue_accent</item>
</style>
```

## 🔐 Phase 6: Security & Validation

### **1. Address Validation**

**File**: `sdk-ext-lib/src/main/java/cash/z/ecc/sdk/ext/AddressValidation.kt`

```kotlin
// BitcoinZ address validation
fun isValidBitcoinZAddress(address: String): Boolean {
    return when {
        address.startsWith("t1") -> isValidTransparentAddress(address)
        address.startsWith("zs") -> isValidShieldedAddress(address)
        else -> false
    }
}
```

### **2. Transaction Validation**

**File**: `sdk-ext-lib/src/main/java/cash/z/ecc/sdk/ext/TransactionValidation.kt`

```kotlin
// BitcoinZ transaction validation
fun validateBitcoinZTransaction(tx: Transaction): Boolean {
    // Implement BitcoinZ-specific validation rules
    return true
}
```

## 🧪 Phase 7: Testing

### **1. Network Tests**
```kotlin
@Test
fun testBitcoinZServerConnection() {
    // Test connection to lightd.btcz.rocks:9067
}

@Test
fun testAddressGeneration() {
    // Test t1 and zs address generation
}

@Test
fun testTransactionCreation() {
    // Test BitcoinZ transaction creation
}
```

### **2. Integration Tests**
```kotlin
@Test
fun testWalletSync() {
    // Test wallet synchronization with BitcoinZ network
}

@Test
fun testPriceProvider() {
    // Test CoinGecko price fetching
}
```

## 📦 Phase 8: Build & Distribution

### **1. Build Configuration**

**File**: `app/build.gradle.kts`

```kotlin
android {
    defaultConfig {
        applicationId = "com.bitcoinz.blue.mobile"
        versionName = "1.0.0"
        versionCode = 1
        
        // BitcoinZ configuration
        buildConfigField("String", "NETWORK", "\"bitcoinz_mainnet\"")
        buildConfigField("String", "DEFAULT_SERVER", "\"https://lightd.btcz.rocks:9067\"")
    }
}
```

### **2. Release Build**
```bash
# Build release APK
./gradlew assembleRelease

# Generate signed APK
./gradlew bundleRelease
```

## ✅ Verification Checklist

### **Network Connectivity**
- [ ] Connects to lightd.btcz.rocks:9067
- [ ] Syncs with BitcoinZ blockchain
- [ ] Validates BitcoinZ addresses

### **Wallet Functionality**
- [ ] Generates t1 addresses
- [ ] Generates zs addresses  
- [ ] Sends transparent transactions
- [ ] Sends shielded transactions
- [ ] Displays transaction history

### **UI/UX**
- [ ] BitcoinZ Blue branding
- [ ] Correct currency display (BTCZ)
- [ ] Price integration (CoinGecko)
- [ ] Explorer links work

### **Security**
- [ ] Private keys encrypted
- [ ] Secure transaction signing
- [ ] Address validation works
- [ ] No data leaks

## 🚀 Launch Preparation

1. **Internal Testing** (1-2 weeks)
2. **Beta Testing** (2-3 weeks)
3. **Google Play Store Submission**
4. **Community Release**

**Total Development Time**: 2-3 weeks
**Total Testing Time**: 3-4 weeks
**Launch Timeline**: 6-8 weeks

## 📞 Support

- **Technical Issues**: GitHub Issues
- **Community**: BitcoinZ Discord
- **Documentation**: This guide + Zashi docs

**Ready to build the BitcoinZ Mobile Wallet!** 🚀
