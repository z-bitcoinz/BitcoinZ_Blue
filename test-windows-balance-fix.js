#!/usr/bin/env node

/**
 * Windows Balance Persistence Test Script
 * 
 * This script tests the Windows-specific balance persistence fixes
 * by simulating wallet close/reopen scenarios and validating balance recovery.
 */

const path = require('path');
const fs = require('fs');

// Determine the correct native module path
const nativePath = path.join(__dirname, 'src', 'native.node');

console.log('🧪 Windows Balance Persistence Test');
console.log('=====================================');
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Node.js version: ${process.version}`);
console.log('');

if (process.platform !== 'win32') {
    console.log('⚠️  This test is specifically designed for Windows systems.');
    console.log('   Running on other platforms may not reveal Windows-specific issues.');
    console.log('');
}

try {
    const native = require(nativePath);
    console.log('✅ Native module loaded successfully!');
    console.log('Available functions:', Object.keys(native).filter(key => key.startsWith('litelib')));
    console.log('');
    
    // Test 1: Check if wallet exists
    console.log('🔍 Test 1: Wallet Existence Check');
    console.log('----------------------------------');
    const walletExists = native.litelib_wallet_exists("main");
    console.log(`Wallet exists: ${walletExists}`);
    
    if (!walletExists) {
        console.log('❌ No wallet found! Create a wallet first using the main application.');
        console.log('   This test requires an existing wallet with some balance.');
        process.exit(1);
    }
    console.log('✅ Wallet found');
    console.log('');
    
    // Test 2: Initialize wallet and check initial balance
    console.log('🔍 Test 2: Initial Wallet Initialization');
    console.log('----------------------------------------');
    const serverUrl = "https://lightd.btcz.rocks:9067";
    const initResult = native.litelib_initialize_existing(serverUrl);
    console.log(`Initialization result: ${initResult}`);
    
    if (initResult !== "OK") {
        console.log(`❌ Failed to initialize wallet: ${initResult}`);
        process.exit(1);
    }
    console.log('✅ Wallet initialized successfully');
    
    // Get initial balance
    const initialBalanceStr = native.litelib_execute("balance", "");
    const initialBalanceJSON = JSON.parse(initialBalanceStr);
    const initialTotal = (initialBalanceJSON.tbalance + initialBalanceJSON.zbalance + initialBalanceJSON.uabalance) / 10 ** 8;
    
    console.log('Initial balance breakdown:');
    console.log(`  Transparent: ${initialBalanceJSON.tbalance / 10 ** 8} BTCZ`);
    console.log(`  Shielded:    ${initialBalanceJSON.zbalance / 10 ** 8} BTCZ`);
    console.log(`  Unified:     ${initialBalanceJSON.uabalance / 10 ** 8} BTCZ`);
    console.log(`  Total:       ${initialTotal} BTCZ`);
    console.log('');
    
    // Test 3: Check transaction count
    console.log('🔍 Test 3: Transaction Count Check');
    console.log('----------------------------------');
    const listStr = native.litelib_execute("list", "");
    const listJSON = JSON.parse(listStr);
    console.log(`Transaction count: ${listJSON.length}`);
    
    if (listJSON.length === 0) {
        console.log('⚠️  No transactions found. This test is more effective with existing transactions.');
    } else {
        console.log('✅ Transactions found');
        
        // Show recent transactions
        const recentTxs = listJSON.slice(0, 3);
        console.log('Recent transactions:');
        recentTxs.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.txid?.substring(0, 8)}... Amount: ${tx.amount / 10 ** 8} BTCZ`);
        });
    }
    console.log('');
    
    // Test 4: Simulate wallet save/reload cycle (Windows balance persistence test)
    console.log('🔍 Test 4: Windows Balance Persistence Test');
    console.log('-------------------------------------------');
    console.log('Simulating wallet close/reopen scenario...');
    
    // Force save the wallet
    console.log('Step 1: Forcing wallet save...');
    const saveResult = native.litelib_execute("save", "");
    console.log(`Save result: ${saveResult}`);
    
    // Deinitialize (simulate app close)
    console.log('Step 2: Deinitializing wallet (simulating app close)...');
    const deinitResult = native.litelib_deinitialize();
    console.log(`Deinitialize result: ${deinitResult}`);
    
    // Wait a moment (simulate time between close and reopen)
    console.log('Step 3: Waiting 2 seconds (simulating app restart delay)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinitialize (simulate app reopen)
    console.log('Step 4: Reinitializing wallet (simulating app reopen)...');
    const reinitResult = native.litelib_initialize_existing(serverUrl);
    console.log(`Reinitialization result: ${reinitResult}`);
    
    if (reinitResult !== "OK") {
        console.log(`❌ Failed to reinitialize wallet: ${reinitResult}`);
        console.log('This indicates a Windows-specific persistence issue!');
        process.exit(1);
    }
    
    // Check balance after reinitialization
    console.log('Step 5: Checking balance after reinitialization...');
    const postReinitBalanceStr = native.litelib_execute("balance", "");
    const postReinitBalanceJSON = JSON.parse(postReinitBalanceStr);
    const postReinitTotal = (postReinitBalanceJSON.tbalance + postReinitBalanceJSON.zbalance + postReinitBalanceJSON.uabalance) / 10 ** 8;
    
    console.log('Post-reinitialization balance breakdown:');
    console.log(`  Transparent: ${postReinitBalanceJSON.tbalance / 10 ** 8} BTCZ`);
    console.log(`  Shielded:    ${postReinitBalanceJSON.zbalance / 10 ** 8} BTCZ`);
    console.log(`  Unified:     ${postReinitBalanceJSON.uabalance / 10 ** 8} BTCZ`);
    console.log(`  Total:       ${postReinitTotal} BTCZ`);
    console.log('');
    
    // Test 5: Balance persistence validation
    console.log('🔍 Test 5: Balance Persistence Validation');
    console.log('-----------------------------------------');
    
    const balanceDifference = Math.abs(initialTotal - postReinitTotal);
    const tolerance = 0.00000001; // Very small tolerance for floating point comparison
    
    if (balanceDifference <= tolerance) {
        console.log('✅ SUCCESS: Balance persisted correctly after wallet restart!');
        console.log(`   Initial balance:  ${initialTotal} BTCZ`);
        console.log(`   Restored balance: ${postReinitTotal} BTCZ`);
        console.log(`   Difference:       ${balanceDifference} BTCZ (within tolerance)`);
    } else {
        console.log('❌ FAILURE: Balance did not persist correctly!');
        console.log(`   Initial balance:  ${initialTotal} BTCZ`);
        console.log(`   Restored balance: ${postReinitTotal} BTCZ`);
        console.log(`   Difference:       ${balanceDifference} BTCZ`);
        
        if (postReinitTotal === 0 && initialTotal > 0) {
            console.log('');
            console.log('🚨 CRITICAL: This is the exact Windows balance persistence bug!');
            console.log('   The wallet had a balance but shows zero after restart.');
            console.log('   This indicates the fix may not be working properly.');
        }
    }
    
    console.log('');
    console.log('🏁 Test completed!');
    console.log('');
    
    if (balanceDifference <= tolerance) {
        console.log('🎉 All tests passed! Windows balance persistence appears to be working correctly.');
        process.exit(0);
    } else {
        console.log('💥 Test failed! Windows balance persistence issue detected.');
        process.exit(1);
    }
    
} catch (e) {
    console.error('❌ Test failed with error:', e.message);
    console.error('');
    console.error('This could indicate:');
    console.error('• Native module loading issues');
    console.error('• Wallet file corruption');
    console.error('• Permission problems');
    console.error('• Missing dependencies');
    console.error('');
    console.error('Full error:', e);
    process.exit(1);
}
