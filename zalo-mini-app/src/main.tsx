import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// CRITICAL REQUIREMENT: Zalo Mini App standard mount root is <div id="app"></div>
const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error("Could not find element with id 'app'. Zalo Mini App requires <div id=\"app\"></div> in index.html!");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
