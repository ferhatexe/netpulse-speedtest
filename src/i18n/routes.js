export const routeSlugs = {
  tr: {
    home: '',
    speed: 'hiz-testi',
    gaming: 'oyun-ping-radari',
    privacy: 'dns-webrtc-sizinti-testi',
    calculator: 'indirme-suresi-hesaplayici',
    faq: 'rehber-ve-sss'
  },
  en: {
    home: '',
    speed: 'speed-test',
    gaming: 'gaming-ping-radar',
    privacy: 'dns-webrtc-leak-test',
    calculator: 'download-time-calculator',
    faq: 'guide-and-faq'
  },
  de: {
    home: '',
    speed: 'geschwindigkeitstest',
    gaming: 'gaming-ping-radar',
    privacy: 'dns-leak-test',
    calculator: 'download-dauer-rechner',
    faq: 'ratgeber-und-faq'
  },
  es: {
    home: '',
    speed: 'test-de-velocidad',
    gaming: 'radar-de-ping-gaming',
    privacy: 'detector-de-fugas-dns',
    calculator: 'calculadora-tiempo-descarga',
    faq: 'guia-y-preguntas'
  },
  fr: {
    home: '',
    speed: 'test-de-debit',
    gaming: 'radar-ping-jeux',
    privacy: 'test-fuite-dns',
    calculator: 'calculateur-temps-telechargement',
    faq: 'guide-et-faq'
  },
  it: {
    home: '',
    speed: 'test-velocita',
    gaming: 'radar-ping-gaming',
    privacy: 'test-fuga-dns',
    calculator: 'calcolatore-tempo-download',
    faq: 'guida-e-faq'
  },
  pt: {
    home: '',
    speed: 'teste-de-velocidade',
    gaming: 'radar-ping-jogos',
    privacy: 'teste-fuga-dns',
    calculator: 'calculadora-tempo-descarga',
    faq: 'guia-e-faq'
  },
  nl: {
    home: '',
    speed: 'snelheidstest',
    gaming: 'gaming-ping-radar',
    privacy: 'dns-lektest',
    calculator: 'downloadtijd-calculator',
    faq: 'gids-en-faq'
  },
  pl: {
    home: '',
    speed: 'test-predkosci',
    gaming: 'radar-ping-gry',
    privacy: 'test-wycieku-dns',
    calculator: 'kalkulator-czasu-pobierania',
    faq: 'poradnik-i-faq'
  },
  ru: {
    home: '',
    speed: 'test-skorosti',
    gaming: 'igrovoy-ping-radar',
    privacy: 'test-utechki-dns',
    calculator: 'kalkulyator-zagruzki',
    faq: 'rukovodstvo-i-faq'
  },
  ja: {
    home: '',
    speed: 'speed-test',
    gaming: 'gaming-ping-radar',
    privacy: 'dns-leak-test',
    calculator: 'download-time-calculator',
    faq: 'guide-faq'
  },
  zh: {
    home: '',
    speed: 'wangsu-ceshi',
    gaming: 'youxi-yanchi-leida',
    privacy: 'dns-xielou-jiance',
    calculator: 'xiazai-shijian-jisuanqi',
    faq: 'zhinan-changjian-wenti'
  },
  ar: {
    home: '',
    speed: 'ikhtibar-alsuraa',
    gaming: 'radar-ping-alalab',
    privacy: 'ikhtibar-tasarub-dns',
    calculator: 'hasibat-waqt-altanzil',
    faq: 'dalil-wa-asilah'
  }
};

export const getRoutePath = (lang, pageKey) => {
  const langKey = lang || 'tr';
  const slug = routeSlugs[langKey]?.[pageKey] || '';
  if (langKey === 'tr' && !slug) return '/';
  if (!slug) return `/${langKey}`;
  return `/${langKey}/${slug}`;
};

export const findPageKeyFromSlug = (lang, slug) => {
  const slugs = routeSlugs[lang] || routeSlugs.tr;
  for (const [key, val] of Object.entries(slugs)) {
    if (val === slug) return key;
  }
  return 'home';
};

// Single source of truth for which locales the app actually serves.
// hreflang, routing and the language picker all read from this list, so a
// locale can never be advertised without a page behind it.
export const SUPPORTED_LANGS = ['tr', 'en', 'de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ar'];

// Arabic is the only right-to-left locale currently shipped.
export const RTL_LANGS = ['ar'];
