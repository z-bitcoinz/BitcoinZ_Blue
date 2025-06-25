const fs = require('fs');
const path = require('path');

module.exports = async function (context) {
  // Only process Linux builds
  if (context.packager.platform.name === 'linux') {
    console.log('AfterPack hook: Processing Linux build...');
    
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