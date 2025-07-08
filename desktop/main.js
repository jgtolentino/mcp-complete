const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

// Load environment variables
if (fs.existsSync(path.join(__dirname, '.env'))) {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
}

let mainWindow;
let serverProcess;
let tray;

// Configuration from environment
const SERVER_PORT = process.env.MCP_PORT || 10000;
const SERVER_HOST = process.env.MCP_HOST || 'localhost';
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000');
const START_MINIMIZED = process.env.START_MINIMIZED === 'true';
const ENABLE_AUTO_UPDATE = process.env.ENABLE_AUTO_UPDATE !== 'false';
const WINDOW_WIDTH = parseInt(process.env.WINDOW_WIDTH || '1200');
const WINDOW_HEIGHT = parseInt(process.env.WINDOW_HEIGHT || '800');

// Start the MCP server
function startServer() {
  const serverPath = path.join(__dirname, '..', 'src', 'server.js');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: SERVER_PORT.toString() },
    cwd: path.join(__dirname, '..')
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('server-log', data.toString());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('server-error', data.toString());
    }
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    // Restart server after 5 seconds if it crashes
    if (code !== 0) {
      setTimeout(startServer, 5000);
    }
  });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: !START_MINIMIZED,
    title: 'MCP Desktop Server'
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
        shell.openExternal(`${SERVER_URL}/health`);
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
  
  // Update status with health check
  const updateStatus = async () => {
    const statusItem = contextMenu.getMenuItemById('status');
    
    // Check if server is actually responding
    const isHealthy = await checkServerHealth();
    
    if (serverProcess && !serverProcess.killed && isHealthy) {
      statusItem.label = 'Server Status: Running ✅';
      tray.setToolTip('MCP Server - Running');
    } else if (serverProcess && !serverProcess.killed) {
      statusItem.label = 'Server Status: Starting... ⏳';
      tray.setToolTip('MCP Server - Starting');
    } else {
      statusItem.label = 'Server Status: Stopped ❌';
      tray.setToolTip('MCP Server - Stopped');
    }
    tray.setContextMenu(contextMenu);
  };
  
  updateStatus();
  setInterval(updateStatus, HEALTH_CHECK_INTERVAL);
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

// Health check function
async function checkServerHealth() {
  return new Promise((resolve) => {
    http.get(`${SERVER_URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// IPC handlers
ipcMain.handle('get-server-status', async () => {
  const isHealthy = await checkServerHealth();
  return {
    running: serverProcess && !serverProcess.killed && isHealthy,
    url: SERVER_URL,
    port: SERVER_PORT,
    healthy: isHealthy
  };
});

ipcMain.handle('restart-server', () => {
  if (serverProcess) {
    serverProcess.kill();
    setTimeout(startServer, 1000);
  }
});