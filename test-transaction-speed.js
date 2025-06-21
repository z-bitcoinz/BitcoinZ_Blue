#!/usr/bin/env node

// Test script to monitor transaction detection speed
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
    
    // Get initial state
    let lastTxId = null;
    let lastBalance = null;
    let transactionCount = 0;
    
    function getCurrentState() {
        try {
            // Get last transaction ID
            const lastTxidStr = native.litelib_execute("lasttxid", "");
            const lastTxidJSON = JSON.parse(lastTxidStr);
            const currentTxId = lastTxidJSON.last_txid;
            
            // Get current balance
            const balanceStr = native.litelib_execute("balance", "");
            const balanceJSON = JSON.parse(balanceStr);
            const currentBalance = {
                transparent: balanceJSON.tbalance / 100000000,
                shielded: balanceJSON.zbalance / 100000000,
                total: (balanceJSON.tbalance + balanceJSON.zbalance) / 100000000
            };
            
            // Get transaction list
            const listStr = native.litelib_execute("list", "");
            const listJSON = JSON.parse(listStr);
            const currentTxCount = listJSON.length;
            
            return {
                txId: currentTxId,
                balance: currentBalance,
                txCount: currentTxCount,
                transactions: listJSON
            };
        } catch (e) {
            console.error(`Error getting current state: ${e.message}`);
            return null;
        }
    }
    
    // Get initial state
    const initialState = getCurrentState();
    if (!initialState) {
        console.log('❌ Failed to get initial state');
        process.exit(1);
    }
    
    lastTxId = initialState.txId;
    lastBalance = initialState.balance;
    transactionCount = initialState.txCount;
    
    console.log('\n📊 Initial State:');
    console.log(`   Last TxID: ${lastTxId}`);
    console.log(`   Transparent Balance: ${lastBalance.transparent} BTCZ`);
    console.log(`   Shielded Balance: ${lastBalance.shielded} BTCZ`);
    console.log(`   Total Balance: ${lastBalance.total} BTCZ`);
    console.log(`   Transaction Count: ${transactionCount}`);
    
    console.log('\n🔍 Monitoring for new transactions...');
    console.log('💡 Send a transaction to any of your addresses to test detection speed!');
    console.log('⏱️  Checking every 1 second...\n');
    
    let checkCount = 0;
    
    // Monitor for changes
    const monitorInterval = setInterval(() => {
        checkCount++;
        const timestamp = new Date().toISOString();
        
        const currentState = getCurrentState();
        if (!currentState) {
            return;
        }
        
        // Check for new transactions
        if (currentState.txId !== lastTxId) {
            console.log(`\n🎉 NEW TRANSACTION DETECTED! (Check #${checkCount})`);
            console.log(`   Time: ${timestamp}`);
            console.log(`   Previous TxID: ${lastTxId}`);
            console.log(`   New TxID: ${currentState.txId}`);
            
            // Check balance changes
            const balanceChanged = 
                currentState.balance.transparent !== lastBalance.transparent ||
                currentState.balance.shielded !== lastBalance.shielded;
                
            if (balanceChanged) {
                console.log(`   💰 Balance Changed:`);
                console.log(`      Transparent: ${lastBalance.transparent} → ${currentState.balance.transparent} BTCZ`);
                console.log(`      Shielded: ${lastBalance.shielded} → ${currentState.balance.shielded} BTCZ`);
                console.log(`      Total: ${lastBalance.total} → ${currentState.balance.total} BTCZ`);
            }
            
            // Check for unconfirmed transactions
            const unconfirmedTxs = currentState.transactions.filter(tx => tx.unconfirmed);
            if (unconfirmedTxs.length > 0) {
                console.log(`   🔄 Unconfirmed Transactions: ${unconfirmedTxs.length}`);
                unconfirmedTxs.forEach(tx => {
                    const type = tx.outgoing_metadata ? "sent" : "received";
                    console.log(`      - ${type}: ${tx.amount / 100000000} BTCZ (TxID: ${tx.txid})`);
                });
            }
            
            lastTxId = currentState.txId;
            lastBalance = currentState.balance;
            transactionCount = currentState.txCount;
            
            console.log(`   ✅ Detection completed in ~${checkCount} seconds\n`);
            checkCount = 0; // Reset counter after detection
        } else {
            // Show periodic status
            if (checkCount % 10 === 0) {
                console.log(`⏳ Still monitoring... (${checkCount} checks, last: ${timestamp})`);
            }
        }
    }, 1000); // Check every 1 second
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Monitoring stopped by user');
        clearInterval(monitorInterval);
        process.exit(0);
    });
    
    // Auto-stop after 5 minutes if no transactions
    setTimeout(() => {
        console.log('\n⏰ Auto-stopping after 5 minutes of monitoring');
        clearInterval(monitorInterval);
        process.exit(0);
    }, 5 * 60 * 1000);
    
} catch (error) {
    console.error('❌ Failed to load native module:', error.message);
    console.error('Stack:', error.stack);
}
