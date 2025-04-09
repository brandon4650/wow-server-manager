const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const { spawn } = require('child_process');
const robot = require('robotjs');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
    }
  }
}

// Get app data path - this is where config files will be stored
function getAppDataPath() {
  const userDataPath = app.getPath('userData');
  const appDataPath = path.join(userDataPath, 'WoWServerManager');
  ensureDirectoryExists(appDataPath);
  return appDataPath;
}

function initializeConfigFiles() {
  const appDataPath = getAppDataPath();
  
  // Ensure servers config exists
  const serversConfigPath = path.join(appDataPath, 'servers_config.json');
  if (!fs.existsSync(serversConfigPath)) {
    try {
      fs.writeFileSync(serversConfigPath, JSON.stringify({}, null, 2));
      console.log('Created default servers configuration');
    } catch (error) {
      console.error('Failed to create servers configuration:', error);
    }
  }
  
  // Ensure global config exists
  const globalConfigPath = path.join(appDataPath, 'app_config.json');
  if (!fs.existsSync(globalConfigPath)) {
    try {
      const defaultConfig = {
        theme: 'default',
        autoUpdateCheck: true,
        lastServer: '',
        lastExpansion: ''
      };
      fs.writeFileSync(globalConfigPath, JSON.stringify(defaultConfig, null, 2));
      console.log('Created default global configuration');
    } catch (error) {
      console.error('Failed to create global configuration:', error);
    }
  }
}

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
  
  console.log('Starting with URL:', startUrl);
  console.log('Checking if build exists:', fs.existsSync(path.join(__dirname, '../build/index.html')));
  
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
app.on('ready', () => {
  // Initialize app data directory and config files
  initializeConfigFiles();
  createWindow();
});

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
ipcMain.handle('launch-game', async (event, { gamePath, account, loginCoords }) => {
  try {
    console.log(`Launching game at ${gamePath} with account ${account.username}`);
    
    // Check if the game executable exists
    if (!fs.existsSync(gamePath)) {
      console.error(`Game executable not found: ${gamePath}`);
      return { success: false, error: `Game executable not found: ${gamePath}` };
    }
    
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
    
    // Wait for game to start up (adjust timing as needed)
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // If we have coordinates for auto-login
    if (loginCoords) {
      try {
        // Click username field and enter username
        robot.moveMouse(loginCoords.username_x, loginCoords.username_y);
        robot.mouseClick();
        
        // Clear any existing text (Ctrl+A, Delete)
        robot.keyTap("a", ["control"]);
        robot.keyTap("delete");
        
        // Type username with delay between keystrokes
        for (const char of account.username) {
          robot.typeString(char);
          await new Promise(r => setTimeout(r, 50));
        }
        
        // Wait briefly before moving to password field
        await new Promise(r => setTimeout(r, 500));
        
        // Click password field and enter password
        robot.moveMouse(loginCoords.password_x, loginCoords.password_y);
        robot.mouseClick();
        
        // Clear any existing text
        robot.keyTap("a", ["control"]);
        robot.keyTap("delete");
        
        // Type password with delay between keystrokes
        for (const char of account.password) {
          robot.typeString(char);
          await new Promise(r => setTimeout(r, 50));
        }
        
        // Wait briefly before pressing Enter
        await new Promise(r => setTimeout(r, 500));
        
        // Press Enter to login
        robot.keyTap("enter");
        
        console.log('Auto-login performed with coordinates:', loginCoords);
      } catch (loginError) {
        console.error('Error during auto-login:', loginError);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error launching game:', error);
    return { success: false, error: error.message };
  }
});

// Handle file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const appDataPath = getAppDataPath();
    const fullPath = path.resolve(appDataPath, filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found, will be created on write: ${filePath}`);
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    const data = fs.readFileSync(fullPath, 'utf8');
    return { success: true, data };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, data }) => {
  try {
    const appDataPath = getAppDataPath();
    const fullPath = path.resolve(appDataPath, filePath);
    
    // Ensure the directory exists
    const dirPath = path.dirname(fullPath);
    ensureDirectoryExists(dirPath);
    
    fs.writeFileSync(fullPath, data);
    console.log(`File saved: ${fullPath}`);
    return { success: true };
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

// Handle dialog operations
ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(options);
    return result;
  } catch (error) {
    console.error('Error showing open dialog:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(options);
    return result;
  } catch (error) {
    console.error('Error showing save dialog:', error);
    return { canceled: true, error: error.message };
  }
});

// Add mouse position capturing for the coordinates tool
ipcMain.handle('capture-mouse-position', async () => {
  try {
    // Use robotjs to get the current mouse position
    const mouse = robot.getMousePos();
    console.log('Mouse position captured:', mouse);
    return { x: mouse.x, y: mouse.y };
  } catch (error) {
    console.error('Error capturing mouse position:', error);
    return { x: 0, y: 0 };
  }
});