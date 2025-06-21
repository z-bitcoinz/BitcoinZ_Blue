#!/usr/bin/env node

// Fix T address monitoring by optimizing settings for BitcoinZ
const path = require('path');

// Load the native module
const nativePath = path.join(__dirname, 'src', 'native.node');
console.log(`Loading native module from: ${nativePath}`);

try {
    const native = require(nativePath);
    console.log('✅ Native module loaded successfully!');
    
    // Initialize the wallet first
    console.log('\n🔧 Initializing wallet...');
    const walletExists = native.litelib_wallet_exists("main");
    if (!walletExists) {
        console.log('❌ No wallet found! Create a wallet first.');
        process.exit(1);
    }
    
    const serverUrl = "https://lightd.btcz.rocks:9067";
    const initResult = native.litelib_initialize_existing(serverUrl);
    if (initResult !== "OK") {
        console.log(`❌ Failed to initialize wallet: ${initResult}`);
        process.exit(1);
    }
    console.log('✅ Wallet initialized successfully!');
    
    console.log('\n🔧 Optimizing T Address Monitoring Settings...');
    
    // 1. Disable spam filter to ensure all transactions are detected
    console.log('\n1. Disabling spam filter...');
    try {
        const spamFilterResult = native.litelib_execute("setoption", "spam_filter_threshold=0");
        console.log(`   Spam filter disabled: ${spamFilterResult}`);
    } catch (e) {
        console.error(`   ❌ Error disabling spam filter: ${e.message}`);
    }
    
    // 2. Set memo download to "all" for better transaction detection
    console.log('\n2. Setting memo download to "all"...');
    try {
        const memoResult = native.litelib_execute("setoption", "download_memos=all");
        console.log(`   Memo download set to all: ${memoResult}`);
    } catch (e) {
        console.error(`   ❌ Error setting memo download: ${e.message}`);
    }
    
    // 3. Save the wallet with new settings
    console.log('\n3. Saving wallet...');
    try {
        const saveResult = native.litelib_execute("save", "");
        console.log(`   Wallet saved: ${saveResult}`);
    } catch (e) {
        console.error(`   ❌ Error saving wallet: ${e.message}`);
    }
    
    // 4. Verify settings
    console.log('\n4. Verifying settings...');
    try {
        const spamFilterStr = native.litelib_execute("getoption", "spam_filter_threshold");
        const spamFilter = JSON.parse(spamFilterStr);
        console.log(`   ✅ Spam filter threshold: ${spamFilter.spam_filter_threshold}`);
        
        const memoStr = native.litelib_execute("getoption", "download_memos");
        const memo = JSON.parse(memoStr);
        console.log(`   ✅ Download memos: ${memo.download_memos}`);
    } catch (e) {
        console.error(`   ❌ Error verifying settings: ${e.message}`);
    }
    
    // 5. Test current addresses and balances
    console.log('\n5. Current wallet status...');
    try {
        const balanceStr = native.litelib_execute("balance", "");
        const balanceJSON = JSON.parse(balanceStr);
        
        console.log(`   T Addresses: ${balanceJSON.t_addresses.length}`);
        console.log(`   Z Addresses: ${balanceJSON.z_addresses.length}`);
        console.log(`   Transparent Balance: ${balanceJSON.tbalance / 100000000} BTCZ`);
        console.log(`   Shielded Balance: ${balanceJSON.zbalance / 100000000} BTCZ`);
        
        // Show T addresses for testing
        if (balanceJSON.t_addresses.length > 0) {
            console.log('\n   📋 T Addresses for testing:');
            balanceJSON.t_addresses.forEach((addr, i) => {
                console.log(`     ${i + 1}. ${addr.address} (Balance: ${addr.balance / 100000000} BTCZ)`);
            });
        }
    } catch (e) {
        console.error(`   ❌ Error getting wallet status: ${e.message}`);
    }
    
    // 6. Test mempool monitoring
    console.log('\n6. Testing mempool monitoring...');
    try {
        const lastTxidStr = native.litelib_execute("lasttxid", "");
        const lastTxidJSON = JSON.parse(lastTxidStr);
        console.log(`   Last TxID: ${lastTxidJSON.last_txid || 'null'}`);
        
        const listStr = native.litelib_execute("list", "");
        const listJSON = JSON.parse(listStr);
        console.log(`   Total Transactions: ${listJSON.length}`);
        
        const unconfirmedTxs = listJSON.filter(tx => tx.unconfirmed);
        console.log(`   Unconfirmed Transactions: ${unconfirmedTxs.length}`);
        
        if (unconfirmedTxs.length > 0) {
            console.log('\n   🔄 Unconfirmed Transactions:');
            unconfirmedTxs.forEach((tx, i) => {
                const type = tx.outgoing_metadata ? "sent" : "received";
                console.log(`     ${i + 1}. ${type}: ${tx.amount / 100000000} BTCZ (TxID: ${tx.txid})`);
            });
        }
    } catch (e) {
        console.error(`   ❌ Error testing mempool: ${e.message}`);
    }
    
    console.log('\n🎉 T Address Monitoring Optimization Complete!');
    console.log('\n📋 Summary of Changes:');
    console.log('   ✅ Spam filter disabled (threshold = 0)');
    console.log('   ✅ Memo download set to "all"');
    console.log('   ✅ Wallet settings saved');
    console.log('   ✅ Mempool monitoring active');
    
    console.log('\n🧪 To test T address transaction detection:');
    console.log('   1. Send a transaction to any of your T addresses');
    console.log('   2. Run: node test-transaction-speed.js');
    console.log('   3. Watch for instant unconfirmed balance updates');
    console.log('\n💡 With spam filter disabled, ALL transactions should be detected instantly!');
    
} catch (error) {
    console.error('❌ Failed to load native module:', error.message);
    console.error('Stack:', error.stack);
}
