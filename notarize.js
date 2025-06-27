const { notarize } = require('electron-notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Check if we have the required environment variables
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('⚠️  Skipping notarization: Missing Apple credentials');
    console.log('   Required: APPLE_ID, APPLE_ID_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`🔐 Notarizing ${appName}...`);

  try {
    await notarize({
      appBundleId: 'com.bitcoinz.blue',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
      tool: 'notarytool' // Use the new notarytool instead of legacy altool
    });

    console.log(`✅ Notarization successful for ${appName}`);
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};