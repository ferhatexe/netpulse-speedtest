import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root')

if (rootElement) {
  const tree = (
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )

  // Prerendered routes arrive with markup already in #root. Hydrating attaches
  // to it instead of throwing it away and repainting, which is what keeps the
  // faster first paint the prerender buys us. Plain SPA fallback otherwise.
  if (rootElement.hasChildNodes()) {
    ReactDOM.hydrateRoot(rootElement, tree)
  } else {
    ReactDOM.createRoot(rootElement).render(tree)
  }
}
