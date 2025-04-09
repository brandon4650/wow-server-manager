// Configuration file paths
const CONFIG_PATHS = {
  SERVERS: 'servers_config.json',
  GLOBAL_CONFIG: 'app_config.json',
  ACCOUNTS_PREFIX: 'accounts_',
  COORDS_PREFIX: 'login_coords_'
};

// Helper to read a file
const readFile = async (filePath) => {
  const result = await window.electron.readFile(filePath);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

// Helper to write a file
const writeFile = async (filePath, data) => {
  const result = await window.electron.writeFile(filePath, data);
  if (!result.success) {
    throw new Error(result.error);
  }
};

// Load servers configuration
export const loadServers = async () => {
  try {
    const data = await readFile(CONFIG_PATHS.SERVERS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Creating new servers configuration file');
    // Create default empty configuration
    const defaultServers = {};
    await saveServers(defaultServers);
    return defaultServers;
  }
  
  // Default empty configuration
  return {};
};

// Save servers configuration
export const saveServers = async (servers) => {
  try {
    await writeFile(CONFIG_PATHS.SERVERS, JSON.stringify(servers, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save servers:', error);
    return false;
  }
};

// Load global application configuration
export const loadGlobalConfig = async () => {
  try {
    const data = await readFile(CONFIG_PATHS.GLOBAL_CONFIG);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Creating new global configuration file');
    // Create default configuration
    const defaultConfig = {
      theme: 'default',
      autoUpdateCheck: true,
      lastServer: '',
      lastExpansion: ''
    };
    await saveGlobalConfig(defaultConfig);
    return defaultConfig;
  }
  
  // Default configuration
  return {
    theme: 'default',
    autoUpdateCheck: true,
    lastServer: '',
    lastExpansion: ''
  };
};

// Save global application configuration
export const saveGlobalConfig = async (config) => {
  try {
    await writeFile(CONFIG_PATHS.GLOBAL_CONFIG, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save global config:', error);
    return false;
  }
};

// Load accounts for a specific server/expansion
export const loadAccounts = async (accountsFile) => {
  try {
    const fileName = `${CONFIG_PATHS.ACCOUNTS_PREFIX}${accountsFile}`;
    const data = await readFile(fileName);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Default empty accounts
    return { accounts: [] };
  } catch (error) {
    console.error(`Failed to load accounts from ${accountsFile}:`, error);
    return { accounts: [] };
  }
};

// Save accounts for a specific server/expansion
export const saveAccounts = async (accountsData, accountsFile) => {
  try {
    const fileName = `${CONFIG_PATHS.ACCOUNTS_PREFIX}${accountsFile}`;
    await writeFile(fileName, JSON.stringify(accountsData, null, 2));
    return true;
  } catch (error) {
    console.error(`Failed to save accounts to ${accountsFile}:`, error);
    return false;
  }
};

// Load login screen coordinates
export const loadCoordinates = async (coordsFile) => {
  try {
    const fileName = `${CONFIG_PATHS.COORDS_PREFIX}${coordsFile}`;
    const data = await readFile(fileName);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Default coordinates
    return {
      username_x: 1692,
      username_y: 737,
      password_x: 1734,
      password_y: 854
    };
  } catch (error) {
    console.error(`Failed to load coordinates from ${coordsFile}:`, error);
    return {
      username_x: 1692,
      username_y: 737,
      password_x: 1734,
      password_y: 854
    };
  }
};

// Save login screen coordinates
export const saveCoordinates = async (coordsData, coordsFile) => {
  try {
    const fileName = `${CONFIG_PATHS.COORDS_PREFIX}${coordsFile}`;
    await writeFile(fileName, JSON.stringify(coordsData, null, 2));
    return true;
  } catch (error) {
    console.error(`Failed to save coordinates to ${coordsFile}:`, error);
    return false;
  }
};

// Import accounts
export const importAccounts = async () => {
  try {
    const result = await window.electron.showOpenDialog({
      title: 'Import Accounts',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || !result.filePaths || !result.filePaths[0]) {
      return null;
    }
    
    const filePath = result.filePaths[0];
    const fileData = await window.electron.readFile(filePath);
    
    if (fileData.success) {
      return JSON.parse(fileData.data);
    } else {
      throw new Error(fileData.error);
    }
  } catch (error) {
    console.error('Failed to import accounts:', error);
    return null;
  }
};

// Export accounts
export const exportAccounts = async (accountsData) => {
  try {
    const result = await window.electron.showSaveDialog({
      title: 'Export Accounts',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'accounts.json'
    });
    
    if (result.canceled || !result.filePath) {
      return false;
    }
    
    const filePath = result.filePath;
    const writeResult = await window.electron.writeFile(
      filePath, 
      JSON.stringify(accountsData, null, 2)
    );
    
    return writeResult.success;
  } catch (error) {
    console.error('Failed to export accounts:', error);
    return false;
  }
};