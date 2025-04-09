import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Button from './common/Button';
import ThemedFrame from './common/ThemedFrame';

// Common WoW expansions with their version numbers
const COMMON_EXPANSIONS = [
  { name: "Classic", version: "1.12.1" },
  { name: "The Burning Crusade (TBC)", version: "2.4.3" },
  { name: "Wrath of the Lich King (WotLK)", version: "3.3.5a" },
  { name: "Cataclysm", version: "4.3.4" },
  { name: "Mists of Pandaria (MoP)", version: "5.4.8" },
  { name: "Warlords of Draenor (WoD)", version: "6.2.4" },
  { name: "Legion", version: "7.3.5" },
  { name: "Battle for Azeroth (BfA)", version: "8.3.7" },
  { name: "Shadowlands", version: "9.2.7" },
  { name: "Dragonflight", version: "10.0.5" },
  { name: "Custom", version: "" }
];

const ExpansionForm = ({ serverName, expansionName, onClose, onStatusUpdate }) => {
  const { servers, addExpansion, updateExpansion } = useContext(AppContext);
  
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    accountsFile: '',
    coordsFile: ''
  });
  
  const [selectedExpansion, setSelectedExpansion] = useState('Custom');
  const [error, setError] = useState('');
  const [isCustom, setIsCustom] = useState(true);

  // Load existing data if editing
  useEffect(() => {
    if (serverName && expansionName && servers[serverName]?.expansions[expansionName]) {
      const expData = servers[serverName].expansions[expansionName];
      setFormData({
        name: expansionName,
        path: expData.path || '',
        accountsFile: expData.accounts_file || '',
        coordsFile: expData.coords_file || ''
      });
      
      // Try to match with common expansions
      const matchedExpansion = COMMON_EXPANSIONS.find(exp => 
        expansionName.includes(exp.name) || expansionName.includes(exp.version)
      );
      
      if (matchedExpansion) {
        setSelectedExpansion(`${matchedExpansion.name} ${matchedExpansion.version}`);
        setIsCustom(false);
      } else {
        setSelectedExpansion('Custom');
        setIsCustom(true);
      }
    } else if (serverName) {
      // Generate default filenames for new expansion
      const serverPart = serverName.toLowerCase().replace(/\s+/g, '_');
      setFormData({
        name: '',
        path: '',
        accountsFile: `accounts_${serverPart}_new.json`,
        coordsFile: `login_coords_${serverPart}_new.json`
      });
      
      // Default to Custom for new expansions
      setSelectedExpansion('Custom');
      setIsCustom(true);
    }
  }, [serverName, expansionName, servers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExpansionSelect = (e) => {
    const selected = e.target.value;
    setSelectedExpansion(selected);
    
    if (selected === 'Custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      
      // Parse the selected value to get name and version
      const expansionInfo = COMMON_EXPANSIONS.find(
        exp => `${exp.name} ${exp.version}` === selected
      );
      
      if (expansionInfo) {
        // Update the expansion name field
        setFormData(prev => ({
          ...prev,
          name: selected
        }));
        
        // Also update file names
        const serverPart = serverName.toLowerCase().replace(/\s+/g, '_');
        const expansionPart = expansionInfo.name.split(' ')[0].toLowerCase();
        
        setFormData(prev => ({
          ...prev,
          accountsFile: `accounts_${serverPart}_${expansionPart}.json`,
          coordsFile: `login_coords_${serverPart}_${expansionPart}.json`
        }));
      }
    }
  };

  const handleBrowseFile = async () => {
    if (window.electron) {
      try {
        const result = await window.electron.showOpenDialog({
          title: 'Select Game Executable',
          filters: [
            { name: 'Executable Files', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });
        
        if (!result.canceled && result.filePaths && result.filePaths[0]) {
          setFormData(prev => ({ ...prev, path: result.filePaths[0] }));
        }
      } catch (error) {
        console.error('Error selecting file:', error);
      }
    } else {
      // For web version use normal file input
      // But in Electron, don't use prompt as it's not supported
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.exe';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          setFormData(prev => ({ ...prev, path: file.path || file.name }));
        }
      };
      
      input.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Expansion name is required');
      return;
    }
    
    if (!expansionName && servers[serverName]?.expansions[formData.name]) {
      setError(`An expansion with name '${formData.name}' already exists for this server`);
      return;
    }
    
    try {
      const expansionData = {
        path: formData.path,
        accounts_file: formData.accountsFile,
        coords_file: formData.coordsFile
      };
      
      if (expansionName) {
        // Update existing expansion
        await updateExpansion(serverName, expansionName, formData.name, expansionData);
        onStatusUpdate(`Expansion '${formData.name}' updated for server '${serverName}'`);
      } else {
        // Add new expansion
        await addExpansion(serverName, formData.name, expansionData);
        onStatusUpdate(`Expansion '${formData.name}' added to server '${serverName}'`);
      }
      onClose();
    } catch (error) {
      setError('Failed to save expansion');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <ThemedFrame 
        title={expansionName ? "Edit Expansion" : `Add Expansion for ${serverName}`}
        className="w-full max-w-lg"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-yellow-300 mb-2">Server:</label>
            <div className="bg-gray-800 border border-gray-600 rounded p-2 text-yellow-400">
              {serverName}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="expansionSelect" className="block text-yellow-300 mb-2">
              Select Expansion:
            </label>
            <select
              id="expansionSelect"
              value={selectedExpansion}
              onChange={handleExpansionSelect}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
              disabled={!!expansionName}
            >
              {COMMON_EXPANSIONS.map((exp, index) => (
                <option key={index} value={exp.name !== "Custom" ? `${exp.name} ${exp.version}` : "Custom"}>
                  {exp.name !== "Custom" ? `${exp.name} (${exp.version})` : "Custom Expansion"}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-yellow-300 mb-2">
              Expansion Name:
              {isCustom && <span className="text-gray-400 text-sm ml-2">(Custom name)</span>}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={!!expansionName}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white disabled:opacity-70"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="path" className="block text-yellow-300 mb-2">Executable Path:</label>
            <div className="flex">
              <input
                id="path"
                name="path"
                type="text"
                value={formData.path}
                onChange={handleChange}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-l p-2 text-white"
              />
              <Button 
                type="button" 
                onClick={handleBrowseFile}
                className="rounded-l-none"
              >
                Browse
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="accountsFile" className="block text-yellow-300 mb-2">Accounts File:</label>
            <input
              id="accountsFile"
              name="accountsFile"
              type="text"
              value={formData.accountsFile}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="coordsFile" className="block text-yellow-300 mb-2">Coordinates File:</label>
            <input
              id="coordsFile"
              name="coordsFile"
              type="text"
              value={formData.coordsFile}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
            />
          </div>
          
          {error && <p className="text-red-400 mt-1 mb-4">{error}</p>}
          
          <div className="flex justify-center space-x-4 mt-6">
            <Button type="submit" variant="gold">Save</Button>
            <Button type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </ThemedFrame>
    </div>
  );
};

export default ExpansionForm;