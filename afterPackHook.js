const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  console.log('AfterPack hook: Processing build...');
  
  // Copy native-loader.js to build directory if it doesn't exist
  const appOutDir = context.appOutDir;
  const resourcesDir = path.join(appOutDir, 'resources');
  
  // Ensure the native-loader module is accessible in production
  const sourceNativeLoader = path.join(__dirname, 'src', 'native-loader.js');
  const buildNativeLoader = path.join(__dirname, 'build', 'native-loader.js');
  
  // First check if TypeScript was compiled to JavaScript
  if (fs.existsSync(sourceNativeLoader)) {
    try {
      // Create native-loader.js in build directory
      if (!fs.existsSync(buildNativeLoader)) {
        const buildDir = path.join(__dirname, 'build');
        if (!fs.existsSync(buildDir)) {
          fs.mkdirSync(buildDir, { recursive: true });
        }
        fs.copyFileSync(sourceNativeLoader, buildNativeLoader);
        console.log('AfterPack hook: Copied native-loader.js to build directory');
      }
    } catch (err) {
      console.error('AfterPack hook: Error copying native-loader:', err);
    }
  }
  
  // Only process Linux builds for wrapper script
  if (context.packager.platform.name === 'linux') {
    console.log('AfterPack hook: Creating Linux wrapper script...');
    
    const appOutDir = context.appOutDir;
    const executableName = context.packager.executableName || 'bitcoinz-wallet-lite';
    
    // Create wrapper script content
    const wrapperContent = `#!/bin/bash
# Wrapper script for BitcoinZ Blue to set LD_LIBRARY_PATH
APP_DIR="$(dirname "$(readlink -f "$0")")"
export LD_LIBRARY_PATH="$APP_DIR:${LD_LIBRARY_PATH}"
exec "$APP_DIR/${executableName}-bin" "$@"
`;

    // Rename original executable
    const originalExe = path.join(appOutDir, executableName);
    const renamedExe = path.join(appOutDir, `${executableName}-bin`);
    
    if (fs.existsSync(originalExe)) {
      fs.renameSync(originalExe, renamedExe);
      
      // Create wrapper script
      fs.writeFileSync(originalExe, wrapperContent);
      fs.chmodSync(originalExe, '755');
      
      console.log('AfterPack hook: Wrapper script created successfully');
    }
  }
};