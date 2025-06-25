# BitcoinZ Blue

BitcoinZ Blue is a modern, z-Addr first, Sapling compatible light wallet client for BitcoinZ. It provides a clean, user-friendly interface with full support for all BitcoinZ features:

## ✨ Features

- 🔒 **Send + Receive fully shielded transactions**
- 💰 **Supports transparent addresses and transactions**
- 📝 **Full support for incoming and outgoing memos**
- 🔐 **Fully encrypt your private keys, using viewkeys to sync the blockchain**
- ⚡ **Lightning-fast sync** - Syncs in seconds, not hours
- 🎨 **Modern UI design** - Clean, intuitive interface
- 🌐 **Cross-platform support** - Windows, macOS, and Linux
- 📁 **Separate data storage** - Won't conflict with full node wallets
- 💱 **Real-time price data** - Integrated CoinGecko price feeds

## 📥 Download

Download compiled binaries from our [release page](https://github.com/z-bitcoinz/BitcoinZ_Blue/releases)

### Available Downloads
- **Windows:** Setup installer (recommended) and portable ZIP
- **macOS:** Application bundle (Intel and Apple Silicon)
- **Linux:** AppImage (portable) and DEB package

### 🍎 macOS Installation Instructions

**✅ Good News: No more "damaged app" errors!** Thanks to our new ad-hoc code signing, macOS will no longer show the "damaged and can't be opened" error. You may still see an "unidentified developer" warning on first launch.

#### **Method 1: Right-click to Open (Recommended)**
1. Download the appropriate ZIP file for your Mac:
   - **Apple Silicon (M1/M2/M3):** `BitcoinZ Blue-*-arm64-mac.zip`
   - **Intel Macs:** `BitcoinZ Blue-*-x64-mac.zip`
2. Extract the ZIP file
3. **Right-click** on `BitcoinZ Blue.app` → **Open**
4. Click **"Open"** when macOS shows the security dialog
5. The app will open normally from now on

#### **Alternative: System Settings**
1. Try to open the app normally (double-click)
2. When blocked, go to **System Settings** → **Privacy & Security**
3. Look for BitcoinZ Blue and click **"Open Anyway"**
4. Enter your password when prompted

#### **Advanced: Command Line**
```bash
# If the above methods don't work
sudo spctl --add --label "BitcoinZ Blue" "/Applications/BitcoinZ Blue.app"
sudo spctl --enable --label "BitcoinZ Blue"
```

For more details, see our [macOS Security Guide](MACOS_SECURITY.md)

### 🪟 Windows Installation Instructions

**✅ Enhanced Security:** BitcoinZ Blue now includes enhanced self-signed certificates and Sigstore signatures for improved security verification.

#### **Method 1: Windows Defender SmartScreen**
1. Download `BitcoinZ Blue Setup *.exe`
2. If Windows shows "Windows protected your PC":
   - Click **"More info"**
   - Click **"Run anyway"**
3. This is normal for new publishers and only happens once

#### **Method 2: Verify Our Signatures**
```powershell
# Check our digital signature
Get-AuthenticodeSignature "BitcoinZ Blue Setup.exe" | Format-List

# Certificate is included with each release for transparency
```

#### **Additional Verification: Sigstore**
All releases include Sigstore signatures for cryptographic verification:
```bash
# Verify with cosign (https://github.com/sigstore/cosign)
cosign verify-blob --certificate="app.pem" --signature="app.sig" "app.exe"
```

For IT administrators and security details, see our [Windows Security Guide](WINDOWS_SECURITY.md)

## 🔐 Code Signing & Security

BitcoinZ Blue uses **free code signing solutions** to ensure security without expensive certificates:

- **macOS:** Ad-hoc signing prevents "damaged app" errors
- **Windows:** Enhanced self-signed certificates for integrity
- **All Platforms:** Sigstore signatures for cryptographic verification

Learn more: [Code Signing Documentation](CODE_SIGNING.md)

## 🔒 Privacy

While all the keys and transaction detection happens on the client, the server can learn what blocks contain your shielded transactions. The server also learns other metadata about you like your IP address etc. Also remember that t-addresses don't provide any privacy protection.

## 📊 Note Management

BitcoinZ Blue does automatic note and UTXO management, which means it doesn't allow you to manually select which address to send outgoing transactions from. It follows these principles:

- Defaults to sending shielded transactions, even if you're sending to a transparent address
- Sapling funds need at least 5 confirmations before they can be spent
- Can select funds from multiple shielded addresses in the same transaction
- Will automatically shield your transparent funds at the first opportunity
- When sending an outgoing transaction to a shielded address, BitcoinZ Blue can decide to use the transaction to additionally shield your transparent funds (i.e., send your transparent funds to your own shielded address in the same transaction)

## 🛠️ Compiling from Source

⚠️ **IMPORTANT:** Please follow the detailed setup guide for complete instructions.

### Quick Start

BitcoinZ Blue requires specific setup steps to build from source:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/z-bitcoinz/BitcoinZ_Blue.git
   cd BitcoinZ_Blue
   ```

2. **Install prerequisites:**
   - Node.js v14 or v16 (NOT v17+ due to OpenSSL compatibility)
   - Rust v1.62+
   - Build tools for your platform

3. **Build and run:**
   ```bash
   yarn install
   npm install -g cargo-cp-artifact
   yarn start
   ```

For detailed instructions, troubleshooting, and platform-specific requirements, see [SETUP.md](SETUP.md).

## 🌐 BitcoinZ Network Parameters

- **Coin Type:** 177 (BIP44)
- **Sapling Activation:** Block 328,500
- **Branch ID:** 0x76b809bb (Sapling)
- **Address Prefixes:** t1 (transparent), zs (shielded)
- **Default Server:** lightd.btcz.rocks:9067

## 📁 Data Storage

BitcoinZ Blue uses separate data directories to avoid conflicts with full node wallets:

- **Windows:** `%LOCALAPPDATA%\BitcoinZ-LightWallet\`
- **macOS:** `~/Library/Application Support/BitcoinZ-LightWallet/`
- **Linux:** `~/.bitcoinz-lightwallet/`

## 🏗️ Credits

This wallet is based on Zecwallet Lite and adapted for the BitcoinZ network with modern enhancements and BitcoinZ-specific optimizations.

## 🐛 Bug Reports

Report issues at: [GitHub Issues](https://github.com/z-bitcoinz/BitcoinZ_Blue/issues)

## 📄 License

BitcoinZ Blue is a community project released under the MIT License.

---

**Note:** BitcoinZ Blue is a community-driven project focused on providing secure, private, and user-friendly wallet solutions for the BitcoinZ ecosystem.
