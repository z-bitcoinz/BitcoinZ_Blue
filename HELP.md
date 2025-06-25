# 📚 BitcoinZ Blue - User Help Guide

## 🚀 Welcome to BitcoinZ Blue!

BitcoinZ Blue is a modern, cross-platform light wallet designed specifically for BitcoinZ. This guide will help you understand how the wallet works and answer common questions.

## 🏗️ Quick Start

### 📥 Installation
1. **Download** the appropriate version for your platform from [GitHub Releases](https://github.com/z-bitcoinz/BitcoinZ_Blue/releases)
2. **Install** following platform-specific instructions below
3. **Launch** the application
4. **Create** a new wallet or **restore** from seed phrase

### 🖥️ Platform-Specific Setup

#### 🍎 **macOS**
- **Apple Silicon (M1/M2/M3)**: Download `BitcoinZ-Blue-macOS-AppleSilicon`
- **Intel Macs**: Download `BitcoinZ-Blue-macOS-Intel`
- **First launch**: Go to System Preferences → Security & Privacy → Allow app

#### 🪟 **Windows**
- **Installer (Recommended)**: Download `BitcoinZ-Blue-Windows-Installer.exe`
- **Portable**: Download `BitcoinZ-Blue-Windows-Portable.zip`
- **SmartScreen warning**: Click "More info" → "Run anyway"

#### 🐧 **Linux**
- **Universal**: Download `BitcoinZ-Blue-Linux-AppImage` (make executable: `chmod +x`)
- **Debian/Ubuntu**: Download `BitcoinZ-Blue-Linux-DEB` (install: `sudo dpkg -i`)

## 🔐 Understanding Address Types

### 🔓 **Transparent Addresses (T-addresses)**
- **Format**: Start with `t1...`
- **Privacy**: **Public** - all transactions visible on blockchain
- **Speed**: Fast - spendable after 1 confirmation (~2.5 minutes)
- **Use case**: Exchanges, public transactions

### 🔒 **Shielded Addresses (Z-addresses)**
- **Format**: Start with `zs1...`
- **Privacy**: **Private** - amounts and recipients hidden
- **Speed**: Fast - received funds spendable after 1 confirmation (~2.5 minutes)
- **Auto-shield**: Funds moved by wallet need 2 confirmations (~5 minutes)
- **Use case**: Private transactions, long-term storage

## 🔄 Auto-Shielding: Why Your Funds Move Automatically

### 🛡️ **What is Auto-Shielding?**
BitcoinZ Blue automatically moves funds from transparent (T) to shielded (Z) addresses for your privacy and security.

### 🎯 **Why Does This Happen?**
- **Privacy Protection**: Hide your balance and transaction history
- **Security Enhancement**: Shielded funds are cryptographically protected
- **Best Practice**: Follows privacy-first principles
- **Automatic**: No manual privacy management needed

### ⏰ **When Does Auto-Shielding Occur?**
- **When you make a transaction** - T-address balance automatically moves to Z-address
- After receiving funds to a T-address
- During wallet sync operations
- When you have sufficient balance (> fee amount)

### 💰 **Your Funds Stay Safe**
- ✅ Funds move to **YOUR** shielded addresses
- ✅ Same wallet, same total balance
- ✅ Only a small fee (~0.0001 BTCZ) is deducted
- ✅ Better privacy and security

## ⏱️ Confirmation Requirements

### 🔓 **Transparent Funds**
- **Spendable after**: 1 confirmation (~2.5 minutes)
- **Best for**: Quick transactions, exchange deposits

### 📨 **Received Shielded Funds**
- **Spendable after**: 1 confirmation (~2.5 minutes)
- **When**: Someone sends directly to your Z-address

### 🔄 **Auto-Shielded Funds**
- **Spendable after**: 2 confirmations (~5 minutes)
- **When**: Wallet moves your T-address balance to Z-address during transactions
- **Reason**: Enhanced cryptographic security for wallet-generated transactions

### 📊 **Balance Display**
```
Total: 1,000.00 BTCZ ($50.00)
├── Available: 800.00 BTCZ (ready to spend)
└── Confirming: 200.00 BTCZ (need 1 more confirmation)
```

## 💸 Sending Transactions

### 📤 **How to Send**
1. **Click** "Send" in bottom navigation
2. **Enter** recipient address (T or Z)
3. **Enter** amount to send
4. **Add** memo (optional, for Z-addresses only)
5. **Review** transaction details
6. **Confirm** and send

### 🎯 **Transaction Types**
- **T → T**: Fast, public transaction
- **T → Z**: Fast send, recipient gets privacy
- **Z → T**: Private send, public receipt
- **Z → Z**: Fully private transaction

### 💰 **Fees**
- **Standard fee**: ~0.0001 BTCZ per transaction
- **Auto-calculated**: Included in transaction total
- **Network fee**: Required for blockchain processing

## 📱 Wallet Features

### 🏠 **Home Screen**
- **Total Balance**: Combined T + Z address balances
- **USD Value**: Real-time price conversion
- **Recent Transactions**: Latest activity
- **Sync Status**: Connection and block height

### 📨 **Receive**
- **Generate addresses**: Create new T or Z addresses
- **QR codes**: Easy mobile scanning
- **Address filtering**: Show only private or transparent
- **Copy addresses**: One-click copying

### 📋 **Transactions**
- **Complete history**: All wallet transactions
- **Transaction details**: Amounts, fees, confirmations
- **Status indicators**: Confirming, confirmed, failed
- **Export**: Save transaction history as CSV

### 👥 **Contacts**
- **Address book**: Save frequently used addresses
- **Easy sending**: Select from contact list
- **Import/Export**: Backup your contacts

## 🔧 Settings & Configuration

### ⚙️ **Wallet Settings**
- **Server**: lightd.btcz.rocks:9067 (default)
- **Currency**: USD price display
- **Privacy**: Auto-shielding preferences
- **Backup**: Seed phrase and wallet file

### 🔒 **Security Settings**
- **Encryption**: Password-protect wallet
- **Seed phrase**: 24-word recovery backup
- **Auto-lock**: Automatic wallet locking
- **Verification**: Address and amount confirmation

## 🆘 Troubleshooting

### 🔄 **Sync Issues**
- **Check connection**: Ensure internet connectivity
- **Server status**: Try restarting wallet
- **Firewall**: Allow wallet through firewall
- **VPN**: May interfere with connection

### 💸 **Transaction Problems**
- **Insufficient balance**: Check available (not confirming) balance
- **Invalid address**: Verify recipient address format
- **Network congestion**: Transactions may take longer
- **Fee too low**: Use recommended fee amount

### 🔐 **Access Issues**
- **Forgot password**: Use seed phrase to restore
- **Corrupted wallet**: Restore from backup
- **Missing transactions**: Resync wallet
- **Balance incorrect**: Wait for full sync completion

## 🛡️ Security Best Practices

### 🔑 **Seed Phrase Security**
- ✅ **Write down** your 24-word seed phrase
- ✅ **Store safely** in multiple secure locations
- ✅ **Remember wallet birthday** (creation date) for faster restoration
- ✅ **Never share** with anyone
- ✅ **Test recovery** before storing large amounts

#### 🎂 **What is Wallet Birthday?**
Your wallet birthday is the date when you first created your wallet. This information is crucial for efficient wallet restoration:

**Why it matters:**
- **Faster restoration**: Wallet only scans blocks from birthday forward
- **Less bandwidth**: Skip downloading unnecessary old blockchain data
- **Quicker sync**: Get your restored wallet working much sooner
- **Efficiency**: No need to check transactions before wallet existed

**Best practice**: Write down your wallet creation date along with your seed phrase. For example:
```
Seed Phrase: abandon ability able about above absent absorb abstract...
Birthday: 2024-01-15 (or block height: 850000)
```

### 💻 **Computer Security**
- ✅ **Keep updated**: Update wallet regularly
- ✅ **Antivirus**: Use reputable security software
- ✅ **Secure network**: Avoid public WiFi for transactions
- ✅ **Backup wallet**: Regular wallet file backups

### 🔒 **Privacy Tips**
- ✅ **Use Z-addresses**: For maximum privacy
- ✅ **Avoid address reuse**: Generate new addresses
- ✅ **Memo encryption**: Use encrypted memos
- ✅ **Network privacy**: Consider VPN usage

## 📞 Support & Community

### 🐛 **Report Issues**
- **GitHub Issues**: [BitcoinZ_Blue Issues](https://github.com/z-bitcoinz/BitcoinZ_Blue/issues)
- **Bug reports**: Include wallet version and error details
- **Feature requests**: Suggest improvements

### 💬 **Community Support**
- **Discord**: BitcoinZ community channels
- **Telegram**: BitcoinZ support groups
- **Reddit**: r/BitcoinZ subreddit
- **Forum**: Official BitcoinZ forums

### 📖 **Additional Resources**
- **GitHub**: [Source code and releases](https://github.com/z-bitcoinz/BitcoinZ_Blue)
- **Website**: Official BitcoinZ website
- **Documentation**: Technical documentation
- **Blog**: Development updates and news

## ❓ Frequently Asked Questions

### **Q: Why did my funds move automatically?**
A: Auto-shielding moved your funds from transparent to shielded addresses for privacy protection. Your funds are safe in your wallet.

### **Q: Why can't I spend my shielded funds immediately?**
A: It depends on how you got them:
- **Received directly**: Ready after 1 confirmation (~2.5 minutes)
- **Auto-shielded**: Ready after 2 confirmations (~5 minutes) for enhanced security

### **Q: Is my wallet connecting to the right server?**
A: Yes, BitcoinZ Blue connects to lightd.btcz.rocks:9067, the official BitcoinZ lightwalletd server.

### **Q: How do I backup my wallet?**
A: Write down your 24-word seed phrase and store it securely. This can restore your entire wallet.

### **Q: Can I use the same wallet on multiple devices?**
A: Yes, restore your wallet using the same seed phrase on different devices.

### **Q: What is wallet birthday and why do I need it?**
A: Wallet birthday is your wallet creation date. When restoring from seed phrase, providing this date makes restoration much faster by skipping old blockchain data that doesn't contain your transactions.

---

## 🎯 Quick Reference

### 📱 **Navigation**
- **Home**: 🏠 Main dashboard and balance
- **Send**: 📤 Send BitcoinZ transactions  
- **Receive**: 📨 Generate receiving addresses
- **Transactions**: 📋 Transaction history
- **Contacts**: 👥 Address book management
- **Settings**: ⚙️ Wallet configuration

### ⌨️ **Keyboard Shortcuts**
- **Ctrl/Cmd + R**: Refresh/Resync
- **Ctrl/Cmd + S**: Settings
- **Ctrl/Cmd + C**: Copy address
- **Ctrl/Cmd + V**: Paste address

### 🔢 **Important Numbers**
- **Block time**: ~2.5 minutes average
- **T-address confirmations**: 1 block (~2.5 min)
- **Z-address confirmations**: 2 blocks (~5 min)
- **Standard fee**: ~0.0001 BTCZ
- **Total supply**: 21 billion BTCZ

---

**BitcoinZ Blue - Modern. Secure. Private.** 💙

*For technical support, visit our [GitHub repository](https://github.com/z-bitcoinz/BitcoinZ_Blue) or join the BitcoinZ community.*
