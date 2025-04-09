import React, { createContext, useState, useEffect } from 'react';
import { loadServers, saveServers, loadGlobalConfig, saveGlobalConfig } from '../utils/configUtils';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [servers, setServers] = useState({});
  const [globalConfig, setGlobalConfig] = useState({
    theme: 'default',
    autoUpdateCheck: true,
    lastServer: '',
    lastExpansion: ''
  });
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const loadedServers = await loadServers();
        const loadedConfig = await loadGlobalConfig();
        
        setServers(loadedServers);
        setGlobalConfig(loadedConfig);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []);

  // Context value and methods
  const updateServers = async (newServers) => {
    setServers(newServers);
    await saveServers(newServers);
  };

  const updateGlobalConfig = async (newConfig) => {
    setGlobalConfig({...globalConfig, ...newConfig});
    await saveGlobalConfig({...globalConfig, ...newConfig});
  };

  const addServer = async (serverName) => {
    const updatedServers = {...servers};
    updatedServers[serverName] = { expansions: {} };
    await updateServers(updatedServers);
    return true;
  };

  const updateServer = async (oldName, newName) => {
    if (oldName === newName) return true;
    
    const updatedServers = {...servers};
    updatedServers[newName] = updatedServers[oldName];
    delete updatedServers[oldName];
    await updateServers(updatedServers);
    return true;
  };

  const removeServer = async (serverName) => {
    const updatedServers = {...servers};
    delete updatedServers[serverName];
    await updateServers(updatedServers);
    return true;
  };

  const addExpansion = async (serverName, expansionName, expansionData) => {
    if (!servers[serverName]) return false;
    
    const updatedServers = {...servers};
    if (!updatedServers[serverName].expansions) {
      updatedServers[serverName].expansions = {};
    }
    
    updatedServers[serverName].expansions[expansionName] = expansionData;
    await updateServers(updatedServers);
    return true;
  };

  const updateExpansion = async (serverName, oldExpName, newExpName, expansionData) => {
    if (!servers[serverName]) return false;
    
    const updatedServers = {...servers};
    
    if (oldExpName !== newExpName) {
      // Rename expansion
      updatedServers[serverName].expansions[newExpName] = {
        ...updatedServers[serverName].expansions[oldExpName],
        ...expansionData
      };
      delete updatedServers[serverName].expansions[oldExpName];
    } else {
      // Just update data
      updatedServers[serverName].expansions[newExpName] = {
        ...updatedServers[serverName].expansions[newExpName],
        ...expansionData
      };
    }
    
    await updateServers(updatedServers);
    return true;
  };

  const removeExpansion = async (serverName, expansionName) => {
    if (!servers[serverName] || !servers[serverName].expansions[expansionName]) return false;
    
    const updatedServers = {...servers};
    delete updatedServers[serverName].expansions[expansionName];
    await updateServers(updatedServers);
    return true;
  };

  const updateLastUsed = async (serverName, expansionName) => {
    await updateGlobalConfig({
      lastServer: serverName,
      lastExpansion: expansionName
    });
  };

  const contextValue = {
    servers,
    globalConfig,
    loading,
    updateServers,
    updateGlobalConfig,
    addServer,
    updateServer,
    removeServer,
    addExpansion,
    updateExpansion,
    removeExpansion,
    updateLastUsed
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};