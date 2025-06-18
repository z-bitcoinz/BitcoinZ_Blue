# BitcoinZ Light Wallet

BitcoinZ Light Wallet is a z-Addr first, Sapling compatible lightwallet client for BitcoinZ. It has full support for all BitcoinZ features:
- Send + Receive fully shielded transactions  
- Supports transparent addresses and transactions
- Full support for incoming and outgoing memos
- Fully encrypt your private keys, using viewkeys to sync the blockchain
- Successfully tested with both t-to-z and z-to-z transactions

## Download
Download compiled binaries from our [release page](https://github.com/ztx-protocol/bitcoinz-light-wallet/releases)

## Privacy
* While all the keys and transaction detection happens on the client, the server can learn what blocks contain your shielded transactions.
* The server also learns other metadata about you like your ip address etc...
* Also remember that t-addresses don't provide any privacy protection.


### Note Management
BitcoinZ Wallet Lite does automatic note and utxo management, which means it doesn't allow you to manually select which address to send outgoing transactions from. It follows these principles:
* Defaults to sending shielded transactions, even if you're sending to a transparent address
* Sapling funds need at least 5 confirmations before they can be spent
* Can select funds from multiple shielded addresses in the same transaction
* Will automatically shield your transparent funds at the first opportunity
    * When sending an outgoing transaction to a shielded address, BitcoinZ Wallet Lite can decide to use the transaction to additionally shield your transparent funds (i.e., send your transparent funds to your own shielded address in the same transaction)

## Compiling from source
BitcoinZ Light Wallet is written in Electron/Javascript and can be built from source. It will also automatically compile the Rust SDK needed to run the wallet.

#### Pre-Requisites
You need to have the following software installed before you can build BitcoinZ Light Wallet

* [Node.js v14 or higher](https://nodejs.org) 
* [Rust v1.62+](https://www.rust-lang.org/tools/install)

```bash
git clone https://github.com/ztx-protocol/bitcoinz-light-wallet.git
cd bitcoinz-light-wallet

npm install
npm run neon
```

To start locally, run:
```bash
npm start
```

#### BitcoinZ Network Parameters
- **Coin Type**: 177 (BIP44)
- **Sapling Activation**: Block 328,500
- **Branch ID**: 0x76b809bb (Sapling)
- **Address Prefixes**: t1 (transparent), zs (shielded)

## Credits
This wallet is based on [Zecwallet Lite](https://github.com/adityapk00/zecwallet-lite) and adapted for the BitcoinZ network.

_Note: BitcoinZ Light Wallet is a community project._

---

## Development Update & Funding Request

Simon has spent countless hours and weeks developing the BitcoinZ bridge infrastructure and this new light client wallet. This is a complex, professional-grade project that brings modern wallet capabilities to the BitcoinZ ecosystem.

### 🎉 Current Achievements

We're proud to announce major milestones have been reached:
- ✅ **The bridge is running** - Core infrastructure is operational
- ✅ **Lightning-fast sync** - The wallet syncs in seconds, not hours
- ✅ **All transactions working** - Both transparent and shielded transactions are functional
- ✅ **Historic achievement** - [First mobile z-to-z transaction](https://explorer.getbtcz.com/#/tx/17f0b27e5e69e1771eef763b043b6ee644a1d7054ed005357141c4394979350e)

### 🚧 What's Still Needed

While the core functionality is complete, professional software requires more than just working code:

1. **Infrastructure Deployment**
   - Deploy multiple global VPS servers to decentralize the light wallet network
   - Ensure high availability and redundancy
   - Set up monitoring and maintenance systems

2. **Final Development Phase**
   - Complete remaining features and edge cases
   - Conduct extensive security testing
   - Optimize performance for all platforms

3. **User Interface**
   - Design and implement a polished, user-friendly GUI
   - Create intuitive workflows for all user levels
   - Add multi-language support

4. **Cross-Platform Support**
   - Ensure flawless operation on Windows, macOS, and Linux
   - Future mobile support (iOS and Android)
   - Package and distribute installers

### ⏱️ Timeline Reality

**This is not a quick project.** Building a secure, reliable wallet infrastructure takes time, expertise, and resources. The speed of delivery directly depends on available funding. With proper support, we can accelerate development significantly. Without it, progress will be slow.

### 💰 How You Can Help

Your donations will directly fund:
- **Server costs** for the decentralized network (ongoing monthly expenses)
- **Development time** to complete the remaining features
- **Security audits** to ensure your funds are safe
- **UI/UX design** for a professional user experience

Every contribution brings us closer to delivering a wallet that makes BitcoinZ accessible to everyone - with full privacy features, instant syncing, and complete control of your keys.

### 📬 Donation Addresses

Please support the completion of this project:

**Litecoin (LTC):** `ltc1qwy6hd0e77srgsd2n6pvdcwe72zaj5w94mnsajs`

**Bitcoin (BTC):** `bc1qwy6hd0e77srgsd2n6pvdcwe72zaj5w94l02e2q`

**USDT (BEP20):** `0x32159Dffc551D9C20fb5D50bE706D20a87d62353`

**Solana (SOL):** `FFZFWtsSCouSmK53hCWcpNz4JcJd2FiARLvLGjVvtPzP`

---

*Thank you for your patience and support. Together, we're building the future of BitcoinZ - a future where everyone can use BTCZ easily, privately, and securely.*
