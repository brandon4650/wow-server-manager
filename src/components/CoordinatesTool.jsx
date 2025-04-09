import React, { useState, useEffect } from 'react';
import Button from './common/Button';
import ThemedFrame from './common/ThemedFrame';
import { loadCoordinates, saveCoordinates } from '../utils/configUtils';

const CoordinatesTool = ({ coordsFile, onClose, onSave }) => {
  const [coordinates, setCoordinates] = useState({
    username: { x: 1692, y: 737, desc: "Username Field" },
    password: { x: 1734, y: 854, desc: "Password Field" }
  });
  
  const [active, setActive] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Load existing coordinates
  useEffect(() => {
    const loadData = async () => {
      try {
        const coords = await loadCoordinates(coordsFile);
        if (coords) {
          setCoordinates({
            username: { 
              x: coords.username_x || 1692, 
              y: coords.username_y || 737, 
              desc: "Username Field" 
            },
            password: { 
              x: coords.password_x || 1734, 
              y: coords.password_y || 854, 
              desc: "Password Field" 
            }
          });
        }
      } catch (error) {
        console.error('Failed to load coordinates:', error);
      }
    };
    
    loadData();
  }, [coordsFile]);

  // Handle countdown for capture
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        
        if (countdown === 1) {
          // Capture actual mouse position
          const capturePosition = async () => {
            try {
              const position = await window.electron.captureMousePosition();
              
              if (active) {
                setCoordinates(prev => ({
                  ...prev,
                  [active]: {
                    ...prev[active],
                    x: position.x,
                    y: position.y
                  }
                }));
              }
            } catch (error) {
              console.error('Failed to capture mouse position:', error);
            }
            
            setActive(null);
          };
          
          capturePosition();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown, active]);

  const capturePosition = (field) => {
    setActive(field);
    setCountdown(3);
  };

  const testCoordinates = () => {
    // In a real app, we'd move the mouse to each position
    // For demo, we'll just show an alert
    alert(`Would move mouse to:\nUsername: ${coordinates.username.x}, ${coordinates.username.y}\nPassword: ${coordinates.password.x}, ${coordinates.password.y}`);
  };

  const handleSave = async () => {
    try {
      // Convert to format expected by the login function
      const saveData = {
        username_x: coordinates.username.x,
        username_y: coordinates.username.y,
        password_x: coordinates.password.x,
        password_y: coordinates.password.y
      };
      
      await saveCoordinates(saveData, coordsFile);
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save coordinates:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <ThemedFrame 
        title="Configure Login Screen Coordinates"
        className="w-full max-w-lg"
      >
        <div className="p-6">
          <p className="text-center mb-6 text-gray-300">
            Please launch the game manually and position the login screen.
            Then click each button below and click on the corresponding
            position on the login screen.
          </p>
          
          {countdown > 0 && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
              <div className="text-5xl text-yellow-400 font-bold">
                {countdown}
              </div>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            {Object.entries(coordinates).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <span className="text-yellow-300">{value.desc}:</span>
                  <span className="ml-2 text-white">X: {value.x}, Y: {value.y}</span>
                </div>
                <Button 
                  onClick={() => capturePosition(key)}
                  disabled={countdown > 0}
                >
                  Set Position
                </Button>
              </div>
            ))}
          </div>
          
          <p className="text-center mb-6 text-gray-400 italic text-sm">
            Note: The app will press Enter to login after entering credentials
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={testCoordinates} disabled={countdown > 0}>
              Test Coordinates
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={countdown > 0}>
              Save Coordinates
            </Button>
            <Button onClick={onClose} disabled={countdown > 0}>
              Cancel
            </Button>
          </div>
        </div>
      </ThemedFrame>
    </div>
  );
};

export default CoordinatesTool;