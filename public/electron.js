const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const settings = require("electron-settings");
const getNativeModule = require("../src/native-loader");

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
          label: "&Rescan",
          click: () => {
            mainWindow.webContents.send("rescan");
          },
        },
        {
          label: "View Lightwalletd Info",
          click: () => {
            this.mainWindow.webContents.send("zcashd");
          },
        },
        { type: "separator" },
        {
          label: "Remove Wallet Encryption",
          click: () => {
            this.mainWindow.webContents.send("decrypt");
          },
        },
        {
          label: "Unlock",
          click: () => {
            this.mainWindow.webContents.send("unlock");
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
          label: "&Rescan",
          click: () => {
            mainWindow.webContents.send("rescan");
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
        { type: "separator" },
        {
          label: "Remove Wallet Encryption",
          click: () => {
            this.mainWindow.webContents.send("decrypt");
          },
        },
        {
          label: "Unlock",
          click: () => {
            this.mainWindow.webContents.send("unlock");
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
            label: "&Rescan",
            click: () => {
              mainWindow.webContents.send("rescan");
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
          { type: "separator" },
          {
            label: "Remove Wallet Encryption",
            click: () => {
              this.mainWindow.webContents.send("decrypt");
            },
          },
          {
            label: "Unlock",
            click: () => {
              this.mainWindow.webContents.send("unlock");
            },
          },
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

function createWindow() {
  console.log(`Creating window - isDev: ${isDev}, platform: ${process.platform}`);
  console.log(`__dirname: ${__dirname}`);
  console.log(`process.resourcesPath: ${process.resourcesPath}`);
  
  const mainWindow = new BrowserWindow({
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

  // Load from localhost if in development
  // Otherwise load index.html file
  const indexPath = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "index.html")}`;
  console.log(`Loading from: ${indexPath}`);
  
  // Show window when ready (fixes Linux visibility issue)
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
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

  mainWindow.on("close", (event) => {
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

  // Open DevTools if in dev mode or on Windows for debugging
  if (isDev || process.platform === 'win32') {
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

// Create a new browser window by invoking the createWindow
// function once the Electron application is initialized.
// Install REACT_DEVELOPER_TOOLS as well if isDev
app.whenReady().then(() => {
  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((error) => console.log(`An error occurred: , ${error}`));
  }

  createWindow();
});

// Add a new listener that tries to quit the application when
// it no longer has any open windows. This listener is a no-op
// on macOS due to the operating system's window management behavior.
app.on("window-all-closed", () => {
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
