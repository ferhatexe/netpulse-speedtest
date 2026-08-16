/**
 * Renders every route to static HTML after the client build.
 *
 * Without this the server returns an empty <div id="root"> and nothing is
 * visible until 136KB of JavaScript has downloaded, parsed and run — which is
 * what put First Contentful Paint at 2.9s and Largest Contentful Paint at 4.1s
 * on a throttled mobile connection. It is also why crawlers that do not execute
 * JavaScript, including most AI crawlers, saw a blank page.
 *
 * Routes come from src/i18n/routes.js, the same source the sitemap and hreflang
 * read, so a locale can never be prerendered without also being advertised.
 *
 *   node scripts/prerender.mjs      (run by `npm run build`, after `vite build`)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { build } from 'vite';
import { routeSlugs, getRoutePath, SUPPORTED_LANGS } from '../src/i18n/routes.js';

const DIST = 'dist';
const SSR_OUT = '.ssr-tmp';
const PAGES = ['home', 'speed', 'gaming', 'privacy', 'calculator', 'faq'];

// 1. Build the server bundle. Kept out of dist/ so it is never published.
await build({
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: SSR_OUT,
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'entry-server.js' } }
  }
});

const { render } = await import(`../${SSR_OUT}/entry-server.js`);

// 2. The client build's index.html is the shell every route reuses
let template = readFileSync(join(DIST, 'index.html'), 'utf8');
const ROOT_MARKER = '<div id="root"></div>';

if (!template.includes(ROOT_MARKER)) {
  console.error('prerender: could not find the root container in dist/index.html');
  process.exit(1);
}

/**
 * Inline the stylesheet.
 *
 * The <link rel="stylesheet"> blocks first paint on a round trip of its own,
 * which is pure latency on top of an HTML document that already contains the
 * finished markup. The bundle is small enough (~9KB brotli) that carrying it in
 * the document is cheaper than fetching it, and it takes the only remaining
 * render-blocking request off the critical path.
 */
const cssLink = template.match(/<link[^>]+rel="stylesheet"[^>]+href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (cssLink) {
  const css = readFileSync(join(DIST, cssLink[1]), 'utf8');
  template = template.replace(cssLink[0], `<style>${css}</style>`);
  console.log(`prerender: inlined ${(css.length / 1024).toFixed(1)}KB of CSS`);
} else {
  console.warn('prerender: no stylesheet link found — CSS left as a blocking request');
}

const routes = [];
for (const lang of SUPPORTED_LANGS) {
  for (const page of PAGES) {
    if (page !== 'home' && !routeSlugs[lang]?.[page]) continue;
    routes.push(getRoutePath(lang, page === 'home' ? '' : page));
  }
}

let written = 0;
let failed = 0;

for (const route of routes) {
  let html;
  try {
    html = render(route);
  } catch (err) {
    // A route that cannot be prerendered still works as a normal SPA entry, so
    // fail loudly but do not take the whole build down.
    console.error(`prerender: ${route} failed — ${err.message}`);
    failed++;
    continue;
  }

  const page = template.replace(ROOT_MARKER, `<div id="root">${html}</div>`);

  if (route === '/') {
    writeFileSync(join(DIST, 'index.html'), page, 'utf8');
  } else {
    // Written twice on purpose. Hosts disagree about how a slashless path
    // resolves: some map /fr to /fr/index.html, others only to /fr.html, and
    // whichever they do not support falls through to the SPA rewrite and serves
    // the root document — which is the Turkish page, so /fr would ship a Turkish
    // H1 and break hydration. Emitting both makes the route correct either way.
    const dirFile = join(DIST, route, 'index.html');
    mkdirSync(dirname(dirFile), { recursive: true });
    writeFileSync(dirFile, page, 'utf8');

    const flatFile = join(DIST, `${route}.html`);
    mkdirSync(dirname(flatFile), { recursive: true });
    writeFileSync(flatFile, page, 'utf8');
  }
  written++;
}

rmSync(SSR_OUT, { recursive: true, force: true });

console.log(`prerender: ${written} routes written${failed ? `, ${failed} failed` : ''}`);
if (failed) process.exit(1);
