// src/index.js (Minimal required structure)
import React from 'react';
import ReactDOM from 'react-dom/client';
import CyberWatchDashboard from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CyberWatchDashboard />
  </React.StrictMode>
);