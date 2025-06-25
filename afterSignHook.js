/* eslint-disable camelcase */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const electron_notarize = require("electron-notarize");

module.exports = async function (params) {
  // Only process on macOS
  if (process.platform !== "darwin") {
    return;
  }

  console.log('afterSign hook triggered', params);

  const appId = "com.bitcoinz.blue";
  const appPath = params.appOutDir;
  const appName = params.packager.appInfo.productFilename;
  const appBundle = path.join(appPath, `${appName}.app`);

  // First, ensure the app is properly signed with ad-hoc signature
  if (fs.existsSync(appBundle)) {
    try {
      console.log(`🔐 Ensuring ad-hoc signature on ${appBundle}`);
      
      // Check if already signed
      const signCheck = execSync(`codesign -dv "${appBundle}" 2>&1`, { encoding: 'utf8' });
      
      if (!signCheck.includes('adhoc') && !signCheck.includes('Authority')) {
        console.log('⚠️  No signature detected, applying ad-hoc signature...');
        execSync(`codesign --force --deep --sign - "${appBundle}"`, { stdio: 'inherit' });
        console.log('✅ Ad-hoc signature applied');
      } else {
        console.log('✅ App is already signed');
      }
      
      // Remove quarantine attributes
      execSync(`xattr -cr "${appBundle}"`, { stdio: 'inherit' });
      console.log('✅ Quarantine attributes removed');
      
      // Verify the signature
      const verifyResult = execSync(`codesign -dv --verbose=4 "${appBundle}" 2>&1`, { encoding: 'utf8' });
      console.log('📋 Signature verification:', verifyResult.split('\n')[0]);
      
    } catch (error) {
      console.error(`❌ Error during ad-hoc signing: ${error.message}`);
    }
  }

  // Check for notarization credentials
  if (process.env.appleId && process.env.appleIdPassword) {
    // Look for DMG for notarization
    const dmgPath = params.artifactPaths.find((p) => p.endsWith(".dmg"));
    
    if (dmgPath && fs.existsSync(dmgPath)) {
      console.log(`Notarizing ${appId} found at ${dmgPath}`);
      
      try {
        await electron_notarize.notarize({
          appBundleId: appId,
          appPath: dmgPath,
          appleId: process.env.appleId,
          appleIdPassword: process.env.appleIdPassword,
        });
        console.log(`✅ Done notarizing ${appId}`);
      } catch (error) {
        console.error(`❌ Notarization error: ${error.message}`);
      }
    }
  } else {
    console.log('ℹ️  No Apple credentials provided, skipping notarization');
  }
};
