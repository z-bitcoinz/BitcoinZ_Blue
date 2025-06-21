#!/usr/bin/env node

// Test script to interact with the BitcoinZ wallet directly
const path = require('path');

// Load the native module
const nativePath = path.join(__dirname, 'src', 'native.node');
console.log(`Loading native module from: ${nativePath}`);

try {
    const native = require(nativePath);
    console.log('✅ Native module loaded successfully!');
    
    // Test basic wallet commands
    console.log('\n🔍 Testing wallet commands...\n');
    
    // 1. Check if wallet exists
    console.log('1. Checking if wallet exists...');
    try {
        const walletExists = native.litelib_wallet_exists();
        console.log(`   Wallet exists: ${walletExists}`);
    } catch (e) {
        console.log(`   Error checking wallet: ${e.message}`);
    }
    
    // 2. Get wallet info
    console.log('\n2. Getting wallet info...');
    try {
        const info = native.litelib_execute('info', '');
        console.log(`   Info: ${info}`);
        const infoObj = JSON.parse(info);
        console.log(`   Chain: ${infoObj.chain_name}`);
        console.log(`   Latest block: ${infoObj.latest_block_height}`);
        console.log(`   Version: ${infoObj.version}`);
    } catch (e) {
        console.log(`   Error getting info: ${e.message}`);
    }
    
    // 3. Get current balance and addresses
    console.log('\n3. Getting balance and addresses...');
    try {
        const balance = native.litelib_execute('balance', '');
        console.log(`   Balance: ${balance}`);
        const balanceObj = JSON.parse(balance);
        console.log(`   Z addresses count: ${balanceObj.z_addresses.length}`);
        console.log(`   T addresses count: ${balanceObj.t_addresses.length}`);
        
        // List all Z addresses
        if (balanceObj.z_addresses.length > 0) {
            console.log('\n   📍 Z Addresses:');
            balanceObj.z_addresses.forEach((addr, i) => {
                console.log(`     ${i + 1}. ${addr.address} (Balance: ${addr.zbalance / 100000000} BTCZ)`);
            });
        } else {
            console.log('   ❌ No Z addresses found!');
        }
        
        // List all T addresses
        if (balanceObj.t_addresses.length > 0) {
            console.log('\n   📍 T Addresses:');
            balanceObj.t_addresses.forEach((addr, i) => {
                console.log(`     ${i + 1}. ${addr.address} (Balance: ${addr.balance / 100000000} BTCZ)`);
            });
        } else {
            console.log('   ❌ No T addresses found!');
        }
        
    } catch (e) {
        console.log(`   Error getting balance: ${e.message}`);
    }
    
    // 4. Try to create a new Z address
    console.log('\n4. Creating new Z address...');
    try {
        const newZAddr = native.litelib_execute('new', 'z');
        console.log(`   New Z address result: ${newZAddr}`);
        const newZAddrObj = JSON.parse(newZAddr);
        console.log(`   ✅ Created new Z address: ${newZAddrObj}`);
    } catch (e) {
        console.log(`   ❌ Error creating Z address: ${e.message}`);
        console.log(`   Stack: ${e.stack}`);
    }
    
    // 5. Try to create a new T address
    console.log('\n5. Creating new T address...');
    try {
        const newTAddr = native.litelib_execute('new', 't');
        console.log(`   New T address result: ${newTAddr}`);
        const newTAddrObj = JSON.parse(newTAddr);
        console.log(`   ✅ Created new T address: ${newTAddrObj}`);
    } catch (e) {
        console.log(`   ❌ Error creating T address: ${e.message}`);
    }
    
    // 6. Get updated balance after creating addresses
    console.log('\n6. Getting updated balance after creating addresses...');
    try {
        const updatedBalance = native.litelib_execute('balance', '');
        const updatedBalanceObj = JSON.parse(updatedBalance);
        console.log(`   Updated Z addresses count: ${updatedBalanceObj.z_addresses.length}`);
        console.log(`   Updated T addresses count: ${updatedBalanceObj.t_addresses.length}`);
        
        // List all addresses again
        console.log('\n   📍 All Z Addresses:');
        updatedBalanceObj.z_addresses.forEach((addr, i) => {
            console.log(`     ${i + 1}. ${addr.address}`);
        });
        
        console.log('\n   📍 All T Addresses:');
        updatedBalanceObj.t_addresses.forEach((addr, i) => {
            console.log(`     ${i + 1}. ${addr.address}`);
        });
        
    } catch (e) {
        console.log(`   Error getting updated balance: ${e.message}`);
    }
    
    // 7. Save the wallet
    console.log('\n7. Saving wallet...');
    try {
        const saveResult = native.litelib_execute('save', '');
        console.log(`   Save result: ${saveResult}`);
    } catch (e) {
        console.log(`   Error saving wallet: ${e.message}`);
    }
    
    console.log('\n🎯 Test completed!');
    
} catch (error) {
    console.error('❌ Failed to load native module:', error.message);
    console.error('Stack:', error.stack);
}
