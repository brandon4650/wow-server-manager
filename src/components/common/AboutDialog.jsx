import React from 'react';
import Button from './Button';
import ThemedFrame from './ThemedFrame';

const AboutDialog = ({ title, version, description, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
      <ThemedFrame title={`About ${title}`} className="w-full max-w-md">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">{title}</h2>
          
          <div className="border-t border-gray-700 my-4"></div>
          
          <p className="mb-2 text-gray-300">Version {version}</p>
          
          <p className="mb-6 text-gray-300">{description}</p>
          
          <div className="border-t border-gray-700 my-4"></div>
          
          <p className="text-sm text-gray-500 mb-4">© 2025</p>
          
          <Button variant="gold" onClick={onClose}>
            Close
          </Button>
        </div>
      </ThemedFrame>
    </div>
  );
};

export default AboutDialog;