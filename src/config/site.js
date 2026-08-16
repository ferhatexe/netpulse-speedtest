/**
 * Single place the public origin is defined.
 *
 * It appears in canonical URLs, hreflang, the sitemap, structured data and the
 * share card. Change it here (or set VITE_SITE_ORIGIN at build time) and every
 * one of those follows — deploying under a different domain with a stale origin
 * would point every canonical and hreflang at a site you do not control.
 *
 * No trailing slash.
 */
export const SITE_ORIGIN =
  (import.meta.env?.VITE_SITE_ORIGIN || 'https://netmeter.app').replace(/\/+$/, '');

/** Domain without protocol — for display in the share card footer and meta copy. */
export const SITE_DOMAIN = SITE_ORIGIN.replace(/^https?:\/\//, '');

/**
 * Google Analytics measurement id. Empty disables analytics entirely.
 * Only ever used after the visitor accepts — see src/utils/analytics.js.
 */
export const ANALYTICS_ID = import.meta.env?.VITE_ANALYTICS_ID || 'G-H0V5DYS9D3';

/**
 * Public contact address, routed to the owner's inbox by Cloudflare Email
 * Routing rather than a real mailbox. Shown in the footer and published in the
 * structured data, so a data-removal request has somewhere to go.
 */
export const CONTACT_EMAIL = 'info@netmeter.app';

/** Absolute URL for a site-relative path. */
export const siteUrl = (path = '/') => `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
