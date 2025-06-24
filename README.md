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

**Important:** macOS may show security warnings for unsigned applications. Follow these steps:

#### **Method 1: Right-click to Open (Easiest)**
1. Download the appropriate ZIP file for your Mac:
   - **Apple Silicon (M1/M2/M3):** `BitcoinZ Blue-1.0.0-arm64-mac.zip`
   - **Intel Macs:** `BitcoinZ Blue-1.0.0-x64-mac.zip`
2. Extract the ZIP file
3. **Right-click** on `BitcoinZ Blue.app` → **Open**
4. Click **"Open"** when macOS asks for confirmation
5. The app will now run normally

#### **Method 2: Remove Quarantine (Advanced)**
```bash
# Remove quarantine from the app
sudo xattr -rd com.apple.quarantine "/Applications/BitcoinZ Blue.app"

# Or remove from ZIP before extracting
xattr -d com.apple.quarantine "BitcoinZ Blue-1.0.0-arm64-mac.zip"
```

#### **Method 3: System Preferences**
1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"** if the app was blocked
3. Enter your password when prompted

### 🪟 Windows Installation Instructions

**Important:** Windows may show security warnings for new software publishers. This is normal and safe to bypass.

#### **Method 1: Windows Defender SmartScreen (Most Common)**
1. Download `BitcoinZ Blue Setup 1.0.0.exe`
2. If Windows shows "Windows protected your PC":
   - Click **"More info"**
   - Click **"Run anyway"**
3. Follow the installation wizard

#### **Method 2: Antivirus Software Warnings**
1. If your antivirus blocks the download:
   - Check our **VirusTotal report** (0 detections from 70+ engines)
   - Add BitcoinZ Blue to your antivirus whitelist
   - Download again
2. The software is digitally signed and verified safe

#### **Method 3: Corporate/Enterprise Environments**
1. Show IT department our **security audit reports**
2. Provide **VirusTotal scan results** (all clean)
3. Reference **Sigstore signatures** for cryptographic verification
4. All source code is available on GitHub for review

#### **Verification for Windows Users**
```powershell
# Check digital signature
Get-AuthenticodeSignature "BitcoinZ Blue Setup 1.0.0.exe"

# Verify file hash (compare with GitHub release)
Get-FileHash "BitcoinZ Blue Setup 1.0.0.exe" -Algorithm SHA256
```

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
