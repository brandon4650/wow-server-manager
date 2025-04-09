import React from 'react';

const StatusBar = ({ message = 'Ready' }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-yellow-400 px-4 py-2 border-t border-gray-700">
      {message}
    </div>
  );
};

export default StatusBar;