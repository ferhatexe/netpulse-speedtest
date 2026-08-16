/**
 * Per-route SEO metadata, shared by the runtime <SeoMetaHandler> and by
 * scripts/prerender.mjs.
 *
 * It has to be reachable from the build because the prerendered HTML is what
 * crawlers that do not run JavaScript actually read. Leaving these tags to the
 * runtime meant every prerendered page shipped `<html lang="tr">`, the Turkish
 * title, and a canonical pointing at the root — which tells Google the other 77
 * URLs are duplicates and drops all twelve non-Turkish locales.
 */

export const titles = {
  tr: {
    home: "NetMeter — İnternet Hız Testi & Ağ Teşhis İstasyonu | Ultra Hızlı",
    speed: "İnternet Hız Testi & Bufferbloat Analizi — NetMeter",
    gaming: "Canlı Oyun Ping Radarı (Valorant, CS2, LoL) — NetMeter",
    privacy: "WebRTC & DNS Sızıntı Dedektifi (IP Gizlilik Testi) — NetMeter",
    calculator: "Dosya İndirme Süresi Hesaplayıcı — NetMeter",
    faq: "İnternet Hızlandırma Rehberi & SSS — NetMeter"
  },
  en: {
    home: "NetMeter — Internet Speed Test & Network Command Station | Ultra Fast",
    speed: "Internet Speed Test & Bufferbloat Benchmark — NetMeter",
    gaming: "Live Gaming Ping Radar (Valorant, CS2, LoL) — NetMeter",
    privacy: "WebRTC & DNS Leak Detective (IP Privacy Test) — NetMeter",
    calculator: "File Download Time Calculator — NetMeter",
    faq: "Network Optimization Guide & FAQ — NetMeter"
  },
  de: {
    home: "NetMeter — Internet-Geschwindigkeitstest & Netzwerk-Zentrale | Ultra Schnell",
    speed: "Internet-Geschwindigkeitstest & Bufferbloat — NetMeter",
    gaming: "Live Gaming-Ping-Radar (Valorant, CS2, LoL) — NetMeter",
    privacy: "WebRTC & DNS-Leak Detektor (IP-Schutz Test) — NetMeter",
    calculator: "Download-Dauer Rechner — NetMeter",
    faq: "Netzwerk Ratgeber & Häufige Fragen — NetMeter"
  },
  es: {
    home: "NetMeter — Test de Velocidad de Internet & Diagnóstico de Red | Ultra Rápido",
    speed: "Test de Velocidad de Internet & Bufferbloat — NetMeter",
    gaming: "Radar de Ping Gaming en Vivo (Valorant, CS2, LoL) — NetMeter",
    privacy: "Detector de Fugas WebRTC & DNS — NetMeter",
    calculator: "Calculadora de Tiempo de Descarga — NetMeter",
    faq: "Guía de Optimización de Red & Preguntas — NetMeter"
  },
  fr: {
    home: "NetMeter — Test de débit Internet et diagnostic réseau | Ultra rapide",
    speed: "Test de débit Internet et bufferbloat — NetMeter",
    gaming: "Radar de ping gaming en direct (Valorant, CS2, LoL) — NetMeter",
    privacy: "Détecteur de fuites WebRTC et DNS — NetMeter",
    calculator: "Calculateur de durée de téléchargement — NetMeter",
    faq: "Guide d'optimisation réseau et FAQ — NetMeter"
  },
  it: {
    home: "NetMeter — Test di velocità Internet e diagnostica di rete | Ultra veloce",
    speed: "Test di velocità Internet e bufferbloat — NetMeter",
    gaming: "Radar ping gaming in tempo reale (Valorant, CS2, LoL) — NetMeter",
    privacy: "Rilevatore di fughe WebRTC e DNS — NetMeter",
    calculator: "Calcolatore del tempo di download — NetMeter",
    faq: "Guida all'ottimizzazione della rete e FAQ — NetMeter"
  },
  pt: {
    home: "NetMeter — Teste de velocidade da Internet e diagnóstico de rede | Ultrarrápido",
    speed: "Teste de velocidade da Internet e bufferbloat — NetMeter",
    gaming: "Radar de ping de jogos em direto (Valorant, CS2, LoL) — NetMeter",
    privacy: "Detetor de fugas WebRTC e DNS — NetMeter",
    calculator: "Calculadora de tempo de descarga — NetMeter",
    faq: "Guia de otimização de rede e FAQ — NetMeter"
  },
  nl: {
    home: "NetMeter — Internetsnelheidstest en netwerkdiagnose | Ultrasnel",
    speed: "Internetsnelheidstest en bufferbloat — NetMeter",
    gaming: "Live gaming-pingradar (Valorant, CS2, LoL) — NetMeter",
    privacy: "WebRTC- en DNS-lekdetector — NetMeter",
    calculator: "Downloadtijdcalculator — NetMeter",
    faq: "Gids voor netwerkoptimalisatie en FAQ — NetMeter"
  },
  pl: {
    home: "NetMeter — Test prędkości internetu i diagnostyka sieci | Ultraszybki",
    speed: "Test prędkości internetu i bufferbloat — NetMeter",
    gaming: "Radar pingu gamingowego na żywo (Valorant, CS2, LoL) — NetMeter",
    privacy: "Detektor wycieków WebRTC i DNS — NetMeter",
    calculator: "Kalkulator czasu pobierania — NetMeter",
    faq: "Poradnik optymalizacji sieci i FAQ — NetMeter"
  },
  ru: {
    home: "NetMeter — Тест скорости интернета и диагностика сети | Сверхбыстро",
    speed: "Тест скорости интернета и bufferbloat — NetMeter",
    gaming: "Живой радар игрового пинга (Valorant, CS2, LoL) — NetMeter",
    privacy: "Детектор утечек WebRTC и DNS — NetMeter",
    calculator: "Калькулятор времени загрузки — NetMeter",
    faq: "Руководство по оптимизации сети и FAQ — NetMeter"
  },
  ja: {
    home: "NetMeter — インターネット速度テストとネットワーク診断 | 超高速",
    speed: "インターネット速度テストとバッファブロート — NetMeter",
    gaming: "ライブ ゲーミング Ping レーダー（Valorant, CS2, LoL）— NetMeter",
    privacy: "WebRTC・DNS 漏洩ディテクティブ — NetMeter",
    calculator: "ダウンロード時間計算機 — NetMeter",
    faq: "ネットワーク最適化ガイドと FAQ — NetMeter"
  },
  zh: {
    home: "NetMeter — 网速测试与网络诊断 | 极速",
    speed: "网速测试与缓冲膨胀检测 — NetMeter",
    gaming: "实时游戏延迟雷达（无畏契约、CS2、英雄联盟）— NetMeter",
    privacy: "WebRTC 与 DNS 泄漏检测 — NetMeter",
    calculator: "下载时间计算器 — NetMeter",
    faq: "网络优化指南与常见问题 — NetMeter"
  },
  ar: {
    home: "NetMeter — اختبار سرعة الإنترنت وتشخيص الشبكة | فائق السرعة",
    speed: "اختبار سرعة الإنترنت وتضخّم التخزين المؤقت — NetMeter",
    gaming: "رادار زمن استجابة الألعاب المباشر (Valorant وCS2 وLoL) — NetMeter",
    privacy: "كاشف تسريبات WebRTC و DNS — NetMeter",
    calculator: "حاسبة زمن التنزيل — NetMeter",
    faq: "دليل تحسين الشبكة والأسئلة الشائعة — NetMeter"
  }
};

export const descriptions = {
  tr: "İndirme hızınız ne kadar? NetMeter kolay internet hız testi ile internet servis sağlayıcınızın gerçek hızını, ping, jitter ve bufferbloat değerlerini saniyeler içinde ölçün.",
  en: "How fast is your internet? NetMeter ultra-precise speed test measures your true download, upload, ping, jitter, and bufferbloat in seconds.",
  de: "Wie schnell ist Ihr Internet? Der präzise Geschwindigkeitstest von NetMeter misst Ihre echte Download-, Upload- und Ping-Geschwindigkeit in Sekundenschnelle.",
  es: "¿Qué tan rápido es tu internet? El test de velocidad NetMeter mide tu velocidad real de descarga, subida, ping y bufferbloat en segundos.",
  fr: "Quelle est la vitesse de votre connexion ? NetMeter mesure en quelques secondes votre débit descendant et montant réel, le ping, la gigue et le bufferbloat.",
  it: "Quanto è veloce la tua connessione? NetMeter misura in pochi secondi download, upload, ping, jitter e bufferbloat reali.",
  pt: "Qual é a velocidade da sua ligação? O NetMeter mede em segundos a descarga, o envio, o ping, o jitter e o bufferbloat reais.",
  nl: "Hoe snel is jouw internet? NetMeter meet in seconden je werkelijke download, upload, ping, jitter en bufferbloat.",
  pl: "Jak szybki jest twój internet? NetMeter w kilka sekund mierzy rzeczywiste pobieranie, wysyłanie, ping, jitter i bufferbloat.",
  ru: "Насколько быстрый у вас интернет? NetMeter за секунды измеряет реальную скорость загрузки и отдачи, пинг, джиттер и bufferbloat.",
  ja: "あなたの回線はどれくらい速い？ NetMeter は実際のダウンロード、アップロード、Ping、ジッター、バッファブロートを数秒で測定します。",
  zh: "你的网速有多快？NetMeter 在几秒内测量真实的下载、上传、延迟、抖动和缓冲膨胀。",
  ar: "ما مدى سرعة إنترنتك؟ يقيس NetMeter خلال ثوانٍ سرعة التنزيل والرفع الحقيقية وزمن الاستجابة والتذبذب وتضخّم التخزين المؤقت."
};

export const locales = {
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
