import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Button from './common/Button';
import ThemedFrame from './common/ThemedFrame';

const ServerForm = ({ serverName, onClose, onStatusUpdate }) => {
  const { addServer, updateServer, servers } = useContext(AppContext);
  const [name, setName] = useState(serverName || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Server name is required');
      return;
    }
    
    if (!serverName && servers[name]) {
      setError(`A server with name '${name}' already exists`);
      return;
    }
    
    try {
      if (serverName) {
        // Update existing server
        await updateServer(serverName, name);
        onStatusUpdate(`Server '${name}' updated`);
      } else {
        // Add new server
        await addServer(name);
        onStatusUpdate(`Server '${name}' added`);
      }
      onClose();
    } catch (error) {
      setError('Failed to save server');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <ThemedFrame 
        title={serverName ? "Edit Server" : "Add New Server"}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="serverName" className="block text-yellow-300 mb-2">Server Name:</label>
            <input
              id="serverName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
            />
            {error && <p className="text-red-400 mt-1">{error}</p>}
          </div>
          
          <div className="flex justify-center space-x-4 mt-6">
            <Button type="submit" variant="gold">Save</Button>
            <Button type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </ThemedFrame>
    </div>
  );
};

export default ServerForm;