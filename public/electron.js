const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { spawn } = require('child_process');

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  const preloadPath = app.isPackaged
    ? path.join(__dirname, 'preload.js')  // For production
    : path.join(__dirname, '../public/preload.js');  // For development

mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    },
    icon: path.join(__dirname, 'favicon.ico')
});
  // Load the index.html from a url
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  console.log('Starting with URL:', startUrl);  // Add this for debugging
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle game launching
ipcMain.handle('launch-game', async (event, { gamePath, account }) => {
  try {
    console.log(`Launching game at ${gamePath} with account ${account.username}`);
    
    // Launch the game process
    const gameProcess = spawn(gamePath, [], {
      detached: true
    });
    
    // Setup error handling
    gameProcess.on('error', (err) => {
      console.error('Failed to start game process:', err);
      return { success: false, error: err.message };
    });
    
    // Detach process
    gameProcess.unref();
    
    return { success: true };
  } catch (error) {
    console.error('Error launching game:', error);
    return { success: false, error: error.message };
  }
});

// Handle file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle dialog operations
ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(options);
  return result;
});