import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Button from './common/Button';
import StatusBar from './common/StatusBar';
import ThemedFrame from './common/ThemedFrame';
import ServerForm from './ServerForm';
import ExpansionForm from './ExpansionForm';
import AboutDialog from './common/AboutDialog';
import ConfirmDialog from './common/ConfirmDialog';

const ServerGrid = () => {
  const navigate = useNavigate();
  const { servers, loading, removeServer, removeExpansion, updateLastUsed } = useContext(AppContext);
  const [selectedServer, setSelectedServer] = useState(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [showExpansionForm, setShowExpansionForm] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [editingExpansion, setEditingExpansion] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready');

  const handleServerClick = (serverName) => {
    if (selectedServer === serverName) {
      setSelectedServer(null);
    } else {
      setSelectedServer(serverName);
    }
  };

  const handleAddServer = () => {
    setEditingServer(null);
    setShowServerForm(true);
  };

  const handleEditServer = (serverName) => {
    setEditingServer(serverName);
    setShowServerForm(true);
  };

  const handleAddExpansion = (serverName) => {
    setEditingServer(serverName);
    setEditingExpansion(null);
    setShowExpansionForm(true);
  };

  const handleEditExpansion = (serverName, expansionName) => {
    setEditingServer(serverName);
    setEditingExpansion(expansionName);
    setShowExpansionForm(true);
  };

  const handleRemoveServer = (serverName) => {
    setConfirmAction(() => async () => {
      await removeServer(serverName);
      setStatusMessage(`Server '${serverName}' removed`);
      setSelectedServer(null);
    });
    setShowConfirm({
      title: 'Confirm Remove',
      message: `Are you sure you want to remove the server '${serverName}' and all its expansions?`
    });
  };

  const handleRemoveExpansion = (serverName, expansionName) => {
    setConfirmAction(() => async () => {
      await removeExpansion(serverName, expansionName);
      setStatusMessage(`Expansion '${expansionName}' removed from server '${serverName}'`);
    });
    setShowConfirm({
      title: 'Confirm Remove',
      message: `Are you sure you want to remove the expansion '${expansionName}' from server '${serverName}'?`
    });
  };

  const handleConfirmDialogResult = async (confirmed) => {
    if (confirmed && confirmAction) {
      await confirmAction();
    }
    setShowConfirm(false);
    setConfirmAction(null);
  };

  const handleConnectToExpansion = async (serverName, expansionName, gamePath) => {
    if (!gamePath) {
      setStatusMessage(`Game path not set for ${expansionName}`);
      return;
    }
    
    // Update last used server/expansion
    await updateLastUsed(serverName, expansionName);
    
    // Navigate to account manager
    navigate(`/server/${serverName}/expansion/${expansionName}`);
  };

  if (loading) {
    return <div className="loading">Loading server data...</div>;
  }

  return (
    <div className="wow-bg min-h-screen text-white">
      <header className="p-4 bg-gray-900 bg-opacity-80">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">WoW Private Server Manager</h1>
        
        <div className="flex justify-center mt-4 space-x-4">
          <Button onClick={handleAddServer} variant="primary">Add Server</Button>
          <Button onClick={() => setShowAbout(true)}>About</Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <ThemedFrame title="Available Servers">
          {Object.keys(servers).length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              <p>No servers configured.</p>
              <p>Click "Add Server" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              {Object.entries(servers).map(([serverName, serverData]) => (
                <div key={serverName} className="relative">
                  <div 
                    className={`
                      cursor-pointer rounded-lg p-6 transition-all duration-300
                      ${selectedServer === serverName 
                        ? 'bg-gray-700 border-2 border-yellow-500' 
                        : 'bg-gray-800 border-2 border-gray-600 hover:border-yellow-400'}
                    `}
                    onClick={() => handleServerClick(serverName)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-yellow-300">{serverName}</h2>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditServer(serverName); }}
                          className="text-gray-400 hover:text-yellow-400"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveServer(serverName); }}
                          className="text-gray-400 hover:text-red-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        {Object.keys(serverData.expansions || {}).length} 
                        {Object.keys(serverData.expansions || {}).length === 1 ? ' expansion' : ' expansions'}
                      </span>
                      <span className="text-yellow-400">
                        {selectedServer === serverName ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {selectedServer === serverName && (
                    <div className="mt-1 rounded-b-lg bg-gray-700 border-2 border-t-0 border-yellow-500 p-4 shadow-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-yellow-300">Available Expansions:</h3>
                        <Button 
                          size="small"
                          onClick={() => handleAddExpansion(serverName)}
                        >
                          Add Expansion
                        </Button>
                      </div>
                      
                      {Object.keys(serverData.expansions || {}).length === 0 ? (
                        <div className="text-center p-4 text-gray-400">
                          <p>No expansions configured for this server.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(serverData.expansions || {}).map(([expName, expData]) => (
                            <div key={expName} className="flex items-center justify-between bg-gray-800 rounded p-3 hover:bg-gray-600">
                              <div>
                                <span className="font-medium">{expName}</span>
                                <div className="text-xs text-gray-400 mt-1 truncate" title={expData.path || "Path not set"}>
                                  {expData.path || "Game path not configured"}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleEditExpansion(serverName, expName)}
                                  className="text-gray-400 hover:text-yellow-400"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleRemoveExpansion(serverName, expName)}
                                  className="text-gray-400 hover:text-red-400"
                                >
                                  🗑️
                                </button>
                                <Button 
                                  variant="gold"
                                  size="small"
                                  onClick={() => handleConnectToExpansion(serverName, expName, expData.path)}
                                  disabled={!expData.path}
                                >
                                  Connect
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ThemedFrame>
      </main>

      <StatusBar message={statusMessage} />

      {/* Dialogs */}
      {showServerForm && (
        <ServerForm 
          serverName={editingServer}
          onClose={() => setShowServerForm(false)}
          onStatusUpdate={setStatusMessage}
        />
      )}

      {showExpansionForm && (
        <ExpansionForm
          serverName={editingServer}
          expansionName={editingExpansion}
          onClose={() => setShowExpansionForm(false)}
          onStatusUpdate={setStatusMessage}
        />
      )}

      {showAbout && (
        <AboutDialog
          title="WoW Private Server Manager"
          version="1.0"
          description="A tool for managing multiple WoW private servers and accounts."
          onClose={() => setShowAbout(false)}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title={showConfirm.title}
          message={showConfirm.message}
          onResult={handleConfirmDialogResult}
        />
      )}
    </div>
  );
};

export default ServerGrid;