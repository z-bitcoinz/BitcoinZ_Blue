/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

declare const __non_webpack_require__: typeof require;

let nativeModule: any = null;
let loadError: string | null = null;

// Helper function to get detailed error information
function getDetailedError(error: any): string {
  const errorInfo = [];
  
  if (error.message) {
    errorInfo.push(`Message: ${error.message}`);
  }
  
  if (error.code) {
    errorInfo.push(`Code: ${error.code}`);
  }
  
  if (error.errno) {
    errorInfo.push(`Error Number: ${error.errno}`);
  }
  
  if (error.syscall) {
    errorInfo.push(`System Call: ${error.syscall}`);
  }
  
  if (error.path) {
    errorInfo.push(`Path: ${error.path}`);
  }
  
  // Platform-specific error information
  if (process.platform === 'win32') {
    errorInfo.push('Platform: Windows');
    if (error.message?.includes('The specified module could not be found')) {
      errorInfo.push('Hint: This usually indicates missing Visual C++ Redistributables or dependent DLLs');
    }
  }
  
  return errorInfo.join('\n');
}

// Try to load the native module with better error handling
function loadNativeModule(): any {
  if (nativeModule) {
    return nativeModule;
  }
  
  if (loadError) {
    throw new Error(`Native module failed to load: ${loadError}`);
  }
  
  try {
    console.log('Attempting to load native module...');
    console.log(`Platform: ${process.platform}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Node.js version: ${process.version}`);
    
    // In production/webpack builds, the native module is processed by file-loader
    // and gets a hashed name. We need to handle both development and production cases.
    let loadedModule = null;
    
    try {
      // First try the direct import which webpack will handle
      const nativeModulePath = require('./native.node');
      console.log('Webpack provided path:', nativeModulePath);
      
      // In webpack builds, require('./native.node') returns the path string
      // We need to require that path to get the actual module
      if (typeof nativeModulePath === 'string') {
        // This is a webpack build - load from the hashed path
        loadedModule = __non_webpack_require__(nativeModulePath);
      } else {
        // Direct load worked (development mode)
        loadedModule = nativeModulePath;
      }
    } catch (e: any) {
      console.log('Direct import failed, trying fallback:', e.message);
      
      // Fallback for Electron production builds
      // Try to load from the app's resource path
      const electron = (window as any).require ? (window as any).require('electron') : null;
      if (electron && electron.remote) {
        const path = electron.remote.require('path');
        const fs = electron.remote.require('fs');
        const app = electron.remote.app;
        
        const possiblePaths = [
          path.join(__dirname, 'native.node'),
          path.join(app.getAppPath(), 'build', 'native.node'),
        ];
        
        // Add resourcesPath if available (Electron production only)
        if ((process as any).resourcesPath) {
          possiblePaths.push(path.join((process as any).resourcesPath, 'app.asar.unpacked', 'build', 'native.node'));
        }
        
        // Also check for hashed versions in the build directory
        const buildDir = path.join(app.getAppPath(), 'build');
        if (fs.existsSync(buildDir)) {
          const files = fs.readdirSync(buildDir);
          files.forEach((file: string) => {
            if (/^native-[a-f0-9]+\.node$/.test(file)) {
              possiblePaths.unshift(path.join(buildDir, file));
            }
          });
        }
        
        for (const modulePath of possiblePaths) {
          try {
            if (fs.existsSync(modulePath)) {
              console.log(`Trying to load from: ${modulePath}`);
              loadedModule = __non_webpack_require__(modulePath);
              if (loadedModule) {
                console.log(`Successfully loaded from: ${modulePath}`);
                break;
              }
            }
          } catch (err: any) {
            console.log(`Failed to load from ${modulePath}:`, err.message);
          }
        }
      }
    }
    
    if (!loadedModule) {
      throw new Error('Could not load native module from any location');
    }
    
    nativeModule = loadedModule;
    console.log('SUCCESS: Native module loaded successfully');
    console.log('Available functions:', Object.keys(nativeModule));
    
    // Test a basic function if available
    if (nativeModule.litelib_say_hello) {
      try {
        const testResult = nativeModule.litelib_say_hello('connection-test');
        console.log('Native module test result:', testResult);
      } catch (testError) {
        console.warn('Native module loaded but test function failed:', testError);
      }
    }
    
    return nativeModule;
    
  } catch (error) {
    console.error('CRITICAL: Failed to load native module');
    console.error('This will prevent the wallet from functioning properly');
    console.error('Detailed error information:');
    console.error(getDetailedError(error));
    
    // Provide platform-specific troubleshooting advice
    if (process.platform === 'win32') {
      console.error('\nWindows Troubleshooting:');
      console.error('1. Install Visual C++ Redistributable for Visual Studio 2019/2022');
      console.error('2. Ensure all Windows updates are installed');
      console.error('3. Try running as administrator');
      console.error('4. Check Windows Event Viewer for additional error details');
    } else if (process.platform === 'darwin') {
      console.error('\nmacOS Troubleshooting:');
      console.error('1. Check System Preferences > Security & Privacy');
      console.error('2. Try running: xattr -cr /path/to/app');
      console.error('3. Install Xcode Command Line Tools');
    } else {
      console.error('\nLinux Troubleshooting:');
      console.error('1. Install build-essential package');
      console.error('2. Check library dependencies with ldd');
      console.error('3. Ensure glibc version compatibility');
    }
    
    loadError = getDetailedError(error);
    throw new Error(`Native module failed to load: ${loadError}`);
  }
}

// Export the loader function
export default function getNativeModule(): any {
  return loadNativeModule();
}

// Export individual functions with error handling
export function litelib_say_hello(s: string): string {
  const native = loadNativeModule();
  return native.litelib_say_hello(s);
}

export function litelib_wallet_exists(chain_name: string): boolean {
  const native = loadNativeModule();
  return native.litelib_wallet_exists(chain_name);
}

export function litelib_initialize_new(server_uri: string): string {
  const native = loadNativeModule();
  return native.litelib_initialize_new(server_uri);
}

export function litelib_initialize_new_from_phrase(
  server_uri: string,
  seed: string,
  birthday: number,
  overwrite: boolean
): string {
  const native = loadNativeModule();
  return native.litelib_initialize_new_from_phrase(server_uri, seed, birthday, overwrite);
}

export function litelib_initialize_existing(server_uri: string): string {
  const native = loadNativeModule();
  return native.litelib_initialize_existing(server_uri);
}

export function litelib_deinitialize(): string {
  const native = loadNativeModule();
  return native.litelib_deinitialize();
}

export function litelib_execute(cmd: string, args: string): string {
  const native = loadNativeModule();
  return native.litelib_execute(cmd, args);
}