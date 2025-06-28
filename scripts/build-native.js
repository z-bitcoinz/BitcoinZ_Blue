#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if we should skip the native build
if (process.env.SKIP_NATIVE_BUILD === 'true') {
  console.log('🔄 Skipping native build (SKIP_NATIVE_BUILD=true)');
  
  // Check if native.node already exists
  const nativePath = path.join('src', 'native.node');
  if (fs.existsSync(nativePath)) {
    const stats = fs.statSync(nativePath);
    console.log(`✅ Using existing native.node (${stats.size} bytes)`);
    
    // In CI environments, log additional info about the native module
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log(`📋 CI Environment detected, native module details:`);
      console.log(`   File: ${nativePath}`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Modified: ${stats.mtime}`);
      console.log(`   Platform: ${process.platform}`);
      console.log(`   Arch: ${process.arch}`);
    }
    
    process.exit(0);
  } else {
    console.error('❌ Error: native.node not found and SKIP_NATIVE_BUILD is set');
    console.error('   This usually means the native module build step failed or was skipped');
    process.exit(1);
  }
}

// Verify Sapling parameters before building
console.log('🔍 Verifying Sapling parameters...');

const EXPECTED_HASHES = {
  'sapling-spend.params': '8e48ffd23abb3a5fd9c5589204f32d9c31285a04b78096ba40a79b75677efc13',
  'sapling-output.params': '2f0ebbcbb9bb0bcffe95a397e7eba89c29eb4dde6191c339db88570e3f3fb0e4'
};

const paramsDir = path.join(__dirname, '..', 'lib', 'zcash-params');

for (const [filename, expectedHash] of Object.entries(EXPECTED_HASHES)) {
  const filePath = path.join(paramsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing Sapling parameter file: ${filename}`);
    console.error(`   Please download from: https://download.z.cash/downloads/${filename}`);
    process.exit(1);
  }
  
  // Calculate SHA256 hash
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const actualHash = hashSum.digest('hex');
  
  if (actualHash !== expectedHash) {
    console.error(`❌ Invalid hash for ${filename}`);
    console.error(`   Expected: ${expectedHash}`);
    console.error(`   Actual:   ${actualHash}`);
    console.error(`   File may be corrupted. Please re-download from https://download.z.cash/downloads/`);
    process.exit(1);
  }
  
  console.log(`✅ ${filename} verified (${fs.statSync(filePath).size} bytes)`);
}

console.log('🔨 Building native Rust module...');

// Log environment info for debugging
console.log(`📋 Build environment:`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Working directory: ${process.cwd()}`);

if (process.env.CI || process.env.GITHUB_ACTIONS) {
  console.log(`   CI Environment: ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`   GitHub Actions: ${process.env.GITHUB_ACTIONS ? 'Yes' : 'No'}`);
  if (process.env.RUNNER_OS) {
    console.log(`   Runner OS: ${process.env.RUNNER_OS}`);
  }
}

try {
  // Build the Rust module
  console.log('🦀 Executing cargo build...');
  const startTime = Date.now();
  
  execSync('cargo build --release --features embed_params --manifest-path native/Cargo.toml', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      RUST_BACKTRACE: '1',
      // Ensure consistent build environment
      CARGO_TERM_COLOR: 'always'
    }
  });
  
  const buildTime = Date.now() - startTime;
  console.log(`✅ Cargo build completed in ${buildTime}ms`);

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
  console.log(`🔍 Looking for ${libName}...`);
  
  const possiblePaths = [
    path.join('native', 'target', 'release', libName),
    path.join('native', 'target', 'release', libName.replace('bitcoinz', 'zecwallet')),
    path.join('native', 'target', 'release', 'deps', libName),
    path.join('native', 'target', 'release', 'deps', libName.replace('bitcoinz', 'zecwallet'))
  ];

  console.log(`📁 Searching in paths:`);
  possiblePaths.forEach(p => console.log(`   - ${p}`));

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      libPath = p;
      const stats = fs.statSync(p);
      console.log(`✅ Found library at: ${p} (${stats.size} bytes)`);
      break;
    }
  }

  if (!libPath) {
    // List all available files to help debug
    console.log('\n❌ Could not find expected library. Debugging info:');
    console.log(`Expected: ${libName}`);
    
    // Check if target directory exists
    const targetDir = path.join('native', 'target', 'release');
    if (fs.existsSync(targetDir)) {
      console.log(`\n📁 Contents of ${targetDir}:`);
      try {
        const files = fs.readdirSync(targetDir);
        files.forEach(file => {
          const fullPath = path.join(targetDir, file);
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            console.log(`   📄 ${file} (${stats.size} bytes)`);
          } else {
            console.log(`   📁 ${file}/`);
          }
        });
      } catch (e) {
        console.log(`   Error reading directory: ${e.message}`);
      }
    } else {
      console.log(`\n❌ Target directory does not exist: ${targetDir}`);
    }

    // Try to find any library files
    try {
      let findCmd;
      if (process.platform === 'win32') {
        findCmd = `dir /s /b native\\target\\release\\*.dll native\\target\\release\\*.lib 2>nul`;
      } else {
        findCmd = `find native/target/release -name "*.dylib" -o -name "*.so" -o -name "*.dll" 2>/dev/null | grep -v test || true`;
      }
      const files = execSync(findCmd, { encoding: 'utf8' });
      if (files.trim()) {
        console.log('\n🔍 Found these library files:');
        console.log(files);
      } else {
        console.log('\n🔍 No library files found in target/release');
      }
    } catch (e) {
      console.log('\n⚠️  Could not search for library files:', e.message);
    }
    
    throw new Error(`Could not find built library ${libName}`);
  }

  // Copy to src/native.node
  const destPath = path.join('src', 'native.node');
  console.log(`📋 Copying ${libPath} to ${destPath}`);
  
  try {
    fs.copyFileSync(libPath, destPath);
    const destStats = fs.statSync(destPath);
    console.log(`✅ Successfully copied (${destStats.size} bytes)`);
  } catch (e) {
    console.error(`❌ Failed to copy: ${e.message}`);
    throw e;
  }
  
  console.log('🎉 Native module built successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
