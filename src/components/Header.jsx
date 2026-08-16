import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Activity, Shield, HardDrive, HelpCircle, ChevronDown, Check, Menu, X, Sun, Moon } from 'lucide-react';
import { getRoutePath } from '../i18n/routes';
import { FlagIcon } from './FlagIcons';

const languages = [
  { code: 'tr', label: 'Türkçe', native: 'TR' },
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'de', label: 'Deutsch', native: 'DE' },
  { code: 'es', label: 'Español', native: 'ES' },
  { code: 'fr', label: 'Français', native: 'FR' },
  { code: 'it', label: 'Italiano', native: 'IT' },
  { code: 'pt', label: 'Português', native: 'PT' },
  { code: 'nl', label: 'Nederlands', native: 'NL' },
  { code: 'pl', label: 'Polski', native: 'PL' },
  { code: 'ru', label: 'Русский', native: 'RU' },
  { code: 'ja', label: '日本語', native: 'JA' },
  { code: 'zh', label: '中文', native: 'ZH' },
  { code: 'ar', label: 'العربية', native: 'AR' },
];

const NAV_ITEMS = [
  { key: 'speed',      labelKey: 'navSpeed',      icon: Zap,         color: 'text-[#88E724]', activeBg: 'bg-black/10 text-neutral-900' },
  { key: 'gaming',     labelKey: 'navGaming',     icon: Activity,    color: 'text-emerald-600', activeBg: 'bg-emerald-100 text-emerald-950' },
  { key: 'privacy',    labelKey: 'navPrivacy',    icon: Shield,      color: 'text-blue-600',   activeBg: 'bg-blue-100 text-blue-950' },
  { key: 'calculator', labelKey: 'navCalculator', icon: HardDrive,   color: 'text-amber-600',  activeBg: 'bg-amber-100 text-amber-950' },
  { key: 'faq',        labelKey: 'navFaq',        icon: HelpCircle,  color: 'text-neutral-500', activeBg: 'bg-black/10 text-neutral-900' },
];

// Four fits a thumb row without crowding; the rest stay in the drawer.
// Short labels because the full nav strings overflow a ~95px cell.
const BOTTOM_NAV = [
  { key: 'speed',      labelKey: 'navSpeedShort',   fallbackKey: 'navSpeed',      icon: Zap },
  { key: 'gaming',     labelKey: 'navGamingShort',  fallbackKey: 'navGaming',     icon: Activity },
  { key: 'privacy',    labelKey: 'navPrivacyShort', fallbackKey: 'navPrivacy',    icon: Shield },
  { key: 'calculator', labelKey: 'navCalcShort',    fallbackKey: 'navCalculator', icon: HardDrive }
];

export default function Header({ lang, setLang, t, currentPageKey = 'home', theme = 'dark', toggleTheme }) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  // Only the nav bar is sticky now; the announcement banner scrolls away
  const HEADER_OFFSET = 80; // nav 64px + 16px breathing room

  // Drives the elevation shadow that separates the pinned bar from the content
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (pageKey) => {
    const el = document.getElementById(pageKey);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleNavClick = (pageKey, e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const newPath = getRoutePath(lang, pageKey);
    navigate(newPath);
    // Small delay so mobile drawer close animation doesn't fight the scroll
    setTimeout(() => scrollToSection(pageKey), 80);
  };

  const handleLanguageChange = (newLangCode) => {
    setLang(newLangCode);
    setLangMenuOpen(false);
    const newPath = getRoutePath(newLangCode, currentPageKey);
    navigate(newPath);
  };

  const isActive = (key) =>
    key === 'speed' ? currentPageKey === 'speed' || currentPageKey === 'home' : currentPageKey === key;

  /**
   * Which section the reader is actually looking at.
   *
   * The bottom bar used to derive its highlight from the URL alone, and
   * scrolling does not change the URL — so the green pill sat on "Hız"
   * permanently no matter how far down the page you were.
   *
   * Only runs below lg, where the bottom bar exists and the cards are stacked
   * in one column. On desktop those same sections sit side by side in a grid,
   * so "the section you are in" has no single answer and the URL stays the
   * better source of truth.
   */
  const [visibleSection, setVisibleSection] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return;

    // Only the sections the bottom bar can actually point at. #faq is
    // deliberately absent: tracking it would leave every tab unlit once the
    // reader reached the questions, which reads as a broken bar rather than as
    // "you are somewhere else".
    const els = BOTTOM_NAV.map(({ key }) => document.getElementById(key)).filter(Boolean);
    if (els.length === 0) return;

    // Measured against a strip running from just under the pinned bar down to
    // 45% of the viewport. Deliberately not an IntersectionObserver: reading
    // the rects here keeps the decision and the geometry in one place, and the
    // five reads are batched into a single frame below.
    const settle = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

      // At the very bottom the footer and the FAQ have pushed every tracked
      // section above the strip, so hold the last one instead of clearing.
      if (atBottom) {
        let last = null;
        let deepest = -Infinity;
        for (const el of els) {
          const top = el.getBoundingClientRect().top;
          if (top > deepest) {
            deepest = top;
            last = el.id;
          }
        }
        if (last) setVisibleSection(last);
        return;
      }

      const bandTop = HEADER_OFFSET;
      const bandBottom = window.innerHeight * 0.45;

      // Two sections overlap the strip mid-transition; the lower one is the one
      // being scrolled into.
      //
      // Order comes off the live layout rather than the array above, because
      // the cards do not render in source order — on mobile the calculator sits
      // at ~1860px and privacy at ~2510px, the reverse of how they are
      // declared. A hardcoded order would light the wrong tab.
      let current = null;
      let lowest = -Infinity;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.bottom <= bandTop || r.top >= bandBottom) continue;
        if (r.top > lowest) {
          lowest = r.top;
          current = el.id;
        }
      }
      if (current) setVisibleSection(current);
    };

    // Called straight from the scroll event rather than deferred to a frame.
    // It is five rect reads with no style writes between them, so there is
    // nothing to thrash, and setState bails out when the section has not
    // changed — which is every scroll event but the handful that cross a
    // boundary.
    settle();
    window.addEventListener('scroll', settle, { passive: true });
    window.addEventListener('resize', settle, { passive: true });
    return () => {
      window.removeEventListener('scroll', settle);
      window.removeEventListener('resize', settle);
    };
  }, [location.pathname]);

  // Falls back to the URL until the observer has reported, so the first paint
  // is never left with nothing highlighted.
  const bottomActive = (key) => (visibleSection ? visibleSection === key : isActive(key));

  return (
    <>
      {/* Announcement banner — deliberately OUTSIDE the sticky element so it
          scrolls away and only the nav bar stays pinned */}
      <div className="bg-[#121316] text-white text-xs font-semibold py-2 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#74DB00] text-black tracking-wider uppercase">
              {t.topBannerBadge}
            </span>
            <span className="hidden sm:inline text-neutral-300">
              {t.topBannerText}
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="flex items-center gap-1.5 text-xs text-[#88E724]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#88E724] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#74DB00]"></span>
              </span>
              {t.networkOnline}
            </span>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-shadow duration-200 ${
          scrolled ? 'shadow-lg shadow-black/20' : ''
        } ${
          theme === 'dark'
            ? 'bg-[#121316]/95 border-white/10 text-white'
            : 'bg-[#F6F6F2]/95 border-black/5 text-neutral-900'
        }`}
      >
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={(e) => handleNavClick('home', e)}
          className="flex items-center gap-3 group text-left cursor-pointer border-none bg-transparent shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#121316] flex items-center justify-center text-[#88E724] shadow-md group-hover:scale-105 transition-transform border border-white/10">
            <Zap className="w-6 h-6 fill-[#88E724]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-xl tracking-tight font-mono-code transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-neutral-900'
              }`}>
                {t.brandName}
              </span>
              <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-[#88E724]">
                PRO
              </span>
            </div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-colors">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key);
            return (
              <button
                key={item.key}
                onClick={(e) => handleNavClick(item.key, e)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{t[item.labelKey]}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-bold transition-all border border-black/10 dark:border-white/10 shadow-xs cursor-pointer shrink-0"
              aria-expanded={langMenuOpen}
              aria-label={t?.langSelect || 'Language Selection'}
            >
              <FlagIcon code={currentLang.code} className="w-5 h-3.5" />
              <span className="hidden xs:inline font-mono text-xs font-black">{currentLang.native}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1A1C22] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setLangMenuOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-black/5 dark:border-white/5 mb-1">
                  Dil / Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      lang === l.code
                        ? 'bg-neutral-100 dark:bg-white/10 text-neutral-950 dark:text-white font-bold'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <FlagIcon code={l.code} className="w-5 h-3.5" />
                      <span>{l.label}</span>
                    </span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-[#74DB00]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speedtest.net Style Pill Theme Switcher [ ☀️ | 🌙 ] */}
          <button
            onClick={toggleTheme}
            className={`relative flex items-center p-1 rounded-full transition-colors w-14 sm:w-16 h-8 cursor-pointer shadow-inner shrink-0 ${
              theme === 'dark' ? 'bg-[#2A2B30] border border-white/10' : 'bg-[#D6D8DE] border border-black/10'
            }`}
            title={theme === 'dark' ? (t?.themeToLight || 'Switch to Light Mode') : (t?.themeToDark || 'Switch to Dark Mode')}
            aria-label={t?.themeToggle || 'Toggle Theme'}
          >
            {/* Left & Right background icons */}
            <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
              <Sun className={`w-3.5 h-3.5 transition-opacity ${theme === 'dark' ? 'text-neutral-500 opacity-60' : 'opacity-0'}`} />
              <Moon className={`w-3.5 h-3.5 transition-opacity ${theme === 'dark' ? 'opacity-0' : 'text-neutral-500 opacity-60'}`} />
            </div>

            {/* Sliding thumb.
                translateX is a physical transform — it does not flip under
                dir="rtl", but the flex row it sits in does. In Arabic the thumb
                therefore started at the right edge and the positive offset
                pushed it straight out of the pill. The rtl: pair sends it the
                other way; the sm: variants are repeated because the responsive
                rule is emitted inside a media query and would otherwise win. */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 shadow-md ${
                theme === 'dark'
                  ? 'translate-x-6 sm:translate-x-8 rtl:-translate-x-6 sm:rtl:-translate-x-8 bg-[#121316] text-white border border-white/20'
                  : 'translate-x-0 bg-white text-neutral-800 border border-black/5'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 fill-current text-white" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-neutral-800 stroke-[2.5]" />
              )}
            </div>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                : 'bg-black/5 hover:bg-black/10 text-neutral-900 border-black/10'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t shadow-2xl animate-in slide-in-from-top-2 duration-200 ${
            theme === 'dark'
              ? 'bg-[#121316] border-white/10 text-white'
              : 'bg-[#F6F6F2] border-black/10 text-neutral-900'
          }`}
        >
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1.5">
            {NAV_ITEMS.map(({ key, labelKey, icon: Icon, color }) => {
              const active = isActive(key);
              return (
                <button
                  key={key}
                  onClick={(e) => {
                    handleNavClick(key, e);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer text-left ${
                    active
                      ? theme === 'dark'
                        ? 'bg-white/15 text-white font-bold'
                        : 'bg-black/10 text-neutral-900 font-bold'
                      : theme === 'dark'
                      ? 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      : 'text-neutral-700 hover:bg-black/5 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${color} shrink-0`} />
                  <span>{t[labelKey]}</span>
                  {active && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[#88E724]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}
      </header>

      {/* Mobile bottom navigation — thumb-reachable, and the only nav that stays
          on screen once the drawer is closed. Padding accounts for the iOS home
          indicator via env(safe-area-inset-bottom). */}
      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl ${
          theme === 'dark'
            ? 'bg-[#121316]/95 border-white/10'
            : 'bg-[#F6F6F2]/95 border-black/10'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label={t?.navTools || 'Navigation'}
      >
        <div className="grid grid-cols-4">
          {BOTTOM_NAV.map(({ key, labelKey, fallbackKey, icon: Icon }) => {
            const active = bottomActive(key);
            return (
              <button
                key={key}
                onClick={(e) => handleNavClick(key, e)}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer transition-colors"
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-10 rounded-full bg-[#88E724]" />
                )}
                <span
                  className={`flex items-center justify-center w-9 h-9 rounded-2xl transition-colors ${
                    active
                      ? 'bg-[#88E724] text-black'
                      : theme === 'dark'
                      ? 'text-neutral-400'
                      : 'text-neutral-500'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span
                  className={`text-[10px] font-bold leading-none truncate max-w-full px-1 ${
                    active
                      ? theme === 'dark' ? 'text-white' : 'text-neutral-900'
                      : theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {t[labelKey] || t[fallbackKey]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
