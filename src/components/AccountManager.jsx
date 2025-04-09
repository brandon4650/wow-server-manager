import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Button from './common/Button';
import ThemedFrame from './common/ThemedFrame';
import StatusBar from './common/StatusBar';
import ConfirmDialog from './common/ConfirmDialog';
import CoordinatesTool from './CoordinatesTool';
import {
  loadAccounts,
  saveAccounts,
  loadCoordinates,
  importAccounts,
  exportAccounts
} from '../utils/configUtils';

const AccountManager = () => {
  const { serverName, expansionName } = useParams();
  const navigate = useNavigate();
  const { servers } = useContext(AppContext);
  
  const [accountsData, setAccountsData] = useState({ accounts: [] });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    alias: ''
  });
  
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [showCoordinatesTool, setShowCoordinatesTool] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get expansion data from context
  const expansionData = servers[serverName]?.expansions[expansionName] || null;
  
  // Load accounts data
  useEffect(() => {
    const loadData = async () => {
      if (expansionData) {
        try {
          const accountsFile = expansionData.accounts_file;
          const accounts = await loadAccounts(accountsFile);
          setAccountsData(accounts);
          setStatusMessage(`Loaded accounts for ${serverName} - ${expansionName}`);
        } catch (error) {
          console.error('Failed to load accounts:', error);
          setStatusMessage('Failed to load accounts');
        } finally {
          setLoading(false);
        }
      } else {
        setStatusMessage('Server or expansion not found');
        setLoading(false);
      }
    };
    
    loadData();
  }, [serverName, expansionName, expansionData]);

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setFormData({
      username: account.username || '',
      password: account.password || '',
      alias: account.alias || ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setSelectedAccount(null);
    setFormData({
      username: '',
      password: '',
      alias: ''
    });
  };

  const handleAddUpdate = async () => {
    if (!formData.username || !formData.password) {
      setStatusMessage('Username and password are required');
      return;
    }
    
    try {
      const updatedAccounts = {...accountsData};
      if (!updatedAccounts.accounts) {
        updatedAccounts.accounts = [];
      }
      
      const accountData = {
        username: formData.username,
        password: formData.password,
        alias: formData.alias,
        server: serverName,
        expansion: expansionName
      };
      
      // Check if account exists
      const existingIndex = updatedAccounts.accounts.findIndex(
        acc => acc.username === formData.username
      );
      
      if (existingIndex >= 0) {
        // Update existing
        updatedAccounts.accounts[existingIndex] = accountData;
      } else {
        // Add new
        updatedAccounts.accounts.push(accountData);
      }
      
      await saveAccounts(updatedAccounts, expansionData.accounts_file);
      setAccountsData(updatedAccounts);
      clearForm();
      
      const displayName = formData.alias || formData.username;
      setStatusMessage(`Account '${displayName}' saved`);
    } catch (error) {
      console.error('Failed to save account:', error);
      setStatusMessage('Failed to save account');
    }
  };

  const handleDelete = () => {
    if (!selectedAccount) {
      setStatusMessage('No account selected');
      return;
    }
    
    setShowConfirmDialog({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete account '${selectedAccount.alias || selectedAccount.username}'?`,
      onConfirm: async () => {
        try {
          const updatedAccounts = {...accountsData};
          updatedAccounts.accounts = updatedAccounts.accounts.filter(
            acc => acc.username !== selectedAccount.username
          );
          
          await saveAccounts(updatedAccounts, expansionData.accounts_file);
          setAccountsData(updatedAccounts);
          clearForm();
          
          const displayName = selectedAccount.alias || selectedAccount.username;
          setStatusMessage(`Account '${displayName}' deleted`);
        } catch (error) {
          console.error('Failed to delete account:', error);
          setStatusMessage('Failed to delete account');
        }
      }
    });
  };

  const handleLaunchGame = async () => {
    if (!selectedAccount) {
      setStatusMessage('No account selected');
      return;
    }
    
    if (!expansionData?.path) {
      setStatusMessage('Game path not configured');
      return;
    }
    
    setStatusMessage(`Launching game with account '${selectedAccount.alias || selectedAccount.username}'...`);
    
    if (window.electron) {
      try {
        const result = await window.electron.launchGame({
          gamePath: expansionData.path,
          account: selectedAccount
        });
        
        if (result.success) {
          setStatusMessage(`Game launched with account '${selectedAccount.alias || selectedAccount.username}'`);
        } else {
          setStatusMessage(`Failed to launch game: ${result.error}`);
        }
      } catch (error) {
        console.error('Error launching game:', error);
        setStatusMessage(`Error launching game: ${error.message}`);
      }
    } else {
      // Fallback for web version
      alert(`Would launch game for ${serverName} - ${expansionName} with account ${selectedAccount.username}`);
    }
  };

  const handleImportAccounts = async () => {
    try {
      // In a real app, we'd use file input
      // For this demo, let's simulate it
      const result = await importAccounts();
      if (result) {
        setAccountsData(result);
        setStatusMessage(`Imported ${result.accounts.length} accounts`);
      }
    } catch (error) {
      console.error('Failed to import accounts:', error);
      setStatusMessage('Failed to import accounts');
    }
  };

  const handleExportAccounts = async () => {
    try {
      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        setStatusMessage('No accounts to export');
        return;
      }
      
      await exportAccounts(accountsData);
      setStatusMessage(`Exported ${accountsData.accounts.length} accounts`);
    } catch (error) {
      console.error('Failed to export accounts:', error);
      setStatusMessage('Failed to export accounts');
    }
  };

  const handleOpenCoordinatesTool = () => {
    setShowCoordinatesTool(true);
  };

  const handleChangeGamePath = () => {
    // In a real app, we'd use a file dialog
    // For this demo, we'll use a prompt
    const newPath = window.prompt('Enter new game path:', expansionData?.path || '');
    if (newPath) {
      // This would update the path in the server config
      alert(`Would update game path to: ${newPath}`);
      setStatusMessage('Game path updated');
    }
  };

  if (loading) {
    return <div className="loading">Loading account data...</div>;
  }

  if (!expansionData) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl text-red-400 mb-4">Server or expansion not found</h2>
        <Button onClick={() => navigate('/')}>Return to Server List</Button>
      </div>
    );
  }

  return (
    <div className="wow-bg min-h-screen text-white">
      <header className="p-4 bg-gray-900 bg-opacity-80">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">
          {serverName} - {expansionName} Account Manager
        </h1>
        
        <div className="flex justify-center mt-4 space-x-4">
          <Button onClick={() => navigate('/')} variant="secondary">
            Return to Server List
          </Button>
          
          <div className="relative group">
            <Button>Tools</Button>
            <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10">
              <button 
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={handleOpenCoordinatesTool}
              >
                Configure Login Screen
              </button>
              <button 
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={handleChangeGamePath}
              >
                Change Game Path
              </button>
              <button 
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={handleImportAccounts}
              >
                Import Accounts
              </button>
              <button 
                className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                onClick={handleExportAccounts}
              >
                Export Accounts
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Account Selection Section */}
        <ThemedFrame title="Select Account" className="mb-6">
          <div className="p-4 flex items-center space-x-4">
            <select
              className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white"
              value={selectedAccount ? (selectedAccount.alias || selectedAccount.username) : ''}
              onChange={(e) => {
                const selectedName = e.target.value;
                const account = accountsData.accounts.find(
                  acc => (acc.alias || acc.username) === selectedName
                );
                if (account) {
                  handleAccountSelect(account);
                }
              }}
            >
              <option value="">Select an account</option>
              {accountsData.accounts.map((account, index) => (
                <option key={index} value={account.alias || account.username}>
                  {account.alias || account.username}
                </option>
              ))}
            </select>
            
            <Button 
              variant="gold"
              onClick={handleLaunchGame}
              disabled={!selectedAccount}
            >
              Launch
            </Button>
          </div>
        </ThemedFrame>
        
        {/* Account Management Section */}
        <ThemedFrame title="Manage Accounts">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-yellow-300 mb-2">Username:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-yellow-300 mb-2">Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-yellow-300 mb-2">Account Alias:</label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 mb-6">
              <Button variant="gold" onClick={handleAddUpdate}>
                Add/Update Account
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                disabled={!selectedAccount}
              >
                Delete Account
              </Button>
              <Button onClick={clearForm}>
                Clear Fields
              </Button>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-yellow-300 mb-4">All Accounts:</h3>
              
              {accountsData.accounts.length === 0 ? (
                <div className="text-center p-4 text-gray-400">
                  <p>No accounts configured for this server.</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="text-left p-3 text-yellow-300">Username</th>
                        <th className="text-left p-3 text-yellow-300">Alias</th>
                        <th className="p-3 text-yellow-300 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountsData.accounts.map((account, index) => (
                        <tr 
                          key={index} 
                          className={`
                            border-t border-gray-700 hover:bg-gray-700 cursor-pointer
                            ${selectedAccount?.username === account.username ? 'bg-gray-700' : ''}
                          `}
                          onClick={() => handleAccountSelect(account)}
                        >
                          <td className="p-3">{account.username}</td>
                          <td className="p-3">{account.alias || '-'}</td>
                          <td className="p-3 text-center">
                            <button 
                              className="text-red-400 hover:text-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccountSelect(account);
                                handleDelete();
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </ThemedFrame>
      </main>

      <StatusBar message={statusMessage} />

      {/* Dialogs */}
      {showConfirmDialog && (
        <ConfirmDialog
          title={showConfirmDialog.title}
          message={showConfirmDialog.message}
          onResult={(confirmed) => {
            if (confirmed && showConfirmDialog.onConfirm) {
              showConfirmDialog.onConfirm();
            }
            setShowConfirmDialog(null);
          }}
        />
      )}

      {showCoordinatesTool && (
        <CoordinatesTool
          coordsFile={expansionData.coords_file}
          onClose={() => setShowCoordinatesTool(false)}
          onSave={() => setStatusMessage('Login screen coordinates saved')}
        />
      )}
    </div>
  );
};

export default AccountManager;