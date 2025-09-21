import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Remove StrictMode to prevent double execution
ReactDOM.createRoot(document.getElementById('sidepanel-root')).render(
  <App />  // Removed <React.StrictMode>
)
