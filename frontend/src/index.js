import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Hide loading screen
const loadingElement = document.getElementById('loading');
if (loadingElement) {
  loadingElement.style.display = 'none';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);