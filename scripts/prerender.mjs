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
import { routeSlugs, getRoutePath, SUPPORTED_LANGS, RTL_LANGS } from '../src/i18n/routes.js';
import { titles, descriptions, locales } from '../src/i18n/seo.js';
import { translations } from '../src/i18n/translations.js';
// Safe under plain node: site.js reads import.meta.env with optional chaining,
// which is undefined outside Vite rather than a throw.
import { CONTACT_EMAIL } from '../src/config/site.js';

// Mirrors src/config/site.js; SITE_ORIGIN overrides it when the domain changes
const ORIGIN = (process.env.SITE_ORIGIN || 'https://netmeter.app').replace(/\/+$/, '');
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
const routeMeta = new Map();
for (const lang of SUPPORTED_LANGS) {
  for (const page of PAGES) {
    if (page !== 'home' && !routeSlugs[lang]?.[page]) continue;
    const path = getRoutePath(lang, page === 'home' ? '' : page);
    routes.push(path);
    routeMeta.set(path, { lang, page });
  }
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Rewrites the head for one route.
 *
 * These tags were previously only set at runtime by <SeoMetaHandler>, which a
 * crawler that does not execute JavaScript never sees. Every prerendered page
 * therefore shipped `<html lang="tr">`, the Turkish title, and a canonical
 * pointing at the root — and a canonical pointing elsewhere tells Google the
 * page is a duplicate, which would have dropped all twelve non-Turkish locales
 * from the index along with every sub-page.
 */
function applyHead(page, route) {
  const { lang, page: pageKey } = routeMeta.get(route);
  const title = titles[lang]?.[pageKey] || titles[lang]?.home || titles.tr.home;
  const description = descriptions[lang] || descriptions.tr;
  const canonical = ORIGIN + route;
  const isRtl = RTL_LANGS.includes(lang);

  let out = page;

  out = out.replace(/<html lang="[^"]*"/, `<html lang="${lang}"${isRtl ? ' dir="rtl"' : ''}`);
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  out = out.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${esc(description)}$2`
  );
  out = out.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${esc(canonical)}$2`
  );
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`);
  out = out.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  out = out.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
  out = out.replace(
    /(<meta property="og:locale" content=")[^"]*(")/,
    `$1${locales[lang] || 'tr_TR'}$2`
  );
  out = out.replace(/(<meta name="twitter:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`);
  out = out.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  out = out.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${esc(description)}$2`
  );

  // Structured data, per language.
  //
  // index.html carries a single hard-coded WebApplication block in Turkish, and
  // the FAQPage was only ever added at runtime by SeoMetaHandler — so a crawler
  // that does not execute JavaScript saw Turkish schema on every locale and no
  // FAQ at all. FAQ rich results are exactly the kind of thing that needs to be
  // in the served HTML.
  //
  // The id matches the one SeoMetaHandler looks up, so on client-side navigation
  // it updates this same node instead of appending a second one.
  const t = translations[lang] || translations.tr;
  const graph = [
    {
      '@type': 'WebApplication',
      name: 'NetMeter',
      url: canonical,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      inLanguage: lang,
      description,
      publisher: { '@id': `${ORIGIN}/#org` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    },
    {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#org`,
      name: 'NetMeter',
      url: `${ORIGIN}/`,
      email: CONTACT_EMAIL,
      sameAs: ['https://instagram.com/netmeter.app']
    }
  ];

  if (Array.isArray(t?.faqs) && t.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: t.faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    });
  }

  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    // Keep the payload from being able to close the script element early
    .replace(/</g, '\\u003c');

  out = out.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="netmeter-structured-data">${ld}</script>`
  );

  // hreflang has to describe THIS page across locales, not always the home page
  for (const l of SUPPORTED_LANGS) {
    const hasPage = pageKey === 'home' || Boolean(routeSlugs[l]?.[pageKey]);
    if (!hasPage) continue;
    const target = getRoutePath(l, pageKey === 'home' ? '' : pageKey);
    out = out.replace(
      new RegExp(`(<link rel="alternate" hreflang="${l}" href=")[^"]*(")`),
      `$1${esc(ORIGIN + target)}$2`
    );
  }

  return out;
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

  const page = applyHead(template.replace(ROOT_MARKER, `<div id="root">${html}</div>`), route);

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
