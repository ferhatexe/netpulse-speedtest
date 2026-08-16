import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { getRoutePath } from '../i18n/routes';
import { FlagIcon } from './FlagIcons';

// Custom SVG social icons — no external icon library dependency
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

const IconTwitterX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

/**
 * Only accounts that actually exist belong here.
 *
 * This list previously carried Instagram, X, Facebook and YouTube handles that
 * had never been registered — so the footer linked visitors to pages that either
 * 404 or, worse, belong to somebody else who happened to take the name.
 *
 * IconTwitterX, IconFacebook and IconYouTube above are kept for when those
 * accounts are opened; add an entry here at that point.
 */
const SOCIAL_LINKS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/netmeter.app',
    icon: IconInstagram,
    hoverColor: 'hover:text-pink-500 hover:border-pink-300 hover:bg-pink-50',
  },
];

export default function Footer({ t, lang, setLang, currentPageKey = 'home', theme = 'dark' }) {
  const navigate = useNavigate();

  const handleNavClick = (pageKey, e) => {
    e.preventDefault();
    const newPath = getRoutePath(lang, pageKey);
    navigate(newPath);
    const targetElement = document.getElementById(pageKey);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLangSwitch = (newLang) => {
    setLang(newLang);
    const newPath = getRoutePath(newLang, currentPageKey);
    navigate(newPath);
  };

  return (
    <footer
      className={`mt-16 border-t py-12 text-xs transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#0D0E12] border-white/10 text-neutral-400'
          : 'bg-[#F0F1EA]/80 border-black/5 text-neutral-600'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Col 1: Brand + Social */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#121316] flex items-center justify-center text-[#88E724] border border-white/10">
                <Zap className="w-4 h-4 fill-[#88E724]" />
              </div>
              <span className={`font-extrabold text-base font-mono-code ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                {t.brandName} <span className="text-[#74DB00]">PRO</span>
              </span>
            </div>

            <p className={`text-xs max-w-md leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
              {t.footerDesc}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-neutral-300 dark:text-neutral-300 font-mono-code">
              <span>Edge Anycast Network · 99.99% Uptime · SSL 256-bit</span>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ id, label, href, icon: Icon, hoverColor }) => (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                    theme === 'dark'
                      ? 'border-white/10 bg-[#1A1C22] text-neutral-300 hover:text-white'
                      : 'border-black/10 bg-white text-neutral-600'
                  } ${hoverColor}`}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h3 className={`font-bold text-xs uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              {t.navTools}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={getRoutePath(lang, 'speed')}
                  onClick={(e) => handleNavClick('speed', e)}
                  className={`transition-colors cursor-pointer ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}
                >
                  {t.navSpeed}
                </a>
              </li>
              <li>
                <a
                  href={getRoutePath(lang, 'gaming')}
                  onClick={(e) => handleNavClick('gaming', e)}
                  className={`transition-colors cursor-pointer ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}
                >
                  {t.navGaming}
                </a>
              </li>
              <li>
                <a
                  href={getRoutePath(lang, 'privacy')}
                  onClick={(e) => handleNavClick('privacy', e)}
                  className={`transition-colors cursor-pointer ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}
                >
                  {t.navPrivacy}
                </a>
              </li>
              <li>
                <a
                  href={getRoutePath(lang, 'calculator')}
                  onClick={(e) => handleNavClick('calculator', e)}
                  className={`transition-colors cursor-pointer ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}
                >
                  {t.navCalculator}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Language & Legal */}
          <div>
            <h3 className={`font-bold text-xs uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              Diller / Languages
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { code: 'tr', label: 'TR' },
                { code: 'en', label: 'EN' },
                { code: 'de', label: 'DE' },
                { code: 'es', label: 'ES' },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => handleLangSwitch(code)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    lang === code
                      ? 'border-black dark:border-[#88E724] bg-[#121316] text-[#88E724] font-bold shadow-xs'
                      : theme === 'dark'
                      ? 'border-white/10 bg-[#1A1C22] text-neutral-300 hover:border-white/30 hover:text-white'
                      : 'border-black/10 bg-white text-neutral-700 hover:border-black/30'
                  }`}
                >
                  <FlagIcon code={code} className="w-4 h-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a href="#privacy" className={`inline-flex items-center min-h-[24px] py-1 transition-colors ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}>
                  {t?.privacyPolicy || 'Privacy Policy'}
                </a>
              </li>
              <li>
                <a href="#speed" className={`inline-flex items-center min-h-[24px] py-1 transition-colors ${theme === 'dark' ? 'text-neutral-300 hover:text-[#88E724]' : 'text-neutral-700 hover:text-black'}`}>
                  {t?.termsOfUse || 'Terms of Use'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-code ${
          theme === 'dark' ? 'border-white/10 text-neutral-300' : 'border-black/5 text-neutral-600'
        }`}>
          <div>
            © {new Date().getFullYear()} NetMeter Inc. {t.rights}
          </div>
          <div className="text-center sm:text-right max-w-sm">
            {t.disclaimer}
          </div>
        </div>
      </div>
    </footer>
  );
}
