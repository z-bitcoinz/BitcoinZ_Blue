/* eslint-disable camelcase */
const fs = require("fs");
const electron_notarize = require("electron-notarize");

module.exports = async function (params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== "darwin") {
    return;
  }
  // console.log('afterSign hook triggered', params);

  // Same appId in electron-builder.
  const appId = "com.bitcoinz.blue";

  const appPath = params.artifactPaths.find((p) => p.endsWith(".dmg"));

  if (!appPath || !fs.existsSync(appPath)) {
    console.log(`Skipping notarization - no DMG found or notarization not configured`);

    // Remove quarantine attributes from app bundles to help with Gatekeeper
    const appBundles = params.artifactPaths.filter(p => p.includes(".app"));
    for (const bundle of appBundles) {
      try {
        console.log(`Removing quarantine attributes from ${bundle}`);
        require('child_process').execSync(`xattr -cr "${bundle}"`, { stdio: 'inherit' });
      } catch (error) {
        console.log(`Warning: Could not remove quarantine attributes: ${error.message}`);
      }
    }

    return;
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await electron_notarize.notarize({
      appBundleId: appId,
      appPath,
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword,
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Done notarizing ${appId}`);
};
