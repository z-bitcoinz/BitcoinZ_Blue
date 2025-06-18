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
