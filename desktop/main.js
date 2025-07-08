const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
let tray;

// Start the MCP server
function startServer() {
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '10000' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show MCP Desktop',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Server Status',
      enabled: false,
      id: 'status'
    },
    { type: 'separator' },
    {
      label: 'Open in Browser',
      click: () => {
        require('electron').shell.openExternal('http://localhost:10000/health');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('MCP Server - Running');
  tray.setContextMenu(contextMenu);
  
  // Update status
  setInterval(() => {
    const statusItem = contextMenu.getMenuItemById('status');
    if (serverProcess && !serverProcess.killed) {
      statusItem.label = 'Server Status: Running';
      tray.setToolTip('MCP Server - Running');
    } else {
      statusItem.label = 'Server Status: Stopped';
      tray.setToolTip('MCP Server - Stopped');
    }
    tray.setContextMenu(contextMenu);
  }, 5000);
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// IPC handlers
ipcMain.handle('get-server-status', () => {
  return {
    running: serverProcess && !serverProcess.killed,
    url: 'http://localhost:10000'
  };
});