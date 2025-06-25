#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if we should skip the native build
if (process.env.SKIP_NATIVE_BUILD === 'true') {
  console.log('Skipping native build (SKIP_NATIVE_BUILD=true)');
  
  // Check if native.node already exists
  const nativePath = path.join('src', 'native.node');
  if (fs.existsSync(nativePath)) {
    console.log('✅ Using existing native.node');
    process.exit(0);
  } else {
    console.error('❌ Error: native.node not found and SKIP_NATIVE_BUILD is set');
    process.exit(1);
  }
}

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
    console.log('\\nAvailable libraries:');
    try {
      let findCmd;
      if (process.platform === 'win32') {
        findCmd = `dir /s /b native\\target\\release\\*.dll native\\target\\release\\*.lib 2>nul`;
      } else {
        findCmd = `find native/target/release -name "*.dylib" -o -name "*.so" -o -name "*.dll" 2>/dev/null | grep -v test || true`;
      }
      const files = execSync(findCmd, { encoding: 'utf8' });
      console.log(files);
    } catch (e) {
      // Ignore error if find fails
      console.log('Could not list files:', e.message);
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
