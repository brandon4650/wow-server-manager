import React from 'react';
import Button from './Button';
import ThemedFrame from './ThemedFrame';

const ConfirmDialog = ({ title, message, onResult }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <ThemedFrame title={title} className="w-full max-w-md">
        <div className="p-6">
          <p className="text-center mb-6 text-gray-300">{message}</p>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="gold" 
              onClick={() => onResult(true)}
            >
              Yes
            </Button>
            <Button 
              onClick={() => onResult(false)}
            >
              No
            </Button>
          </div>
        </div>
      </ThemedFrame>
    </div>
  );
};

export default ConfirmDialog;