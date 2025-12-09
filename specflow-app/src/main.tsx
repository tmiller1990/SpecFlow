import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Import the main App component
import './index.css'; // Import the global styles


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);