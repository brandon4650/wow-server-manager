import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ServerGrid from './components/ServerGrid';
import AccountManager from './components/AccountManager';
import './styles/theme.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<ServerGrid />} />
            <Route path="/server/:serverName/expansion/:expansionName" element={<AccountManager />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;