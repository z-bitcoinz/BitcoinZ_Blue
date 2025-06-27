#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Expected SHA256 hashes for the parameter files
const PARAM_HASHES = {
  'sapling-spend.params': '8e48ffd23abb3a5fd9c5589204f32d9c31285a04b78096ba40a79b75677efc13',
  'sapling-output.params': '2f0ebbcbb9bb0bcffe95a397e7eba89c29eb4dde6191c339db88570e3f3fb0e4'
};

// URLs for downloading parameters (Zcash official)
const PARAM_URLS = {
  'sapling-spend.params': 'https://download.z.cash/downloads/sapling-spend.params',
  'sapling-output.params': 'https://download.z.cash/downloads/sapling-output.params'
};

function getParamsPath() {
  const platform = os.platform();
  let paramsPath;

  if (platform === 'darwin') {
    // macOS
    const appSupport = path.join(os.homedir(), 'Library', 'Application Support');
    paramsPath = path.join(appSupport, 'BitcoinZ-LightWallet-Params');
  } else if (platform === 'win32') {
    // Windows
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    paramsPath = path.join(appData, 'BitcoinZ-LightWallet-Params');
  } else {
    // Linux and others
    paramsPath = path.join(os.homedir(), '.bitcoinz-lightwallet-params');
  }

  return paramsPath;
}

function verifyFileHash(filePath, expectedHash) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hex = hashSum.digest('hex');
  return hex === expectedHash;
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const totalBytes = parseInt(response.headers['content-length'], 10);
      let downloadedBytes = 0;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const progress = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        process.stdout.write(`\rDownloading: ${progress}%`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(' ✓');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function setupParams() {
  console.log('🔧 BitcoinZ Sapling Parameters Setup\n');

  const paramsPath = getParamsPath();
  console.log(`📁 Parameters directory: ${paramsPath}`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(paramsPath)) {
    console.log('📁 Creating parameters directory...');
    fs.mkdirSync(paramsPath, { recursive: true });
  }

  // Check if parameters already exist in the lib directory (development)
  const libParamsPath = path.join(__dirname, '..', 'lib', 'zcash-params');
  const hasLibParams = fs.existsSync(libParamsPath);

  for (const [filename, expectedHash] of Object.entries(PARAM_HASHES)) {
    const destPath = path.join(paramsPath, filename);
    
    console.log(`\n📄 Checking ${filename}...`);

    // Check if file already exists and is valid
    if (fs.existsSync(destPath)) {
      console.log('   File exists, verifying hash...');
      if (verifyFileHash(destPath, expectedHash)) {
        console.log('   ✅ Hash verified, skipping download');
        continue;
      } else {
        console.log('   ❌ Hash mismatch, re-downloading...');
        fs.unlinkSync(destPath);
      }
    }

    // Try to copy from lib directory first (for developers)
    if (hasLibParams) {
      const sourcePath = path.join(libParamsPath, filename);
      if (fs.existsSync(sourcePath)) {
        console.log('   📋 Copying from lib directory...');
        fs.copyFileSync(sourcePath, destPath);
        
        if (verifyFileHash(destPath, expectedHash)) {
          console.log('   ✅ Copied and verified');
          continue;
        } else {
          console.log('   ❌ Copy failed verification, downloading...');
          fs.unlinkSync(destPath);
        }
      }
    }

    // Download from internet
    console.log(`   ⬇️  Downloading from ${PARAM_URLS[filename]}...`);
    try {
      await downloadFile(PARAM_URLS[filename], destPath);
      
      // Verify downloaded file
      console.log('   🔍 Verifying downloaded file...');
      if (verifyFileHash(destPath, expectedHash)) {
        console.log('   ✅ Download successful and verified');
      } else {
        throw new Error('Downloaded file hash mismatch');
      }
    } catch (error) {
      console.error(`   ❌ Failed to download ${filename}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\n✅ All Sapling parameters are ready!');
  console.log('\n📍 Parameters location:');
  console.log(`   ${paramsPath}`);
  
  // Show file sizes
  console.log('\n📊 Parameter files:');
  for (const filename of Object.keys(PARAM_HASHES)) {
    const filePath = path.join(paramsPath, filename);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`   ${filename}: ${sizeMB} MB`);
  }

  console.log('\n🎉 Setup complete! You can now send shielded transactions.');
}

// Run if called directly
if (require.main === module) {
  setupParams().catch(error => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupParams, getParamsPath };