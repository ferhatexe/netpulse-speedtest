import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRoutePath, SUPPORTED_LANGS } from '../i18n/routes';
import { titles, descriptions, locales } from '../i18n/seo';
import { siteUrl, CONTACT_EMAIL } from '../config/site';

export default function SeoMetaHandler({ lang = 'tr', pageKey = 'home', t }) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update HTML lang attribute
    document.documentElement.lang = lang;

    // 2. Update Page Title
    const currentTitle = titles[lang]?.[pageKey] || titles[lang]?.home || titles.tr.home;
    document.title = currentTitle;

    // 3. Update Meta Description
    const currentDesc = descriptions[lang] || descriptions.tr;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = currentDesc;

    // 4. Update OpenGraph & Twitter Tags
    const setMetaProp = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(prop.startsWith('twitter:') ? 'name' : 'property', prop);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaProp('og:title', currentTitle);
    setMetaProp('og:description', currentDesc);
    setMetaProp('og:locale', locales[lang] || 'tr_TR');
    setMetaProp('og:url', siteUrl(location.pathname));
    setMetaProp('twitter:title', currentTitle);
    setMetaProp('twitter:description', currentDesc);

    // 5. Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = siteUrl(location.pathname);

    // 6. Structured data, rebuilt per language.
    // The static WebApplication block in index.html is Turkish-only and carries no
    // FAQ. FAQPage is what earns the expandable answers in the result page, and
    // the questions are already translated for every locale.
    const graph = [
      {
        '@type': 'WebApplication',
        name: 'NetMeter',
        url: siteUrl(location.pathname),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        inLanguage: lang,
        description: currentDesc,
        publisher: { '@id': `${siteUrl('/')}#org` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl('/')}#org`,
        name: 'NetMeter',
        url: siteUrl('/'),
        email: CONTACT_EMAIL,
        // Tells search engines the site and this profile are the same entity.
        // Only accounts that exist go here.
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

    let ld = document.getElementById('netmeter-structured-data');
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'netmeter-structured-data';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });

    // 7. Update Dynamic Hreflang alternates for the active pageKey
    SUPPORTED_LANGS.forEach((l) => {
      let hrefEl = document.querySelector(`link[rel="alternate"][hreflang="${l}"]`);
      if (hrefEl) {
        const targetPath = getRoutePath(l, pageKey === 'home' ? '' : pageKey);
        hrefEl.href = siteUrl(targetPath);
      }
    });

  }, [lang, pageKey, location.pathname, t]);

  return null;
}
