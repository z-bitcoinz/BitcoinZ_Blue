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
  
  // Handle different parameter structures
  let appPath, appName, appBundle;
  
  if (params.packager && params.packager.appInfo) {
    // Standard build
    appPath = params.appOutDir;
    appName = params.packager.appInfo.productFilename;
    appBundle = path.join(appPath, `${appName}.app`);
  } else if (params.outDir && params.artifactPaths) {
    // AfterAllArtifactBuild hook
    console.log('Running in afterAllArtifactBuild mode');
    
    // Find app bundles in the output directory
    const distPath = params.outDir;
    const macDirs = ['mac', 'mac-arm64'];
    
    for (const dir of macDirs) {
      const dirPath = path.join(distPath, dir);
      if (fs.existsSync(dirPath)) {
        const appBundlePath = path.join(dirPath, 'BitcoinZ Blue.app');
        if (fs.existsSync(appBundlePath)) {
          console.log(`Found app bundle: ${appBundlePath}`);
          await signAppBundle(appBundlePath);
        }
      }
    }
    
    // Exit early for afterAllArtifactBuild
    return;
  } else {
    console.log('Warning: Unexpected parameter structure in afterSign hook');
    return;
  }

  // Sign the app bundle
  await signAppBundle(appBundle);

  // Check for notarization credentials
  if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD && process.env.APPLE_TEAM_ID) {
    // Look for DMG for notarization
    const dmgPath = params.artifactPaths?.find((p) => p.endsWith(".dmg"));
    
    if (dmgPath && fs.existsSync(dmgPath)) {
      console.log(`Notarizing ${appId} found at ${dmgPath}`);
      
      try {
        await electron_notarize.notarize({
          tool: 'notarytool',
          appBundleId: appId,
          appPath: dmgPath,
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_ID_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        });
        console.log(`✅ Done notarizing ${appId}`);
      } catch (error) {
        console.error(`❌ Notarization error: ${error.message}`);
      }
    }
  } else {
    console.log('ℹ️  No Apple credentials provided, skipping notarization');
    console.log('   Required: APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID');
  }
};

// Helper function to sign an app bundle
async function signAppBundle(appBundle) {
  if (!fs.existsSync(appBundle)) {
    console.log(`App bundle not found: ${appBundle}`);
    return;
  }
  
  try {
    // Check if already signed
    let signCheck = '';
    let isProperlySignedWithDeveloperID = false;
    
    try {
      signCheck = execSync(`codesign -dv "${appBundle}" 2>&1`, { encoding: 'utf8' });
      isProperlySignedWithDeveloperID = signCheck.includes('Developer ID Application');
    } catch (e) {
      // No signature found
    }
    
    // If we have a signing identity and the app isn't already signed with Developer ID
    if (process.env.APPLE_SIGNING_IDENTITY && !isProperlySignedWithDeveloperID) {
      console.log(`🔐 Signing with Developer ID: ${appBundle}`);
      
      const entitlementsPath = path.join(__dirname, 'configs', 'entitlements.mac.plist');
      if (fs.existsSync(entitlementsPath)) {
        execSync(`codesign --force --deep --sign "${process.env.APPLE_SIGNING_IDENTITY}" --options runtime --entitlements "${entitlementsPath}" "${appBundle}"`, { stdio: 'inherit' });
        console.log('✅ Developer ID signature applied');
      } else {
        execSync(`codesign --force --deep --sign "${process.env.APPLE_SIGNING_IDENTITY}" --options runtime "${appBundle}"`, { stdio: 'inherit' });
        console.log('✅ Developer ID signature applied (no entitlements file)');
      }
    } else if (!signCheck.includes('adhoc') && !signCheck.includes('Authority')) {
      console.log(`🔐 Applying ad-hoc signature: ${appBundle}`);
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
    console.error(`❌ Error during signing: ${error.message}`);
  }
}
