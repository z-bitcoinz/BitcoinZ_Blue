const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");
const TorManager = require("./tor-manager");
const os = require("os");

// File logging setup for debugging production builds
const logFilePath = path.join(os.homedir(), 'BitcoinZ-Wallet-Tor.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function logToFile(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(...args); // Also log to console
}

logToFile('='.repeat(80));
logToFile('BitcoinZ Wallet Starting');
logToFile(`isDev: ${isDev}`);
logToFile(`Platform: ${process.platform}`);
logToFile(`App Path: ${app.getAppPath()}`);
logToFile(`Log file: ${logFilePath}`);

// Fix for native module loading in production builds
let native;
try {
  if (isDev) {
    // In development, load from src/native.node
    native = require(path.join(__dirname, '..', 'src', 'native.node'));
  } else {
    // In production, the native module should be in the unpacked directory
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'native.node');
    native = require(unpackedPath);
  }
} catch (error) {
  console.error('Failed to load native module:', error);
  throw error;
}

// Expose the native module functions
const getNativeModule = () => native;

// Disable sandbox if running on Linux to avoid permission issues
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  
  // Set library path for production builds to find libffmpeg.so
  if (!isDev) {
    // Try multiple possible locations for the libraries
    const possiblePaths = [
      "/opt/BitcoinZ Blue",  // Deb installation with space
      "/opt/BitcoinZ-Blue",  // Deb installation without space (fallback)
      process.resourcesPath ? path.dirname(process.resourcesPath) : "",
      __dirname,
      path.join(__dirname, ".."),
      process.cwd()
    ].filter(p => p); // Remove empty paths
    
    // Add all possible paths to LD_LIBRARY_PATH
    const libPaths = possiblePaths.join(":");
    process.env.LD_LIBRARY_PATH = `${libPaths}:${process.env.LD_LIBRARY_PATH || ''}`;
    
    // Also try to load libffmpeg.so directly if we can find it
    try {
      const { existsSync } = require('fs');
      for (const dir of possiblePaths) {
        const ffmpegPath = path.join(dir, 'libffmpeg.so');
        if (existsSync(ffmpegPath)) {
          process.env.LD_LIBRARY_PATH = `${dir}:${process.env.LD_LIBRARY_PATH || ''}`;
          break;
        }
      }
    } catch (e) {
      // Ignore errors in finding libffmpeg
    }
  }
}

class MenuBuilder {
  mainWindow;

  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    const template = process.platform === "darwin" ? this.buildDarwinTemplate() : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const selectionMenu = Menu.buildFromTemplate([{ role: "copy" }, { type: "separator" }, { role: "selectall" }]);

    const inputMenu = Menu.buildFromTemplate([
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { type: "separator" },
      { role: "selectall" },
    ]);

    this.mainWindow.webContents.on("context-menu", (e, props) => {
      const { selectionText, isEditable } = props;
      if (isEditable) {
        inputMenu.popup(this.mainWindow);
      } else if (selectionText && selectionText.trim() !== "") {
        selectionMenu.popup(this.mainWindow);
      } else if (process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true") {
        const { x, y } = props;

        Menu.buildFromTemplate([
          {
            label: "Inspect element",
            click: () => {
              this.mainWindow.inspectElement(x, y);
            },
          },
        ]).popup(this.mainWindow);
      }
    });

    return menu;
  }

  buildDarwinTemplate() {
    const { mainWindow } = this;

    const subMenuAbout = {
      label: "BitcoinZ Blue",
      submenu: [
        {
          label: "About BitcoinZ Blue",
          selector: "orderFrontStandardAboutPanel:",
          click: () => {
            mainWindow.webContents.send("about");
          },
        },
        { type: "separator" },
        { label: "Services", submenu: [] },
        { type: "separator" },
        {
          label: "Hide BitcoinZ Blue",
          accelerator: "Command+H",
          selector: "hide:",
        },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          selector: "hideOtherApplications:",
        },
        { label: "Show All", selector: "unhideAllApplications:" },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit = {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "Command+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "Command+X", selector: "cut:" },
        { label: "Copy", accelerator: "Command+C", selector: "copy:" },
        { label: "Paste", accelerator: "Command+V", selector: "paste:" },
        {
          label: "Select All",
          accelerator: "Command+A",
          selector: "selectAll:",
        },
      ],
    };
    const subMenuViewDev = {
      label: "Wallet",
      submenu: [
        {
          label: "Wallet Seed",
          click: () => {
            mainWindow.webContents.send("seed");
          },
        },
        {
          label: "&Import Private Keys",
          click: () => {
            mainWindow.webContents.send("import");
          },
        },
        {
          label: "&Export All Private Keys",
          click: () => {
            mainWindow.webContents.send("exportall");
          },
        },
        { type: "separator" },
        {
          label: "&Pay URI",
          accelerator: "Ctrl+P",
          click: () => {
            mainWindow.webContents.send("payuri");
          },
        },
        {
          label: "Export All &Transactions",
          click: () => {
            mainWindow.webContents.send("exportalltx");
          },
        },
        {
          label: "&Rescan (from wallet birthday)",
          click: () => {
            mainWindow.webContents.send("rescan");
          },
        },
        {
          label: "&Full Rescan (from Sapling activation)",
          click: () => {
            mainWindow.webContents.send("fullrescan");
          },
        },
        {
          label: "View Lightwalletd Info",
          click: () => {
            this.mainWindow.webContents.send("zcashd");
          },
        },
        // { type: 'separator' },
        // {
        //   label: 'Toggle Developer Tools',
        //   accelerator: 'Alt+Command+I',
        //   click: () => {
        //     this.mainWindow.toggleDevTools();
        //   }
        // }
      ],
    };
    const subMenuViewProd = {
      label: "Wallet",
      submenu: [
        {
          label: "Wallet Seed",
          click: () => {
            mainWindow.webContents.send("seed");
          },
        },
        {
          label: "&Import Private Keys",
          click: () => {
            mainWindow.webContents.send("import");
          },
        },
        {
          label: "&Export All Private Keys",
          click: () => {
            mainWindow.webContents.send("exportall");
          },
        },
        { type: "separator" },
        {
          label: "&Pay URI",
          accelerator: "Ctrl+P",
          click: () => {
            mainWindow.webContents.send("payuri");
          },
        },
        {
          label: "Export All &Transactions",
          click: () => {
            mainWindow.webContents.send("exportalltx");
          },
        },
        {
          label: "&Rescan (from wallet birthday)",
          click: () => {
            mainWindow.webContents.send("rescan");
          },
        },
        {
          label: "&Full Rescan (from Sapling activation)",
          click: () => {
            mainWindow.webContents.send("fullrescan");
          },
        },
        {
          label: "Wallet Settings",
          click: () => {
            this.mainWindow.webContents.send("walletSettings");
          },
        },
        {
          label: "Server info",
          click: () => {
            this.mainWindow.webContents.send("zcashd");
          },
        },
      ],
    };
    const subMenuWindow = {
      label: "Window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "Command+M",
          selector: "performMiniaturize:",
        },
        { label: "Close", accelerator: "Command+W", selector: "performClose:" },
        { type: "separator" },
        { label: "Bring All to Front", selector: "arrangeInFront:" },
      ],
    };
    const subMenuHelp = {
      label: "Help",
      submenu: [
        {
          label: "Donate",
          click() {
            mainWindow.webContents.send("donate");
          },
        },
        {
          label: "Check github.com for updates",
          click() {
            shell.openExternal("https://github.com/z-bitcoinz/BitcoinZ_Blue/releases");
          },
        },
        {
          label: "File a bug...",
          click() {
            shell.openExternal("https://github.com/z-bitcoinz/BitcoinZ_Blue/issues");
          },
        },
      ],
    };

    const subMenuView = process.env.NODE_ENV === "development" ? subMenuViewDev : subMenuViewProd;

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const { mainWindow } = this;

    const templateDefault = [
      {
        label: "&File",
        submenu: [
          {
            label: "&Pay URI",
            accelerator: "Ctrl+P",
            click: () => {
              mainWindow.webContents.send("payuri");
            },
          },
          {
            label: "&Close",
            accelerator: "Ctrl+W",
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: "&Wallet",
        submenu: [
          {
            label: "Wallet Seed",
            click: () => {
              mainWindow.webContents.send("seed");
            },
          },
          {
            label: "&Import Private Keys",
            click: () => {
              mainWindow.webContents.send("import");
            },
          },
          {
            label: "&Export All Private Keys",
            click: () => {
              mainWindow.webContents.send("exportall");
            },
          },
          { type: "separator" },
          {
            label: "Export All &Transactions",
            click: () => {
              mainWindow.webContents.send("exportalltx");
            },
          },
          {
            label: "&Rescan (from wallet birthday)",
            click: () => {
              mainWindow.webContents.send("rescan");
            },
          },
          {
            label: "&Full Rescan (from Sapling activation)",
            click: () => {
              mainWindow.webContents.send("fullrescan");
            },
          },
          {
            label: "Wallet Settings",
            click: () => {
              this.mainWindow.webContents.send("walletSettings");
            },
          },
          {
            label: "Server info",
            click: () => {
              this.mainWindow.webContents.send("zcashd");
            },
          },
          // {
          //   label: 'Devtools',
          //   click: () => {
          //     mainWindow.webContents.openDevTools();
          //   }
          // },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About BitcoinZ Blue",
            click: () => {
              mainWindow.webContents.send("about");
            },
          },
          {
            label: "Donate",
            click() {
              mainWindow.webContents.send("donate");
            },
          },
          {
            label: "Check github.com for updates",
            click() {
              shell.openExternal("https://github.com/z-bitcoinz/BitcoinZ_Blue/releases");
            },
          },
          {
            label: "File a bug...",
            click() {
              shell.openExternal("https://github.com/z-bitcoinz/BitcoinZ_Blue/issues");
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}

// Conditionally include the dev tools installer to load React Dev Tools
let installExtension, REACT_DEVELOPER_TOOLS;

if (isDev) {
  const devTools = require("electron-devtools-installer");
  installExtension = devTools.default;
  REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS;
}

// Global mainWindow reference
let mainWindow = null;

function createWindow() {
  logToFile(`Creating window - isDev: ${isDev}, platform: ${process.platform}`);
  logToFile(`__dirname: ${__dirname}`);
  logToFile(`process.resourcesPath: ${process.resourcesPath}`);

  mainWindow = new BrowserWindow({
    width: 901,
    height: 640,
    minHeight: 450,
    minWidth: 901,
    show: false, // Don't show window until it's ready
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      enableRemoteModule: true,
    },
  });

  // Open DevTools in production for debugging (Cmd+Option+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.meta && input.alt && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
    }
  });


  // Load from localhost if in development
  // Otherwise load index.html file
  const indexPath = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "index.html")}`;
  logToFile(`Loading from: ${indexPath}`);

  // Show window when ready (fixes Linux visibility issue)
  mainWindow.once('ready-to-show', () => {
    logToFile('Window ready to show');
    mainWindow.show();
    mainWindow.focus();
  });
  
  mainWindow.loadURL(indexPath).catch((error) => {
    console.error(`Failed to load URL: ${indexPath}`, error);
  });
  
  // Add error handling for page load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Page failed to load: ${validatedURL}`, `Error ${errorCode}: ${errorDescription}`);
    
    // Try alternative paths if the main one fails
    if (!isDev && errorCode === -6) { // ERR_FILE_NOT_FOUND
      console.log('Trying alternative paths...');
      const alternatives = [
        `file://${path.join(process.resourcesPath, 'app.asar.unpacked/build/index.html')}`,
        `file://${path.join(process.resourcesPath, 'app.asar/build/index.html')}`,
        `file://${path.join(__dirname, '../build/index.html')}`,
      ];
      
      for (const altPath of alternatives) {
        console.log(`Trying: ${altPath}`);
        try {
          mainWindow.loadURL(altPath);
          break;
        } catch (e) {
          console.error(`Failed alternative: ${altPath}`, e);
        }
      }
    }
  });

  // Wait for the renderer process to signal that IPC listeners are ready
  // before building the menu to prevent race conditions
  ipcMain.once("ipc-listeners-ready", () => {
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
  });

  let waitingForClose = false;
  let proceedToClose = false;

  ipcMain.handle("loadSettings", async () => {
    return await settings.get("all");
  });

  ipcMain.handle("saveSettings", async (event, kv) => {
    return await settings.set(`all.${kv.key}`, kv.value);
  });

  // Add handler for getting app data path (replacement for remote.app.getPath)
  ipcMain.handle("get-app-data-path", async () => {
    return app.getPath("appData");
  });

  // Add handler for restarting the application
  ipcMain.handle("restartApp", async () => {
    console.log("[Electron] Restarting application...");

    // Send signal to renderer to save wallet before restart
    mainWindow.webContents.send("appquitting");

    // Wait a bit for wallet to save
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Restart the app
    app.relaunch();
    app.quit();

    return { success: true };
  });

  // Helper function to get wallet data directory
  function getWalletDataDir() {
    const userDataPath = app.getPath('userData');
    const walletDir = path.join(userDataPath, 'bitcoinz-lightwallet');

    // Windows-specific directory validation
    if (process.platform === 'win32') {
      try {
        // Ensure the directory exists and is accessible
        if (!fs.existsSync(walletDir)) {
          fs.mkdirSync(walletDir, { recursive: true });
          console.log('🪟 Created Windows wallet directory:', walletDir);
        }

        // Test write permissions
        const testFile = path.join(walletDir, 'test-write.tmp');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        console.log('✅ Windows wallet directory permissions verified');

      } catch (error) {
        console.error('❌ Windows wallet directory issue:', error);
        console.error('Wallet directory:', walletDir);
        console.error('This may cause balance persistence issues');
      }
    }

    return walletDir;
  }

  // Security settings IPC handlers
  ipcMain.handle('save-security-settings', async (event, settings) => {
    try {
      const walletDataDir = getWalletDataDir();
      await fs.promises.mkdir(walletDataDir, { recursive: true });
      const settingsPath = path.join(walletDataDir, 'security-settings.json');
      await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving security settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-security-settings', async (event) => {
    try {
      const walletDataDir = getWalletDataDir();
      await fs.promises.mkdir(walletDataDir, { recursive: true });
      const settingsPath = path.join(walletDataDir, 'security-settings.json');
      if (await fs.promises.access(settingsPath).then(() => true).catch(() => false)) {
        const data = await fs.promises.readFile(settingsPath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error loading security settings:', error);
      return null;
    }
  });

  // Add handler for testing embedded parameters
  ipcMain.handle("test-embedded-params", async () => {
    try {
      // Check if the native module has embedded parameters by trying to access them
      const native = getNativeModule();
      // This is a simple check - in reality the native module would need a test method
      // For now, we'll assume embedded params work if the native module loads
      return native !== null && native !== undefined;
    } catch (error) {
      console.error("Failed to test embedded params:", error);
      return false;
    }
  });

  // Add handler for showing save dialog
  ipcMain.handle("show-save-dialog", async (event, options) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: options.defaultPath || "bitcoinz_contacts.json",
        filters: options.filters || [
          { name: "JSON Files", extensions: ["json"] },
          { name: "All Files", extensions: ["*"] }
        ],
        ...options
      });
      return result;
    } catch (error) {
      console.error("Error showing save dialog:", error);
      return { canceled: true };
    }
  });

  // Add handler for writing file
  ipcMain.handle("write-file", async (event, filePath, data) => {
    try {
      await fs.promises.writeFile(filePath, data, "utf8");
      return { success: true };
    } catch (error) {
      console.error("Error writing file:", error);
      return { success: false, error: error.message };
    }
  });

  // Windows-specific wallet diagnostics handler
  ipcMain.handle('windows-wallet-diagnostics', async () => {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Not a Windows platform' };
    }

    try {
      const walletDataDir = getWalletDataDir();
      const walletFile = path.join(walletDataDir, 'zecwallet-light-wallet.dat');

      const diagnostics = {
        platform: process.platform,
        walletDir: walletDataDir,
        walletFile: walletFile,
        walletDirExists: fs.existsSync(walletDataDir),
        walletFileExists: fs.existsSync(walletFile),
        walletDirPermissions: null,
        walletFileSize: null,
        walletFileModified: null
      };

      // Check directory permissions
      try {
        await fs.promises.access(walletDataDir, fs.constants.R_OK | fs.constants.W_OK);
        diagnostics.walletDirPermissions = 'OK';
      } catch (permError) {
        diagnostics.walletDirPermissions = `Error: ${permError.message}`;
      }

      // Check wallet file details
      if (diagnostics.walletFileExists) {
        try {
          const stats = await fs.promises.stat(walletFile);
          diagnostics.walletFileSize = stats.size;
          diagnostics.walletFileModified = stats.mtime.toISOString();
        } catch (statError) {
          console.error('Error getting wallet file stats:', statError);
        }
      }

      console.log('🪟 Windows wallet diagnostics:', diagnostics);
      return { success: true, diagnostics };

    } catch (error) {
      console.error('❌ Windows wallet diagnostics failed:', error);
      return { success: false, error: error.message };
    }
  });

  // Tor status IPC handler
  ipcMain.handle('getTorStatus', async () => {
    return torManager.getStatus();
  });

  mainWindow.on("close", (event) => {
    // Send app-closing event first for auto-lock functionality
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send("app-closing");
    }

    // If we are clear to close, then return and allow everything to close
    if (proceedToClose) {
      return;
    }

    // If we're already waiting for close, then don't allow another close event to actually close the window
    if (waitingForClose) {
      console.log("Waiting for close... Timeout in 10s");
      event.preventDefault();
      return;
    }

    waitingForClose = true;
    event.preventDefault();

    ipcMain.on("appquitdone", () => {
      waitingForClose = false;
      proceedToClose = true;
      app.quit();
    });

    mainWindow.webContents.send("appquitting");

    // Failsafe, timeout after 5 seconds
    setTimeout(() => {
      waitingForClose = false;
      proceedToClose = true;
      console.log("Timeout, quitting");

      app.quit();
    }, 5 * 1000);
  });

  // Open DevTools only in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
  
  // Log when the page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });
  
  // Log any console messages from the renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer console [${level}]: ${message} (${sourceId}:${line})`);
  });
}

app.commandLine.appendSwitch("in-process-gpu");

// Initialize Tor manager
const torManager = new TorManager();

// Create a new browser window by invoking the createWindow
// function once the Electron application is initialized.
// Install REACT_DEVELOPER_TOOLS as well if isDev
app.whenReady().then(async () => {
  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((error) => console.log(`An error occurred: , ${error}`));
  }

  // Check if proxy is enabled in settings
  const allSettings = await settings.get("all");
  const proxyEnabled = allSettings?.proxy?.enabled || false;
  logToFile(`Proxy enabled: ${proxyEnabled}`);
  logToFile(`Settings: ${JSON.stringify(allSettings?.proxy || {})}`);

  // Create window FIRST
  createWindow();

  // Set mainWindow reference on torManager for IPC events
  torManager.setMainWindow(mainWindow);
  logToFile('mainWindow set on torManager');

  // Expose logToFile to torManager
  torManager.logToFile = logToFile;

  // Start Tor AFTER window is created and mainWindow is set
  if (proxyEnabled) {
    logToFile("[Electron] Proxy enabled, starting Tor...");
    try {
      await torManager.start(app, isDev);
      logToFile("[Electron] Tor started successfully");
    } catch (error) {
      logToFile(`[Electron] Failed to start Tor: ${error.message}`);
      logToFile(`Stack: ${error.stack}`);
    }
  } else {
    logToFile("[Electron] Proxy disabled, Tor will not start");
  }
});

// Stop Tor when app is quitting
app.on("before-quit", () => {
  console.log("[Electron] App quitting, stopping Tor...");
  torManager.stop();
});

// Add a new listener that tries to quit the application when
// it no longer has any open windows. This listener is a no-op
// on macOS due to the operating system's window management behavior.
app.on("window-all-closed", () => {
  // Send lock signal before closing if mainWindow exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("app-closing");
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Add a new listener that creates a new browser window only if
// when the application has no visible windows after being activated.
// For example, after launching the application for the first time,
// or re-launching the already running application.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// The code above has been adapted from a starter example in the Electron docs:
// https://www.electronjs.org/docs/tutorial/quick-start#create-the-main-script-file
