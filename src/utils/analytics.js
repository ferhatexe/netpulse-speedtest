import { ANALYTICS_ID } from '../config/site';

/**
 * Google Analytics with Consent Mode v2.
 *
 * The tag loads on every page, but storage starts denied: no cookies are
 * written and no identifiers are kept until the visitor accepts. That is what
 * makes loading it up front defensible under the GDPR — the consent gate is on
 * the storage, not on the script — and it is Google's own recommendation for
 * the EEA.
 *
 * The previous approach injected gtag only after acceptance. That was stricter,
 * but it also meant Google's own tag checker never saw the tag, because it loads
 * the page without answering the banner.
 *
 * `grantAnalyticsConsent()` flips storage on the moment the visitor accepts;
 * `denyAnalyticsConsent()` makes a rejection explicit rather than implied.
 */
let injected = false;

/** Loads gtag.js with every storage type denied. Safe to call repeatedly. */
export function initAnalytics(consentGranted = false) {
  if (injected || !ANALYTICS_ID || typeof document === 'undefined') return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Must be pushed BEFORE the config call, or the first hit escapes the gate.
  // Ad signals stay denied permanently: nothing here serves advertising, so
  // claiming consent for it would be asking for something we never use.
  gtag('consent', 'default', {
    analytics_storage: consentGranted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  gtag('js', new Date());
  gtag('config', ANALYTICS_ID, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.appendChild(script);
}

export function grantAnalyticsConsent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
}

export function denyAnalyticsConsent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', { analytics_storage: 'denied' });
}

/** Reports a page view on client-side route changes, which gtag cannot see by itself. */
export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}
