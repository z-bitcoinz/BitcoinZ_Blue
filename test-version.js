#!/usr/bin/env node

// Test script to verify version consistency across the project

const fs = require('fs');
const path = require('path');

console.log('🔍 BitcoinZ Blue Version Consistency Test');
console.log('==========================================');

// Read package.json version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expectedVersion = packageJson.version;
console.log(`📦 Package.json version: ${expectedVersion}`);

// Test files to check
const filesToCheck = [
  {
    file: 'src/components/Sidebar.tsx',
    pattern: /BitcoinZ Blue v([\d.]+)/,
    description: 'About dialog version'
  },
  {
    file: 'bin/printversion.sh',
    pattern: /VERSION="([\d.]+)"/,
    description: 'Build script version (bash)'
  },
  {
    file: 'bin/printversion.ps1',
    pattern: /VERSION=([\d.]+)/,
    description: 'Build script version (PowerShell)'
  },
  {
    file: 'snapcraft.yaml',
    pattern: /version: '([\d.]+)'/,
    description: 'Snap package version'
  },
  {
    file: 'RELEASE_NOTES_v1.1.0.md',
    pattern: /BitcoinZ Blue v([\d.]+) Release/,
    description: 'Release notes version'
  }
];

let allVersionsMatch = true;
let checkedFiles = 0;

filesToCheck.forEach(({ file, pattern, description }) => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(pattern);
    
    if (match) {
      const foundVersion = match[1];
      const matches = foundVersion === expectedVersion;
      
      console.log(`${matches ? '✅' : '❌'} ${description}: ${foundVersion}`);
      
      if (!matches) {
        allVersionsMatch = false;
        console.log(`   Expected: ${expectedVersion}, Found: ${foundVersion}`);
      }
      checkedFiles++;
    } else {
      console.log(`⚠️  ${description}: Pattern not found in ${file}`);
    }
  } else {
    console.log(`⚠️  ${description}: File ${file} not found`);
  }
});

console.log('\n📊 Summary:');
console.log(`   Files checked: ${checkedFiles}`);
console.log(`   Version consistency: ${allVersionsMatch ? '✅ PASS' : '❌ FAIL'}`);
console.log(`   Target version: ${expectedVersion}`);

if (allVersionsMatch) {
  console.log('\n🎉 All version references are consistent!');
  console.log('✅ Ready for Ubuntu Store submission');
} else {
  console.log('\n❌ Version inconsistencies found!');
  console.log('Please fix the version mismatches before proceeding.');
  process.exit(1);
}

// Additional checks
console.log('\n🔍 Additional Information:');
console.log(`   Product name: ${packageJson.productName}`);
console.log(`   App ID: ${packageJson.build?.appId || 'Not set'}`);
console.log(`   Description: ${packageJson.description}`);
console.log(`   Repository: ${packageJson.repository?.url || 'Not set'}`);

// Check if this is a release version (no pre-release identifiers)
const isReleaseVersion = /^\d+\.\d+\.\d+$/.test(expectedVersion);
console.log(`   Release version: ${isReleaseVersion ? '✅ Yes' : '❌ No (contains pre-release identifiers)'}`);

console.log('\n🚀 Next steps for Ubuntu Store:');
console.log('   1. Run: yarn build');
console.log('   2. Run: yarn dist:linux');
console.log('   3. Run: ./scripts/prepare-ubuntu-store.sh');
console.log('   4. Follow Ubuntu Store submission guide');
