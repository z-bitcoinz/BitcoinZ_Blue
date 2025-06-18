#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building native Rust module...');

try {
  // Build the Rust module
  execSync('cargo build --release --manifest-path native/Cargo.toml', { 
    stdio: 'inherit',
    env: { ...process.env, RUST_BACKTRACE: '1' }
  });

  // Determine the platform-specific library name
  let libName;
  let libPath;
  
  if (process.platform === 'darwin') {
    libName = 'libbitcoinz_wallet_lite.dylib';
  } else if (process.platform === 'win32') {
    libName = 'bitcoinz_wallet_lite.dll';
  } else {
    libName = 'libbitcoinz_wallet_lite.so';
  }

  // Try to find the built library
  const possiblePaths = [
    path.join('native', 'target', 'release', libName),
    path.join('native', 'target', 'release', libName.replace('bitcoinz', 'zecwallet')),
    path.join('native', 'target', 'release', 'deps', libName),
    path.join('native', 'target', 'release', 'deps', libName.replace('bitcoinz', 'zecwallet'))
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      libPath = p;
      console.log(`Found library at: ${p}`);
      break;
    }
  }

  if (!libPath) {
    // List all dylib/dll/so files to help debug
    console.log('\nAvailable libraries:');
    try {
      const files = execSync(`find native/target/release -name "*.dylib" -o -name "*.so" -o -name "*.dll" | grep -v test`, { encoding: 'utf8' });
      console.log(files);
    } catch (e) {
      // Ignore error if find fails
    }
    throw new Error(`Could not find built library ${libName}`);
  }

  // Copy to src/native.node
  const destPath = path.join('src', 'native.node');
  console.log(`Copying ${libPath} to ${destPath}`);
  fs.copyFileSync(libPath, destPath);
  
  console.log('Native module built successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}