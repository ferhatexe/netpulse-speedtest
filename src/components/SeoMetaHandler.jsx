import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRoutePath, SUPPORTED_LANGS } from '../i18n/routes';
import { siteUrl } from '../config/site';

const titles = {
  tr: {
    home: "NetPulse™ — İnternet Hız Testi & Ağ Teşhis İstasyonu | Ultra Hızlı",
    speed: "İnternet Hız Testi & Bufferbloat Analizi — NetPulse",
    gaming: "Canlı Oyun Ping Radarı (Valorant, CS2, LoL) — NetPulse",
    privacy: "WebRTC & DNS Sızıntı Dedektifi (IP Gizlilik Testi) — NetPulse",
    calculator: "Dosya İndirme Süresi Hesaplayıcı — NetPulse",
    faq: "İnternet Hızlandırma Rehberi & SSS — NetPulse"
  },
  en: {
    home: "NetPulse™ — Internet Speed Test & Network Command Station | Ultra Fast",
    speed: "Internet Speed Test & Bufferbloat Benchmark — NetPulse",
    gaming: "Live Gaming Ping Radar (Valorant, CS2, LoL) — NetPulse",
    privacy: "WebRTC & DNS Leak Detective (IP Privacy Test) — NetPulse",
    calculator: "File Download Time Calculator — NetPulse",
    faq: "Network Optimization Guide & FAQ — NetPulse"
  },
  de: {
    home: "NetPulse™ — Internet-Geschwindigkeitstest & Netzwerk-Zentrale | Ultra Schnell",
    speed: "Internet-Geschwindigkeitstest & Bufferbloat — NetPulse",
    gaming: "Live Gaming-Ping-Radar (Valorant, CS2, LoL) — NetPulse",
    privacy: "WebRTC & DNS-Leak Detektor (IP-Schutz Test) — NetPulse",
    calculator: "Download-Dauer Rechner — NetPulse",
    faq: "Netzwerk Ratgeber & Häufige Fragen — NetPulse"
  },
  es: {
    home: "NetPulse™ — Test de Velocidad de Internet & Diagnóstico de Red | Ultra Rápido",
    speed: "Test de Velocidad de Internet & Bufferbloat — NetPulse",
    gaming: "Radar de Ping Gaming en Vivo (Valorant, CS2, LoL) — NetPulse",
    privacy: "Detector de Fugas WebRTC & DNS — NetPulse",
    calculator: "Calculadora de Tiempo de Descarga — NetPulse",
    faq: "Guía de Optimización de Red & Preguntas — NetPulse"
  },
  fr: {
    home: "NetPulse™ — Test de débit Internet et diagnostic réseau | Ultra rapide",
    speed: "Test de débit Internet et bufferbloat — NetPulse",
    gaming: "Radar de ping gaming en direct (Valorant, CS2, LoL) — NetPulse",
    privacy: "Détecteur de fuites WebRTC et DNS — NetPulse",
    calculator: "Calculateur de durée de téléchargement — NetPulse",
    faq: "Guide d'optimisation réseau et FAQ — NetPulse"
  },
  it: {
    home: "NetPulse™ — Test di velocità Internet e diagnostica di rete | Ultra veloce",
    speed: "Test di velocità Internet e bufferbloat — NetPulse",
    gaming: "Radar ping gaming in tempo reale (Valorant, CS2, LoL) — NetPulse",
    privacy: "Rilevatore di fughe WebRTC e DNS — NetPulse",
    calculator: "Calcolatore del tempo di download — NetPulse",
    faq: "Guida all'ottimizzazione della rete e FAQ — NetPulse"
  },
  pt: {
    home: "NetPulse™ — Teste de velocidade da Internet e diagnóstico de rede | Ultrarrápido",
    speed: "Teste de velocidade da Internet e bufferbloat — NetPulse",
    gaming: "Radar de ping de jogos em direto (Valorant, CS2, LoL) — NetPulse",
    privacy: "Detetor de fugas WebRTC e DNS — NetPulse",
    calculator: "Calculadora de tempo de descarga — NetPulse",
    faq: "Guia de otimização de rede e FAQ — NetPulse"
  },
  nl: {
    home: "NetPulse™ — Internetsnelheidstest en netwerkdiagnose | Ultrasnel",
    speed: "Internetsnelheidstest en bufferbloat — NetPulse",
    gaming: "Live gaming-pingradar (Valorant, CS2, LoL) — NetPulse",
    privacy: "WebRTC- en DNS-lekdetector — NetPulse",
    calculator: "Downloadtijdcalculator — NetPulse",
    faq: "Gids voor netwerkoptimalisatie en FAQ — NetPulse"
  },
  pl: {
    home: "NetPulse™ — Test prędkości internetu i diagnostyka sieci | Ultraszybki",
    speed: "Test prędkości internetu i bufferbloat — NetPulse",
    gaming: "Radar pingu gamingowego na żywo (Valorant, CS2, LoL) — NetPulse",
    privacy: "Detektor wycieków WebRTC i DNS — NetPulse",
    calculator: "Kalkulator czasu pobierania — NetPulse",
    faq: "Poradnik optymalizacji sieci i FAQ — NetPulse"
  },
  ru: {
    home: "NetPulse™ — Тест скорости интернета и диагностика сети | Сверхбыстро",
    speed: "Тест скорости интернета и bufferbloat — NetPulse",
    gaming: "Живой радар игрового пинга (Valorant, CS2, LoL) — NetPulse",
    privacy: "Детектор утечек WebRTC и DNS — NetPulse",
    calculator: "Калькулятор времени загрузки — NetPulse",
    faq: "Руководство по оптимизации сети и FAQ — NetPulse"
  },
  ja: {
    home: "NetPulse™ — インターネット速度テストとネットワーク診断 | 超高速",
    speed: "インターネット速度テストとバッファブロート — NetPulse",
    gaming: "ライブ ゲーミング Ping レーダー（Valorant, CS2, LoL）— NetPulse",
    privacy: "WebRTC・DNS 漏洩ディテクティブ — NetPulse",
    calculator: "ダウンロード時間計算機 — NetPulse",
    faq: "ネットワーク最適化ガイドと FAQ — NetPulse"
  },
  zh: {
    home: "NetPulse™ — 网速测试与网络诊断 | 极速",
    speed: "网速测试与缓冲膨胀检测 — NetPulse",
    gaming: "实时游戏延迟雷达（无畏契约、CS2、英雄联盟）— NetPulse",
    privacy: "WebRTC 与 DNS 泄漏检测 — NetPulse",
    calculator: "下载时间计算器 — NetPulse",
    faq: "网络优化指南与常见问题 — NetPulse"
  },
  ar: {
    home: "NetPulse™ — اختبار سرعة الإنترنت وتشخيص الشبكة | فائق السرعة",
    speed: "اختبار سرعة الإنترنت وتضخّم التخزين المؤقت — NetPulse",
    gaming: "رادار زمن استجابة الألعاب المباشر (Valorant وCS2 وLoL) — NetPulse",
    privacy: "كاشف تسريبات WebRTC و DNS — NetPulse",
    calculator: "حاسبة زمن التنزيل — NetPulse",
    faq: "دليل تحسين الشبكة والأسئلة الشائعة — NetPulse"
  }
};

const descriptions = {
  tr: "İndirme hızınız ne kadar? NetPulse kolay internet hız testi ile internet servis sağlayıcınızın gerçek hızını, ping, jitter ve bufferbloat değerlerini saniyeler içinde ölçün.",
  en: "How fast is your internet? NetPulse ultra-precise speed test measures your true download, upload, ping, jitter, and bufferbloat in seconds.",
  de: "Wie schnell ist Ihr Internet? Der präzise NetPulse Speedtest misst Ihre echte Download-, Upload- und Ping-Geschwindigkeit in Sekundenschnelle.",
  es: "¿Qué tan rápido es tu internet? El test de velocidad NetPulse mide tu velocidad real de descarga, subida, ping y bufferbloat en segundos.",
  fr: "Quelle est la vitesse de votre connexion ? NetPulse mesure en quelques secondes votre débit descendant et montant réel, le ping, la gigue et le bufferbloat.",
  it: "Quanto è veloce la tua connessione? NetPulse misura in pochi secondi download, upload, ping, jitter e bufferbloat reali.",
  pt: "Qual é a velocidade da sua ligação? O NetPulse mede em segundos a descarga, o envio, o ping, o jitter e o bufferbloat reais.",
  nl: "Hoe snel is jouw internet? NetPulse meet in seconden je werkelijke download, upload, ping, jitter en bufferbloat.",
  pl: "Jak szybki jest twój internet? NetPulse w kilka sekund mierzy rzeczywiste pobieranie, wysyłanie, ping, jitter i bufferbloat.",
  ru: "Насколько быстрый у вас интернет? NetPulse за секунды измеряет реальную скорость загрузки и отдачи, пинг, джиттер и bufferbloat.",
  ja: "あなたの回線はどれくらい速い？ NetPulse は実際のダウンロード、アップロード、Ping、ジッター、バッファブロートを数秒で測定します。",
  zh: "你的网速有多快？NetPulse 在几秒内测量真实的下载、上传、延迟、抖动和缓冲膨胀。",
  ar: "ما مدى سرعة إنترنتك؟ يقيس NetPulse خلال ثوانٍ سرعة التنزيل والرفع الحقيقية وزمن الاستجابة والتذبذب وتضخّم التخزين المؤقت."
};

const locales = {
  tr: 'tr_TR',
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  it: 'it_IT',
  pt: 'pt_PT',
  nl: 'nl_NL',
  pl: 'pl_PL',
  ru: 'ru_RU',
  ja: 'ja_JP',
  zh: 'zh_CN',
  ar: 'ar_SA'
};

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
        name: 'NetPulse',
        url: siteUrl(location.pathname),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        inLanguage: lang,
        description: currentDesc,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
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

    let ld = document.getElementById('netpulse-structured-data');
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = 'netpulse-structured-data';
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
