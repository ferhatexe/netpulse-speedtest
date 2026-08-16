import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import MouseSpotlight from './components/MouseSpotlight';
import AntiGravityCanvas from './components/AntiGravityCanvas';
import ScrollReveal from './components/ScrollReveal';
import SpeedTestHero from './components/SpeedTestHero';
import GamingRadar from './components/GamingRadar';
import DownloadCalculator from './components/DownloadCalculator';
import DnsLeakCheck from './components/DnsLeakCheck';
import StreamingTest from './components/StreamingTest';
import IpDetective from './components/IpDetective';
import UnitConverter from './components/UnitConverter';
import SeoFaqSection from './components/SeoFaqSection';
import SeoMetaHandler from './components/SeoMetaHandler';
import ShareCardModal from './components/ShareCardModal';
import LocationMap from './components/LocationMap';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';

import { translations } from './i18n/translations';
import { findPageKeyFromSlug, getRoutePath, SUPPORTED_LANGS, RTL_LANGS } from './i18n/routes';

/** Maps a pathname onto the active locale and page key. */
function parseLocation(pathname) {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');

  let lang = 'tr';
  let slug = '';

  if (parts.length > 0 && SUPPORTED_LANGS.includes(parts[0])) {
    lang = parts[0];
    slug = parts[1] || '';
  } else if (parts.length > 0 && parts[0]) {
    slug = parts[0];
  }

  return { lang, pageKey: findPageKeyFromSlug(lang, slug) };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Language and page are derived from the URL during render, not stored in
   * state and filled in by an effect. Effects do not run while prerendering, so
   * the old version emitted Turkish markup for every locale — /fr and /ja shipped
   * a Turkish H1. The URL is the single source of truth; navigating changes it.
   */
  const { lang, pageKey: currentPageKey } = parseLocation(location.pathname);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMetrics, setShareMetrics] = useState(null);
  const [latestDownloadSpeed, setLatestDownloadSpeed] = useState(0);

  /**
   * Always starts 'light', which is exactly what the prerendered HTML contains
   * and what the inline script in index.html assumes when nothing is stored.
   * These three have to agree: reading localStorage here instead would make the
   * first client render differ from the server markup for anyone who picked
   * dark, and React discards the entire prerendered tree on a hydration
   * mismatch — throwing away the faster paint it exists to provide.
   *
   * A stored preference is applied on mount. There is no flash of the wrong
   * theme, because that inline script sets the class on <html> before first
   * paint and the CSS follows it.
   */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('netpulse_theme');
      if (stored && stored !== theme) setTheme(stored);
    } catch {}
    // Intentionally mount-only: this syncs the initial preference, after which
    // toggleTheme owns the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('netpulse_theme', theme);
  }, [theme]);

  // Header/Footer call this to switch language. Navigation is the whole
  // mechanism now — lang is read back out of the URL on the next render.
  const setLang = (nextLang) => navigate(getRoutePath(nextLang, currentPageKey));

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Arabic reads right-to-left; the whole layout has to mirror, not just the text
  useEffect(() => {
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (!currentPageKey || currentPageKey === 'home') return;
    const id = setTimeout(() => {
      const el = document.getElementById(currentPageKey);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(id);
  }, [currentPageKey]);

  const t = translations[lang] || translations.tr;

  const handleOpenShare = (metrics) => {
    setShareMetrics(metrics);
    setShareModalOpen(true);
  };

  const handleSpeedUpdate = (speed) => {
    setLatestDownloadSpeed(speed);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative transition-colors duration-200 selection:bg-[#88E724] selection:text-black"
      style={{
        backgroundColor: theme === 'dark' ? '#0D0E12' : '#F6F6F2',
        color: theme === 'dark' ? '#F6F6F2' : '#121316',
        // Reserve room for the fixed mobile bottom nav. Container padding rather
        // than a spacer element, so flex cannot shrink it away.
        paddingBottom: 'var(--bottom-nav-clearance, 0px)'
      }}
    >
      {/* Dynamic SEO Meta Handler */}
      <SeoMetaHandler lang={lang} pageKey={currentPageKey} t={t} />

      {/* Dynamic Cursor Mouse Spotlight Glow Layer */}
      <MouseSpotlight />

      {/* 60FPS Zero-Gravity Floating Particle Atmosphere */}
      <AntiGravityCanvas />

      {/* Global Header */}
      <Header
        lang={lang}
        setLang={setLang}
        t={t}
        currentPageKey={currentPageKey}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        {/* Hero Section: Speed Test with Entry Animation */}
        <ScrollReveal delay={0.05} yOffset={24}>
          <section id="speed" className="w-full">
            {/* The page had no H1 at all and jumped straight to H3. This is the
                single most important on-page signal for "internet speed test"
                queries, and the copy was already translated but never rendered. */}
            <header className="mb-6 text-center max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {t.heroTitle}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
                {t.heroSubtitle}
              </p>
            </header>

            <SpeedTestHero
              t={t}
              onOpenShare={handleOpenShare}
              onSpeedUpdate={handleSpeedUpdate}
            />
          </section>
        </ScrollReveal>

        {/* Bento Grid Row 1: Gaming Ping Radar & Download Calculator */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollReveal delay={0.1} yOffset={32} className="h-full">
            <GamingRadar t={t} />
          </ScrollReveal>

          <ScrollReveal delay={0.2} yOffset={32} className="h-full">
            <DownloadCalculator t={t} speedMbps={latestDownloadSpeed} />
          </ScrollReveal>
        </section>

        {/* Bento Grid Row 2: DNS / WebRTC Leak Check & 4K Streaming Readiness */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollReveal delay={0.1} yOffset={32} className="h-full">
            <DnsLeakCheck t={t} />
          </ScrollReveal>

          <ScrollReveal delay={0.2} yOffset={32} className="h-full">
            <StreamingTest t={t} downloadSpeed={latestDownloadSpeed} />
          </ScrollReveal>
        </section>

        {/* Bento Grid Row 3: IP & Network Detective + Speed Unit Converter */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScrollReveal delay={0.1} yOffset={32} className="h-full">
            <IpDetective t={t} />
          </ScrollReveal>

          <ScrollReveal delay={0.2} yOffset={32} className="h-full">
            <UnitConverter t={t} />
          </ScrollReveal>
        </section>

        {/* Full-width row: where the test physically ran */}
        <ScrollReveal delay={0.1} yOffset={32}>
          <LocationMap t={t} />
        </ScrollReveal>

        {/* Rich SEO & FAQ Section */}
        <ScrollReveal delay={0.15} yOffset={36}>
          <SeoFaqSection t={t} />
        </ScrollReveal>
      </main>

      {/* EU consent gate — must appear before any optional storage is written */}
      <CookieConsent t={t} />

      {/* Social Media Share Scorecard Modal */}
      <ShareCardModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        metrics={shareMetrics}
        t={t}
        lang={lang}
      />

      {/* Global Footer */}
      <ScrollReveal delay={0.1} yOffset={20}>
        <Footer
          t={t}
          lang={lang}
          setLang={setLang}
          currentPageKey={currentPageKey}
          theme={theme}
        />
      </ScrollReveal>
    </div>
  );
}
