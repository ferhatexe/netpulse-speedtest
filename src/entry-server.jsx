import React from 'react';
import { renderToString } from 'react-dom/server';
// React Router 7 dropped the `react-router-dom/server` entry point; StaticRouter
// is exported from the package root now.
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';

/**
 * Build-time entry point. Renders the app for one URL to an HTML string so each
 * route ships real markup instead of an empty <div id="root">.
 *
 * Only used by scripts/prerender.mjs; the browser never loads this file.
 */
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
