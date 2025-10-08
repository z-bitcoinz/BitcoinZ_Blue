#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Electron-builder afterPack hook
 * Moves Tor binary out of the app before code signing to avoid hardened runtime conflicts
 */
exports.afterPack = async function(context) {
  const appOutDir = context.appOutDir;
  const platform = context.packager.platform.name;

  console.log(`[afterPack] Running for platform: ${platform}`);

  if (platform === 'mac') {
    const appPath = path.join(appOutDir, `${context.packager.appInfo.productName}.app`);
    const torDir = path.join(appPath, 'Contents', 'Resources', 'tor');
    const tempTorDir = path.join(appOutDir, '.temp-tor');

    if (fs.existsSync(torDir)) {
      console.log('[afterPack] Moving Tor binaries out of app before signing...');
      console.log(`  From: ${torDir}`);
      console.log(`  To: ${tempTorDir}`);

      // Move entire tor directory to temp location
      fs.renameSync(torDir, tempTorDir);

      console.log('[afterPack] ✅ Tor binaries moved successfully');
    } else {
      console.log('[afterPack] ⚠️  Tor directory not found, skipping');
    }
  }
};

/**
 * Electron-builder afterSign hook
 * Moves Tor binary back into the app after code signing is complete
 */
exports.afterSign = async function(context) {
  const appOutDir = context.appOutDir;
  const platform = context.packager.platform.name;

  console.log(`[afterSign] Running for platform: ${platform}`);

  if (platform === 'mac') {
    const appPath = path.join(appOutDir, `${context.packager.appInfo.productName}.app`);
    const torDir = path.join(appPath, 'Contents', 'Resources', 'tor');
    const tempTorDir = path.join(appOutDir, '.temp-tor');

    if (fs.existsSync(tempTorDir)) {
      console.log('[afterSign] Moving Tor binaries back into app after signing...');
      console.log(`  From: ${tempTorDir}`);
      console.log(`  To: ${torDir}`);

      // Ensure Resources directory exists
      const resourcesDir = path.join(appPath, 'Contents', 'Resources');
      if (!fs.existsSync(resourcesDir)) {
        fs.mkdirSync(resourcesDir, { recursive: true });
      }

      // Move tor directory back
      fs.renameSync(tempTorDir, torDir);

      console.log('[afterSign] ✅ Tor binaries restored successfully');
    } else {
      console.log('[afterSign] ⚠️  Temp Tor directory not found, skipping');
    }
  }
};
