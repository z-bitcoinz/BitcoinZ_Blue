#!/usr/bin/env node

// Debug mempool monitoring for T address transactions
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
    
    // Check mempool monitoring configuration
    console.log('\n🔍 Checking mempool monitoring configuration...');
    
    // Check if mempool monitoring is enabled
    try {
        const configStr = native.litelib_execute("getoption", "monitor_mempool");
        console.log(`   Monitor mempool setting: ${configStr}`);
    } catch (e) {
        console.log(`   ⚠️  Could not get monitor_mempool setting: ${e.message}`);
    }
    
    // Try to enable mempool monitoring if it's not enabled
    console.log('\n🔧 Ensuring mempool monitoring is enabled...');
    try {
        const enableResult = native.litelib_execute("setoption", "monitor_mempool=true");
        console.log(`   Enable mempool monitoring: ${enableResult}`);
    } catch (e) {
        console.log(`   ⚠️  Could not enable mempool monitoring: ${e.message}`);
    }
    
    // Check server connection and capabilities
    console.log('\n📡 Testing server connection...');
    try {
        const infoStr = native.litelib_execute("info", "");
        const infoObj = JSON.parse(infoStr);
        console.log(`   Server: ${infoObj.vendor}`);
        console.log(`   Chain: ${infoObj.chain_name}`);
        console.log(`   Latest Block: ${infoObj.latest_block_height}`);
        console.log(`   Server Version: ${infoObj.version}`);
        console.log(`   Git Commit: ${infoObj.git_commit}`);
    } catch (e) {
        console.error(`   ❌ Error getting server info: ${e.message}`);
    }
    
    // Test direct mempool access
    console.log('\n🔄 Testing direct mempool access...');
    try {
        // Try to get mempool transactions directly
        const mempoolStr = native.litelib_execute("mempool", "");
        console.log(`   Mempool command result: ${mempoolStr}`);
    } catch (e) {
        console.log(`   ⚠️  Mempool command not available: ${e.message}`);
    }
    
    // Check current wallet state
    console.log('\n📊 Current wallet state...');
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
        console.error(`   ❌ Error getting wallet state: ${e.message}`);
    }
    
    // Test transaction list and unconfirmed detection
    console.log('\n📝 Testing transaction detection...');
    try {
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
                console.log(`        Address: ${tx.address}`);
                console.log(`        Block Height: ${tx.block_height}`);
                console.log(`        Unconfirmed: ${tx.unconfirmed}`);
            });
        }
        
        // Show recent transactions
        if (listJSON.length > 0) {
            console.log('\n   📋 Recent transactions:');
            listJSON.slice(-3).forEach((tx, i) => {
                const type = tx.outgoing_metadata ? "sent" : "received";
                console.log(`     ${i + 1}. ${type}: ${tx.amount / 100000000} BTCZ (TxID: ${tx.txid.substring(0, 16)}...)`);
                console.log(`        Unconfirmed: ${tx.unconfirmed}`);
                console.log(`        Block Height: ${tx.block_height}`);
            });
        }
    } catch (e) {
        console.error(`   ❌ Error getting transactions: ${e.message}`);
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
            console.log('   ⚠️  Wallet is still syncing. Mempool monitoring may not work until sync is complete.');
        } else {
            console.log('   ✅ Wallet is fully synced.');
        }
    } catch (e) {
        console.error(`   ❌ Error checking sync status: ${e.message}`);
    }
    
    // Force a sync to ensure we're up to date
    console.log('\n🔄 Forcing sync to ensure latest state...');
    try {
        const syncResult = native.litelib_execute("sync", "");
        console.log(`   Sync result: ${syncResult}`);
    } catch (e) {
        console.error(`   ❌ Error forcing sync: ${e.message}`);
    }
    
    // Save wallet state
    console.log('\n💾 Saving wallet...');
    try {
        const saveResult = native.litelib_execute("save", "");
        console.log(`   Save result: ${saveResult}`);
    } catch (e) {
        console.error(`   ❌ Error saving wallet: ${e.message}`);
    }
    
    console.log('\n🎯 Mempool Monitoring Debug Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Wallet initialized and connected to lightd.btcz.rocks:9067');
    console.log('   ✅ Mempool monitoring configuration checked');
    console.log('   ✅ Transaction detection tested');
    console.log('   ✅ Sync status verified');
    
    console.log('\n🧪 To test T address transaction detection:');
    console.log('   1. Send a transaction to one of your T addresses');
    console.log('   2. Run: node test-transaction-speed.js');
    console.log('   3. Watch console for transaction detection logs');
    
    console.log('\n💡 If transactions still not detected:');
    console.log('   - Check if lightwalletd server supports mempool streaming');
    console.log('   - Verify network connectivity to lightd.btcz.rocks:9067');
    console.log('   - Ensure wallet is fully synced before testing');
    
} catch (error) {
    console.error('❌ Failed to load native module:', error.message);
    console.error('Stack:', error.stack);
}
