#!/usr/bin/env node

// Test T address monitoring specifically for BitcoinZ
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
    
    // Get current addresses
    function getAddresses() {
        try {
            const balanceStr = native.litelib_execute("balance", "");
            const balanceJSON = JSON.parse(balanceStr);
            return {
                tAddresses: balanceJSON.t_addresses || [],
                zAddresses: balanceJSON.z_addresses || [],
                totalBalance: {
                    transparent: balanceJSON.tbalance / 100000000,
                    shielded: balanceJSON.zbalance / 100000000
                }
            };
        } catch (e) {
            console.error(`Error getting addresses: ${e.message}`);
            return null;
        }
    }
    
    // Check current addresses
    const addresses = getAddresses();
    if (!addresses) {
        console.log('❌ Failed to get addresses');
        process.exit(1);
    }
    
    console.log('\n📍 Current Addresses:');
    console.log(`   T Addresses: ${addresses.tAddresses.length}`);
    console.log(`   Z Addresses: ${addresses.zAddresses.length}`);
    console.log(`   Transparent Balance: ${addresses.totalBalance.transparent} BTCZ`);
    console.log(`   Shielded Balance: ${addresses.totalBalance.shielded} BTCZ`);
    
    // List T addresses
    if (addresses.tAddresses.length > 0) {
        console.log('\n📋 T Addresses:');
        addresses.tAddresses.forEach((addr, i) => {
            console.log(`   ${i + 1}. ${addr.address} (Balance: ${addr.balance / 100000000} BTCZ)`);
        });
    } else {
        console.log('\n🔧 No T addresses found. Creating one...');
        try {
            const newTAddr = native.litelib_execute("new", "t");
            const newTAddrObj = JSON.parse(newTAddr);
            console.log(`✅ Created new T address: ${newTAddrObj}`);
            
            // Save the wallet
            native.litelib_execute("save", "");
            console.log('💾 Wallet saved');
            
            // Get updated addresses
            const updatedAddresses = getAddresses();
            if (updatedAddresses && updatedAddresses.tAddresses.length > 0) {
                console.log('\n📋 Updated T Addresses:');
                updatedAddresses.tAddresses.forEach((addr, i) => {
                    console.log(`   ${i + 1}. ${addr.address} (Balance: ${addr.balance / 100000000} BTCZ)`);
                });
            }
        } catch (e) {
            console.error(`❌ Error creating T address: ${e.message}`);
        }
    }
    
    // Test mempool monitoring specifically for T addresses
    console.log('\n🔍 Testing T Address Mempool Monitoring...');
    
    // Check if lightwalletd supports mempool monitoring
    try {
        console.log('\n📡 Testing lightwalletd connection...');
        const infoStr = native.litelib_execute("info", "");
        const infoObj = JSON.parse(infoStr);
        console.log(`   Server: ${infoObj.vendor || 'Unknown'}`);
        console.log(`   Chain: ${infoObj.chain_name}`);
        console.log(`   Latest Block: ${infoObj.latest_block_height}`);
        console.log(`   Consensus Branch: ${infoObj.consensus_branch_id}`);
        
        // Check if we can get mempool info
        console.log('\n🔄 Testing mempool access...');
        
        // Try to get last transaction ID (this should work if mempool monitoring is active)
        const lastTxidStr = native.litelib_execute("lasttxid", "");
        const lastTxidJSON = JSON.parse(lastTxidStr);
        console.log(`   Last TxID: ${lastTxidJSON.last_txid || 'null'}`);
        
        // Try to get transaction list
        const listStr = native.litelib_execute("list", "");
        const listJSON = JSON.parse(listStr);
        console.log(`   Total Transactions: ${listJSON.length}`);
        
        // Check for unconfirmed transactions
        const unconfirmedTxs = listJSON.filter(tx => tx.unconfirmed);
        console.log(`   Unconfirmed Transactions: ${unconfirmedTxs.length}`);
        
        if (unconfirmedTxs.length > 0) {
            console.log('\n🔄 Unconfirmed Transactions Found:');
            unconfirmedTxs.forEach((tx, i) => {
                const type = tx.outgoing_metadata ? "sent" : "received";
                console.log(`   ${i + 1}. ${type}: ${tx.amount / 100000000} BTCZ (TxID: ${tx.txid})`);
            });
        }
        
    } catch (e) {
        console.error(`❌ Error testing mempool: ${e.message}`);
    }
    
    // Test sync status
    console.log('\n🔄 Checking sync status...');
    try {
        const syncStatusStr = native.litelib_execute("syncstatus", "");
        const syncStatus = JSON.parse(syncStatusStr);
        console.log(`   Sync in progress: ${syncStatus.in_progress}`);
        console.log(`   Synced blocks: ${syncStatus.synced_blocks}`);
        console.log(`   Total blocks: ${syncStatus.total_blocks}`);
        
        if (syncStatus.in_progress) {
            console.log('⚠️  Wallet is still syncing. Mempool monitoring may not work until sync is complete.');
        } else {
            console.log('✅ Wallet is fully synced. Mempool monitoring should be active.');
        }
    } catch (e) {
        console.error(`❌ Error checking sync status: ${e.message}`);
    }
    
    // Check wallet settings that might affect T address monitoring
    console.log('\n⚙️  Checking wallet settings...');
    try {
        // Check spam filter
        const spamFilterStr = native.litelib_execute("getoption", "spam_filter_threshold");
        const spamFilter = JSON.parse(spamFilterStr);
        console.log(`   Spam filter threshold: ${spamFilter.spam_filter_threshold}`);
        
        // Check memo download setting
        const memoStr = native.litelib_execute("getoption", "download_memos");
        const memo = JSON.parse(memoStr);
        console.log(`   Download memos: ${memo.download_memos}`);
        
    } catch (e) {
        console.error(`❌ Error checking settings: ${e.message}`);
    }
    
    console.log('\n🎯 T Address Monitoring Test Complete!');
    console.log('\n💡 To test transaction detection:');
    console.log('   1. Send a small amount to one of your T addresses');
    console.log('   2. Run the transaction speed test: node test-transaction-speed.js');
    console.log('   3. Watch for unconfirmed balance updates');
    
} catch (error) {
    console.error('❌ Failed to load native module:', error.message);
    console.error('Stack:', error.stack);
}
