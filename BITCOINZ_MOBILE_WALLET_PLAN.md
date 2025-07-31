# 📱 BitcoinZ Mobile Wallet Development Plan

## 🎯 Project Overview

**Goal**: Adapt Zashi Android wallet to create a native BitcoinZ mobile wallet using proven network parameters from BitcoinZ Blue desktop wallet.

**Base Repository**: https://github.com/Electric-Coin-Company/zashi-android.git
**Reference Implementation**: BitcoinZ Blue Desktop Wallet (this repository)

## 🔧 Key Network Parameters to Port

### **BitcoinZ Mainnet Configuration**
```kotlin
// From BitcoinZ Blue: lib/src/bitcoinz_params.rs
COIN_TYPE = 177                    // BIP44 coin type
SAPLING_ACTIVATION = 328_500       // Block height
BRANCH_ID = 0x76b809bb            // Sapling branch ID
ADDRESS_PREFIXES = "t1", "zs"     // Transparent, Shielded
DEFAULT_SERVER = "lightd.btcz.rocks:9067"
```

### **Network Endpoints**
```kotlin
// From BitcoinZ Blue: src/utils/utils.ts
PRIMARY_SERVER = "https://lightd.btcz.rocks:9067"
BACKUP_SERVER = "https://lightd.btcz.rocks:443"
LOCAL_SERVER = "http://localhost:9067"
```

### **Currency Integration**
```kotlin
// From BitcoinZ Blue: src/utils/currencyManager.ts
COINGECKO_ID = "bitcoinz"
API_ENDPOINT = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoinz"
EXPLORER_URL = "https://explorer.getbtcz.com"
```

## 📋 Step-by-Step Conversion Plan

### **Phase 1: Repository Setup (Day 1)**

1. **Fork Zashi Android**
   ```bash
   git clone https://github.com/Electric-Coin-Company/zashi-android.git
   cd zashi-android
   git remote add bitcoinz-origin https://github.com/z-bitcoinz/BitcoinZ-Mobile.git
   ```

2. **Rename Project**
   - App name: "BitcoinZ Blue Mobile"
   - Package: `com.bitcoinz.blue.mobile`
   - Bundle ID: `com.bitcoinz.blue`

3. **Update Branding**
   - Replace Zashi logos with BitcoinZ Blue branding
   - Update color scheme to BitcoinZ Blue theme
   - Change app icons and splash screens

### **Phase 2: Network Configuration (Day 2-3)**

1. **Update Network Parameters**
   ```kotlin
   // In configuration files
   object BitcoinZNetwork {
       const val COIN_TYPE = 177
       const val SAPLING_ACTIVATION_HEIGHT = 328_500L
       const val BRANCH_ID = 0x76b809bb
       const val NETWORK_NAME = "bitcoinz_mainnet"
   }
   ```

2. **Configure Lightwalletd Servers**
   ```kotlin
   // Server configuration
   val BITCOINZ_SERVERS = listOf(
       "https://lightd.btcz.rocks:9067",
       "https://lightd.btcz.rocks:443"
   )
   ```

3. **Address Format Updates**
   ```kotlin
   // Address validation
   fun isValidBitcoinZAddress(address: String): Boolean {
       return address.startsWith("t1") || address.startsWith("zs")
   }
   ```

### **Phase 3: SDK Integration (Day 4-5)**

1. **Zcash SDK Adaptation**
   - Fork `zcash-android-wallet-sdk`
   - Update network parameters for BitcoinZ
   - Modify consensus rules for BitcoinZ compatibility

2. **Sapling Parameters**
   ```kotlin
   // Embed Sapling parameters (from BitcoinZ Blue)
   object SaplingParams {
       const val SPEND_PARAMS_HASH = "8e48ffd23abb3a5fd9c5589204f32d9c31285a04b78096ba40a79b75677efc13"
       const val OUTPUT_PARAMS_HASH = "2f0ebbcbb9bb0bcffe95a397e7eba89c29eb4dde6191c339db88570e3f3fb0e4"
   }
   ```

3. **Transaction Building**
   - Adapt transaction creation for BitcoinZ
   - Ensure compatibility with BitcoinZ consensus rules
   - Test shielded transaction functionality

### **Phase 4: UI/UX Customization (Day 6-7)**

1. **BitcoinZ Blue Theme**
   ```xml
   <!-- colors.xml -->
   <color name="bitcoinz_blue_primary">#1e3c72</color>
   <color name="bitcoinz_blue_secondary">#2a5298</color>
   <color name="bitcoinz_blue_accent">#4a90e2</color>
   ```

2. **Currency Display**
   ```kotlin
   // Price integration
   class BitcoinZPriceProvider {
       suspend fun fetchPrice(): Double {
           // Use CoinGecko API for BitcoinZ price
           return api.getBitcoinZPrice()
       }
   }
   ```

3. **Explorer Integration**
   ```kotlin
   // Transaction explorer links
   fun getExplorerUrl(txId: String): String {
       return "https://explorer.getbtcz.com/#/tx/$txId"
   }
   ```

### **Phase 5: Testing & Validation (Day 8-9)**

1. **Network Connectivity**
   - Test connection to BitcoinZ lightwalletd servers
   - Validate block synchronization
   - Verify transaction broadcasting

2. **Address Generation**
   - Test transparent (t1) address creation
   - Test shielded (zs) address creation
   - Validate address derivation paths

3. **Transaction Testing**
   - Send transparent transactions
   - Send shielded transactions
   - Test auto-shielding functionality

### **Phase 6: Build & Distribution (Day 10)**

1. **Build Configuration**
   ```gradle
   android {
       defaultConfig {
           applicationId "com.bitcoinz.blue.mobile"
           versionName "1.0.0"
           versionCode 1
       }
   }
   ```

2. **Signing & Release**
   - Configure app signing
   - Generate release APK
   - Prepare for Google Play Store

## 🔄 Key Files to Modify

### **Network Configuration**
- `configuration-impl-android-lib/src/main/java/co/electriccoin/zcash/configuration/`
- `sdk-ext-lib/src/main/java/cash/z/ecc/sdk/`

### **UI Components**
- `ui-lib/src/main/res/values/strings.xml`
- `ui-lib/src/main/res/values/colors.xml`
- `ui-lib/src/main/res/drawable/`

### **App Configuration**
- `app/build.gradle.kts`
- `gradle.properties`
- `app/src/main/AndroidManifest.xml`

## 🎯 Success Criteria

### **Functional Requirements**
- ✅ Connect to BitcoinZ lightwalletd servers
- ✅ Generate BitcoinZ addresses (t1, zs)
- ✅ Send/receive BitcoinZ transactions
- ✅ Display BitcoinZ balance and history
- ✅ Show USD price from CoinGecko

### **Technical Requirements**
- ✅ Use BitcoinZ network parameters
- ✅ Compatible with BitcoinZ consensus rules
- ✅ Proper Sapling transaction support
- ✅ Secure key management
- ✅ Offline transaction signing

### **User Experience**
- ✅ BitcoinZ Blue branding
- ✅ Intuitive mobile interface
- ✅ Fast synchronization
- ✅ Transaction history
- ✅ QR code support

## 🚀 Timeline

**Total Estimated Time**: 10 days
- **Setup & Planning**: 1 day
- **Core Development**: 7 days
- **Testing & Polish**: 2 days

## 📞 Next Steps

1. **Clone Zashi Android repository**
2. **Set up development environment**
3. **Begin Phase 1: Repository Setup**
4. **Extract network parameters from BitcoinZ Blue**
5. **Start systematic conversion process**

**Ready to begin BitcoinZ Mobile Wallet development!** 🚀
