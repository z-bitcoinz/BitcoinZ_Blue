#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Post-build: Ensuring native module compatibility...');

// Paths
const buildDir = path.join(__dirname, '..', 'build');
const srcDir = path.join(__dirname, '..', 'src');

// Check if native.node exists in src
const srcNativeNode = path.join(srcDir, 'native.node');
const buildNativeNode = path.join(buildDir, 'native.node');

if (fs.existsSync(srcNativeNode)) {
  // Copy native.node to build directory
  if (!fs.existsSync(buildNativeNode)) {
    fs.copyFileSync(srcNativeNode, buildNativeNode);
    console.log('Post-build: Copied native.node to build directory');
  }
  
  // Also copy with hash pattern for webpack
  const files = fs.readdirSync(srcDir);
  const nativeNodePattern = /^native-[a-f0-9]+\.node$/;
  
  files.forEach(file => {
    if (nativeNodePattern.test(file)) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(buildDir, file);
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Post-build: Copied ${file} to build directory`);
      }
    }
  });
} else {
  console.warn('Post-build: Warning - native.node not found in src directory');
}

// Create a native-loader.js wrapper in build if needed
const nativeLoaderWrapper = `
// Native module loader wrapper for production
const path = require('path');
const fs = require('fs');

function loadNativeModule() {
  // Try different paths for the native module
  const possiblePaths = [
    path.join(__dirname, 'native.node'),
    path.join(__dirname, '..', 'app.asar.unpacked', 'build', 'native.node'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'native.node')
  ];
  
  // Also check for hashed versions
  const dir = __dirname;
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (/^native-[a-f0-9]+\\.node$/.test(file)) {
        possiblePaths.unshift(path.join(dir, file));
      }
    });
  }
  
  for (const modulePath of possiblePaths) {
    try {
      if (fs.existsSync(modulePath)) {
        return require(modulePath);
      }
    } catch (e) {
      console.error('Failed to load from', modulePath, e.message);
    }
  }
  
  throw new Error('Could not load native module from any location');
}

module.exports = loadNativeModule;
`;

const nativeLoaderPath = path.join(buildDir, 'native-loader.js');
if (!fs.existsSync(nativeLoaderPath)) {
  fs.writeFileSync(nativeLoaderPath, nativeLoaderWrapper);
  console.log('Post-build: Created native-loader.js wrapper in build directory');
}

console.log('Post-build: Complete');