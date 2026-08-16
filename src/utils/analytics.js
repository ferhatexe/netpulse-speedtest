import { ANALYTICS_ID } from '../config/site';

/**
 * Google Analytics, loaded only once the visitor has accepted.
 *
 * The consent banner tells people analytics are optional and that declining
 * costs them nothing. Putting gtag.js straight into index.html would fire it
 * before anyone answered — and for anyone who answered no — which is exactly
 * what the banner promises will not happen, and what the GDPR forbids for
 * non-essential storage.
 *
 * Call `loadAnalytics()` after consent is granted; it is safe to call repeatedly
 * and does nothing without an id.
 */
let injected = false;

export function loadAnalytics() {
  if (injected || !ANALYTICS_ID || typeof document === 'undefined') return;
  injected = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  // The visitor has just opted in, so the analytics grants go with it. Ad
  // signals stay denied: nothing here runs advertising, and consent covers
  // only what was actually asked for.
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('config', ANALYTICS_ID, { anonymize_ip: true });
}

/** Reports a page view on client-side route changes, which gtag cannot see by itself. */
export function trackPageView(path) {
  if (!injected || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}
