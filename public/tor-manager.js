const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

class TorManager {
  constructor() {
    this.torProcess = null;
    this.status = 'stopped'; // stopped, starting, ready, error
    this.port = 9050;
    this.bootstrapProgress = 0;
    this.mainWindow = null;
  }

  /**
   * Set the main window for IPC communication
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Get the path to the bundled Tor binary
   */
  getTorPath(isDev) {
    const platform = process.platform;
    let torBinary;

    if (platform === 'darwin') {
      torBinary = 'tor';
    } else if (platform === 'win32') {
      torBinary = 'tor.exe';
    } else {
      torBinary = 'tor';
    }

    if (this.logToFile) {
      this.logToFile(`[TorManager] getTorPath - isDev: ${isDev}, platform: ${platform}`);
    }

    if (isDev) {
      // Development: use system Tor if available
      if (this.logToFile) {
        this.logToFile(`[TorManager] Using system Tor: ${torBinary}`);
      }
      return torBinary;
    }

    // Production: use bundled Tor from extraResources
    const resourcesPath = process.resourcesPath;
    const torPath = path.join(resourcesPath, 'tor', platform, torBinary);

    if (this.logToFile) {
      this.logToFile(`[TorManager] Production Tor path: ${torPath}`);

      // Check if file exists
      const fs = require('fs');
      const exists = fs.existsSync(torPath);
      this.logToFile(`[TorManager] Tor binary exists: ${exists}`);

      if (exists) {
        const stats = fs.statSync(torPath);
        this.logToFile(`[TorManager] Tor binary size: ${stats.size} bytes`);
        this.logToFile(`[TorManager] Tor binary executable: ${(stats.mode & 0o111) !== 0}`);
      } else {
        // List what's actually in the directory
        const torDir = path.join(resourcesPath, 'tor');
        try {
          if (fs.existsSync(torDir)) {
            const files = fs.readdirSync(torDir);
            this.logToFile(`[TorManager] Contents of tor directory: ${JSON.stringify(files)}`);

            const platformDir = path.join(torDir, platform);
            if (fs.existsSync(platformDir)) {
              const platformFiles = fs.readdirSync(platformDir);
              this.logToFile(`[TorManager] Contents of tor/${platform}: ${JSON.stringify(platformFiles)}`);
            } else {
              this.logToFile(`[TorManager] Platform directory does not exist: ${platformDir}`);
            }
          } else {
            this.logToFile(`[TorManager] Tor directory does not exist: ${torDir}`);
            this.logToFile(`[TorManager] Resources path contents: ${JSON.stringify(fs.readdirSync(resourcesPath))}`);
          }
        } catch (err) {
          this.logToFile(`[TorManager] Error listing directories: ${err.message}`);
        }
      }
    }

    return torPath;
  }

  /**
   * Get the path to the Tor data directory
   */
  getTorDataDir(app) {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'tor-data');
  }

  /**
   * Create minimal torrc configuration
   */
  createTorrc(torDataDir) {
    const torrcPath = path.join(torDataDir, 'torrc');

    const torrcContent = `
# BitcoinZ Wallet Bundled Tor Configuration
SOCKSPort ${this.port}
DataDirectory ${torDataDir}
ControlPort 0
CookieAuthentication 0
Log notice stdout
`;

    if (!fs.existsSync(torDataDir)) {
      fs.mkdirSync(torDataDir, { recursive: true });
    }

    fs.writeFileSync(torrcPath, torrcContent.trim(), 'utf8');
    return torrcPath;
  }

  /**
   * Check if Tor is already running on the port
   */
  async isTorRunning() {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.connect(this.port, '127.0.0.1');
    });
  }

  /**
   * Start the bundled Tor process
   */
  async start(app, isDev = false) {
    const log = this.logToFile || console.log;
    log('[TorManager] Starting Tor...');

    // Check if Tor is already running
    const alreadyRunning = await this.isTorRunning();
    if (alreadyRunning) {
      log(`[TorManager] Tor already running on port ${this.port}`);
      this.status = 'ready';
      this.bootstrapProgress = 100;

      // Send ready event to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        log('[TorManager] Sending tor-ready event to renderer');
        this.mainWindow.webContents.send('tor-ready');
      } else {
        log('[TorManager] WARNING: mainWindow is null or destroyed, cannot send tor-ready event');
      }

      return { success: true, message: 'Tor already running' };
    }

    try {
      const torPath = this.getTorPath(isDev);
      const torDataDir = this.getTorDataDir(app);
      const torrcPath = this.createTorrc(torDataDir);

      log('[TorManager] Tor binary:', torPath);
      log('[TorManager] Tor data dir:', torDataDir);
      log('[TorManager] Torrc:', torrcPath);

      // Check if Tor binary exists (in production)
      if (!isDev && !fs.existsSync(torPath)) {
        log('[TorManager] ERROR: Tor binary not found:', torPath);
        this.status = 'error';
        return { success: false, message: 'Tor binary not found' };
      }

      this.status = 'starting';
      this.bootstrapProgress = 0;

      // Spawn Tor process
      this.torProcess = spawn(torPath, ['-f', torrcPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Handle Tor output to track bootstrap progress
      this.torProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[Tor]', output.trim());

        // Parse bootstrap progress
        const bootstrapMatch = output.match(/Bootstrapped (\d+)%/);
        if (bootstrapMatch) {
          this.bootstrapProgress = parseInt(bootstrapMatch[1]);
          console.log(`[TorManager] Bootstrap progress: ${this.bootstrapProgress}%`);

          // Send progress update to renderer
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('tor-bootstrap-progress', {
              progress: this.bootstrapProgress,
              status: this.status
            });
          }

          if (this.bootstrapProgress === 100) {
            this.status = 'ready';
            console.log('[TorManager] Tor is ready!');

            // Send ready event to renderer
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('tor-ready');
            }
          }
        }
      });

      this.torProcess.stderr.on('data', (data) => {
        console.error('[Tor Error]', data.toString().trim());
      });

      this.torProcess.on('error', (err) => {
        console.error('[TorManager] Failed to start Tor:', err.message);
        this.status = 'error';
      });

      this.torProcess.on('exit', (code) => {
        console.log(`[TorManager] Tor process exited with code ${code}`);
        this.status = 'stopped';
        this.torProcess = null;
      });

      // Wait a bit for Tor to start
      await this.waitForReady(30000); // 30 second timeout

      return { success: true, message: 'Tor started successfully' };
    } catch (error) {
      console.error('[TorManager] Error starting Tor:', error);
      this.status = 'error';
      return { success: false, message: error.message };
    }
  }

  /**
   * Wait for Tor to be ready
   */
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.status === 'ready') {
        return true;
      }
      if (this.status === 'error') {
        throw new Error('Tor failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Tor startup timeout');
  }

  /**
   * Stop the Tor process
   */
  stop() {
    if (this.torProcess) {
      console.log('[TorManager] Stopping Tor...');
      this.torProcess.kill();
      this.torProcess = null;
      this.status = 'stopped';
      this.bootstrapProgress = 0;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      status: this.status,
      progress: this.bootstrapProgress,
      port: this.port
    };
  }
}

module.exports = TorManager;
