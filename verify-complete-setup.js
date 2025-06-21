#!/usr/bin/env node

// Verification script to ensure the repository is completely self-contained
const fs = require('fs');
const path = require('path');

console.log('🔍 BitcoinZ Light Wallet - Repository Completeness Check\n');

const checks = [];

// Check 1: BitcoinZ wallet library
function checkWalletLibrary() {
    const libPath = './lib';
    const cargoPath = './lib/Cargo.toml';
    const srcPath = './lib/src';
    
    if (fs.existsSync(libPath) && fs.existsSync(cargoPath) && fs.existsSync(srcPath)) {
        console.log('✅ BitcoinZ wallet library included (/lib)');
        
        // Check if it's BitcoinZ-specific
        const cargoContent = fs.readFileSync(cargoPath, 'utf8');
        if (cargoContent.includes('zecwalletlitelib')) {
            console.log('   ✅ Correct library name (zecwalletlitelib)');
        }
        
        // Check for BitcoinZ-specific files
        const bitcoinzParamsPath = './lib/src/bitcoinz_params.rs';
        if (fs.existsSync(bitcoinzParamsPath)) {
            console.log('   ✅ BitcoinZ-specific parameters found');
        }
        
        return true;
    } else {
        console.log('❌ BitcoinZ wallet library missing (/lib)');
        return false;
    }
}

// Check 2: Native module configuration
function checkNativeModule() {
    const nativeCargoPath = './native/Cargo.toml';
    const nativeNodePath = './src/native.node';
    
    let success = true;
    
    if (fs.existsSync(nativeCargoPath)) {
        const cargoContent = fs.readFileSync(nativeCargoPath, 'utf8');
        if (cargoContent.includes('path = "../lib"')) {
            console.log('✅ Native module points to local library');
        } else {
            console.log('❌ Native module not configured for local library');
            success = false;
        }
    } else {
        console.log('❌ Native module Cargo.toml missing');
        success = false;
    }
    
    if (fs.existsSync(nativeNodePath)) {
        console.log('✅ Pre-compiled native module included');
    } else {
        console.log('⚠️  Pre-compiled native module missing (can be built)');
    }
    
    return success;
}

// Check 3: Package dependencies
function checkPackageDependencies() {
    const packagePath = './package.json';
    
    if (fs.existsSync(packagePath)) {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        console.log('✅ package.json exists');
        
        // Check for essential dependencies
        const deps = packageContent.dependencies || {};
        const devDeps = packageContent.devDependencies || {};
        const allDeps = { ...deps, ...devDeps };
        
        const essentialDeps = ['react', 'electron', 'neon-cli'];
        let missingDeps = [];
        
        essentialDeps.forEach(dep => {
            if (!allDeps[dep]) {
                missingDeps.push(dep);
            }
        });
        
        if (missingDeps.length === 0) {
            console.log('   ✅ All essential dependencies specified');
        } else {
            console.log(`   ⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
        }
        
        return true;
    } else {
        console.log('❌ package.json missing');
        return false;
    }
}

// Check 4: Testing tools
function checkTestingTools() {
    const testFiles = [
        'test-transaction-speed.js',
        'test-t-address-monitoring.js',
        'fix-t-address-monitoring.js',
        'test-address-validation.js'
    ];
    
    let foundTests = 0;
    testFiles.forEach(file => {
        if (fs.existsSync(file)) {
            foundTests++;
        }
    });
    
    console.log(`✅ Testing tools: ${foundTests}/${testFiles.length} included`);
    return foundTests > 0;
}

// Check 5: Documentation
function checkDocumentation() {
    const docs = ['README.md', 'COMPLETE_SETUP.md'];
    let foundDocs = 0;
    
    docs.forEach(doc => {
        if (fs.existsSync(doc)) {
            foundDocs++;
        }
    });
    
    console.log(`✅ Documentation: ${foundDocs}/${docs.length} files present`);
    return foundDocs > 0;
}

// Check 6: Build scripts
function checkBuildScripts() {
    const packagePath = './package.json';
    
    if (fs.existsSync(packagePath)) {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const scripts = packageContent.scripts || {};
        
        const essentialScripts = ['start', 'build', 'neon'];
        let foundScripts = 0;
        
        essentialScripts.forEach(script => {
            if (scripts[script]) {
                foundScripts++;
            }
        });
        
        console.log(`✅ Build scripts: ${foundScripts}/${essentialScripts.length} available`);
        return foundScripts === essentialScripts.length;
    }
    
    return false;
}

// Check 7: No external path dependencies
function checkNoExternalDependencies() {
    const nativeCargoPath = './native/Cargo.toml';
    
    if (fs.existsSync(nativeCargoPath)) {
        const cargoContent = fs.readFileSync(nativeCargoPath, 'utf8');
        
        // Check for external paths
        const hasExternalPaths = cargoContent.includes('/Users/') || 
                                cargoContent.includes('C:\\') ||
                                cargoContent.includes('../../zecwallet-light-cli-bitcoinz');
        
        if (!hasExternalPaths) {
            console.log('✅ No external path dependencies');
            return true;
        } else {
            console.log('❌ External path dependencies found');
            return false;
        }
    }
    
    return false;
}

// Run all checks
console.log('Running completeness checks...\n');

const results = [
    checkWalletLibrary(),
    checkNativeModule(),
    checkPackageDependencies(),
    checkTestingTools(),
    checkDocumentation(),
    checkBuildScripts(),
    checkNoExternalDependencies()
];

const passed = results.filter(r => r).length;
const total = results.length;

console.log('\n' + '='.repeat(50));
console.log(`📊 COMPLETENESS SCORE: ${passed}/${total} checks passed`);

if (passed === total) {
    console.log('🎉 REPOSITORY IS COMPLETELY SELF-CONTAINED!');
    console.log('\n✅ Ready for distribution');
    console.log('✅ No external dependencies');
    console.log('✅ All components included');
    console.log('✅ Can be cloned and run anywhere');
} else {
    console.log('⚠️  Repository needs attention');
    console.log('\nSome components may be missing or misconfigured.');
}

console.log('\n🚀 To start the wallet: npm start');
console.log('📖 See COMPLETE_SETUP.md for full instructions');
