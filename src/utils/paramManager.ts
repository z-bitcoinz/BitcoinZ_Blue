const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');
const os = window.require('os');
const crypto = window.require('crypto');
const https = window.require('https');

// Expected SHA256 hashes for the parameter files
const PARAM_HASHES = {
  'sapling-spend.params': '8e48ffd23abb3a5fd9c5589204f32d9c31285a04b78096ba40a79b75677efc13',
  'sapling-output.params': '2f0ebbcbb9bb0bcffe95a397e7eba89c29eb4dde6191c339db88570e3f3fb0e4'
};

// URLs for downloading parameters (Zcash official)
const PARAM_URLS = {
  'sapling-spend.params': 'https://download.z.cash/downloads/sapling-spend.params',
  'sapling-output.params': 'https://download.z.cash/downloads/sapling-output.params'
};

// File sizes for progress tracking
const PARAM_SIZES = {
  'sapling-spend.params': 47958396, // ~45.7 MB
  'sapling-output.params': 3592860  // ~3.4 MB
};

export interface ProgressCallback {
  (progress: number, message: string): void;
}

export class ParamManager {
  private static instance: ParamManager;

  private constructor() {}

  static getInstance(): ParamManager {
    if (!ParamManager.instance) {
      ParamManager.instance = new ParamManager();
    }
    return ParamManager.instance;
  }

  /**
   * Get the platform-specific parameter directory path
   */
  getParamsPath(): string {
    const platform = os.platform();
    let paramsPath: string;

    if (platform === 'darwin') {
      // macOS
      const appSupport = path.join(os.homedir(), 'Library', 'Application Support');
      paramsPath = path.join(appSupport, 'BitcoinZ-LightWallet-Params');
    } else if (platform === 'win32') {
      // Windows
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      paramsPath = path.join(appData, 'BitcoinZ-LightWallet-Params');
    } else {
      // Linux and others
      paramsPath = path.join(os.homedir(), '.bitcoinz-lightwallet-params');
    }

    return paramsPath;
  }

  /**
   * Verify file hash against expected SHA256
   */
  private verifyFileHash(filePath: string, expectedHash: string): boolean {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');
      return hex === expectedHash;
    } catch (error) {
      console.error(`Error verifying hash for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Download a file with progress tracking
   */
  private downloadFile(url: string, destPath: string, expectedSize: number, progressCallback?: ProgressCallback): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      let downloadedBytes = 0;

      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          file.close();
          fs.unlinkSync(destPath);
          this.downloadFile(response.headers.location!, destPath, expectedSize, progressCallback)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const progress = (downloadedBytes / expectedSize) * 100;
          const downloadedMB = Math.round(downloadedBytes / 1024 / 1024);
          const totalMB = Math.round(expectedSize / 1024 / 1024);
          if (progressCallback) {
            progressCallback(Math.min(progress, 100), `Downloading: ${downloadedMB} MB / ${totalMB} MB`);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });
    });
  }

  /**
   * Check if parameters are already set up and valid
   */
  async areParamsValid(): Promise<boolean> {
    const paramsPath = this.getParamsPath();
    
    // Check if embedded parameters are working
    try {
      // Try to create a test transaction with embedded params
      // This is a quick check to see if the native module has working embedded params
      const testResult = await ipcRenderer.invoke('test-embedded-params');
      if (testResult === true) {
        console.log('Embedded parameters are working');
        return true;
      }
    } catch (error) {
      console.log('Embedded parameters check failed, checking filesystem...');
    }

    // Check filesystem parameters as fallback
    for (const [filename, expectedHash] of Object.entries(PARAM_HASHES)) {
      const filePath = path.join(paramsPath, filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`Parameter file missing: ${filename}`);
        return false;
      }

      if (!this.verifyFileHash(filePath, expectedHash)) {
        console.log(`Parameter file corrupted: ${filename}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Setup parameters - download if missing or corrupted
   */
  async setupParams(progressCallback?: ProgressCallback): Promise<void> {
    const paramsPath = this.getParamsPath();

    // Create directory if it doesn't exist
    if (!fs.existsSync(paramsPath)) {
      progressCallback?.(0, 'Creating parameters directory...');
      fs.mkdirSync(paramsPath, { recursive: true });
    }

    // Check if parameters already exist in the lib directory (development)
    const libParamsPath = path.join(__dirname, '..', '..', '..', 'lib', 'zcash-params');
    const hasLibParams = fs.existsSync(libParamsPath);

    for (const [filename, expectedHash] of Object.entries(PARAM_HASHES)) {
      const destPath = path.join(paramsPath, filename);
      
      // Check if file already exists and is valid
      if (fs.existsSync(destPath) && this.verifyFileHash(destPath, expectedHash)) {
        continue;
      }

      // Try to copy from lib directory first (for developers)
      if (hasLibParams) {
        const sourcePath = path.join(libParamsPath, filename);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          
          if (this.verifyFileHash(destPath, expectedHash)) {
            continue;
          } else {
            fs.unlinkSync(destPath);
          }
        }
      }

      // Download from internet
      try {
        // Download the file
        
        await this.downloadFile(
          PARAM_URLS[filename as keyof typeof PARAM_URLS], 
          destPath, 
          PARAM_SIZES[filename as keyof typeof PARAM_SIZES],
          (fileProgress: number, message: string) => {
            // Just pass through the simple MB message
            if (progressCallback) {
              progressCallback(fileProgress, message);
            }
          }
        );

        // Verify downloaded file
        if (!this.verifyFileHash(destPath, expectedHash)) {
          throw new Error(`Downloaded file verification failed`);
        }
      } catch (error) {
        throw new Error(`Failed to download ${filename}: ${error.message}`);
      }
    }

    progressCallback?.(100, 'Setup complete! You can now send private transactions.');
  }

  /**
   * Get the status of parameter files
   */
  getParamStatus(): { exists: boolean; valid: boolean; path: string }[] {
    const paramsPath = this.getParamsPath();
    const status = [];

    for (const [filename, expectedHash] of Object.entries(PARAM_HASHES)) {
      const filePath = path.join(paramsPath, filename);
      const exists = fs.existsSync(filePath);
      const valid = exists && this.verifyFileHash(filePath, expectedHash);
      
      status.push({
        exists,
        valid,
        path: filePath
      });
    }

    return status;
  }
}