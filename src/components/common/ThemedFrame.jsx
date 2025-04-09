import React from 'react';

const ThemedFrame = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded shadow-lg overflow-hidden ${className}`}>
      {title && (
        <div className="bg-gray-900 border-b border-gray-700">
          <div className="border-b border-gray-700">
            <div className="border-b border-gray-700 py-2">
              <h2 className="text-xl text-center font-bold text-yellow-400">{title}</h2>
            </div>
          </div>
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

export default ThemedFrame;