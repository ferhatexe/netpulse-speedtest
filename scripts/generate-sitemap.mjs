/**
 * Regenerates public/sitemap.xml from src/i18n/routes.js.
 *
 * The sitemap, the hreflang block in index.html and the router all have to agree
 * on which locales and slugs exist; hand-maintaining three copies is how the old
 * sitemap ended up listing locales the app never served. Deriving it from
 * routes.js keeps them in step.
 *
 *   node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from 'node:fs';
import { routeSlugs, getRoutePath, SUPPORTED_LANGS } from '../src/i18n/routes.js';

// Mirrors src/config/site.js; override with SITE_ORIGIN when the domain changes
const ORIGIN = (process.env.SITE_ORIGIN || 'https://netmeter.app').replace(/\/+$/, '');
const PAGES = ['home', 'speed', 'gaming', 'privacy', 'calculator', 'faq'];
const PRIORITY = { home: '1.0', speed: '0.9', gaming: '0.8', privacy: '0.8', calculator: '0.7', faq: '0.7' };

const lastmod = new Date().toISOString().slice(0, 10);
const url = (lang, page) => ORIGIN + getRoutePath(lang, page === 'home' ? '' : page);

const entries = [];
for (const lang of SUPPORTED_LANGS) {
  for (const page of PAGES) {
    // Skip pages a locale has no slug for
    if (page !== 'home' && !routeSlugs[lang]?.[page]) continue;

    const alternates = SUPPORTED_LANGS
      .filter((l) => page === 'home' || routeSlugs[l]?.[page])
      .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, page)}"/>`)
      .join('\n');

    entries.push(
      [
        '  <url>',
        `    <loc>${url(lang, page)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${page === 'home' ? 'daily' : 'weekly'}</changefreq>`,
        `    <priority>${PRIORITY[page]}</priority>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${url('tr', page)}"/>`,
        '  </url>'
      ].join('\n')
    );
  }
}

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  entries.join('\n'),
  '</urlset>',
  ''
].join('\n');

writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`sitemap.xml: ${entries.length} urls across ${SUPPORTED_LANGS.length} locales`);
