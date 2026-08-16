/**
 * Renders the Instagram launch carousel.
 *
 * 1080x1350 (4:5) rather than square — the portrait crop is the tallest thing
 * the feed will show, so it occupies more of the screen on the way past.
 *
 * Colours and the gauge arc are lifted from the site so the profile and the
 * product read as the same thing. Text is positioned line by line: SVG has no
 * automatic wrapping, and librsvg (what sharp rasterises with) will silently
 * run a long <text> straight off the canvas rather than break it.
 *
 *   node scripts/generate-social.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'brand';
mkdirSync(OUT, { recursive: true });

const W = 1080;
const H = 1350;

const CARBON = '#121316';
const INK = '#0D0E12';
const LIME = '#88E724';
const LIME_DIM = '#74DB00';
const MUTED = '#9CA3AF';
const LIGHT = '#F6F6F2';

// librsvg resolves against installed system fonts, so the self-hosted woff2
// files in public/fonts are not reachable here. Segoe UI is the closest
// geometric humanist face present on every Windows box; Consolas stands in for
// the mono numerals.
const SANS = "'Segoe UI', 'Plus Jakarta Sans', sans-serif";
const MONO = "Consolas, 'Space Grotesk', monospace";

/** The logo mark, drawn at an arbitrary size and position. */
const mark = (x, y, size, color = LIME) => {
  const s = size / 512;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <circle cx="256" cy="256" r="180" fill="none" stroke="${color}" stroke-width="24"
            stroke-linecap="round" stroke-dasharray="800" stroke-dashoffset="200"/>
    <path d="M280 120L180 280H270L232 392L332 232H242L280 120Z" fill="${color}"/>
  </g>`;
};

/** Small wordmark used as a corner signature on every slide. */
const wordmark = (y = 96, color = '#FFFFFF') => `
  ${mark(72, y - 34, 64, LIME)}
  <text x="152" y="${y + 12}" font-family="${SANS}" font-size="34" font-weight="800"
        fill="${color}" letter-spacing="-0.5">NetMeter</text>`;

const handle = (y = H - 76, color = MUTED) => `
  <text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${MONO}" font-size="30"
        fill="${color}" letter-spacing="1">netmeter.app</text>`;

/**
 * The speedometer arc from the gauge component: a 240° sweep, dim track with a
 * lime overlay drawn as a dash offset.
 */
const gauge = (cx, cy, r) => {
  const start = 150;
  const sweep = 240;
  const rad = (d) => (d * Math.PI) / 180;
  const pt = (deg) => `${cx + r * Math.cos(rad(deg))} ${cy + r * Math.sin(rad(deg))}`;
  const arc = (from, to) =>
    `M ${pt(from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(to)}`;
  return `
    <path d="${arc(start, start + sweep)}" fill="none" stroke="#2A2D34" stroke-width="26" stroke-linecap="round"/>
    <path d="${arc(start, start + sweep * 0.78)}" fill="none" stroke="${LIME}" stroke-width="26" stroke-linecap="round"/>`;
};

const slides = [
  // 1 — the hook. One claim, one number, nothing else competing for the eye.
  {
    file: 'ig-01-hook.png',
    svg: `
    <rect width="${W}" height="${H}" fill="${INK}"/>
    <!-- A flat translucent circle leaves a visible hard edge against the near
         black, which reads as a stray shape rather than a glow. -->
    <defs>
      <radialGradient id="glow">
        <stop offset="0%" stop-color="${LIME}" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="${LIME}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${W / 2}" cy="880" r="520" fill="url(#glow)"/>
    ${wordmark()}

    <text x="72" y="300" font-family="${SANS}" font-size="82" font-weight="800" fill="#FFFFFF" letter-spacing="-2">İnternetin</text>
    <text x="72" y="392" font-family="${SANS}" font-size="82" font-weight="800" fill="#FFFFFF" letter-spacing="-2">gerçekten ne</text>
    <text x="72" y="484" font-family="${SANS}" font-size="82" font-weight="800" fill="${LIME}" letter-spacing="-2">kadar hızlı?</text>

    ${gauge(W / 2, 880, 250)}
    <text x="${W / 2}" y="880" text-anchor="middle" font-family="${MONO}" font-size="130" font-weight="700" fill="#FFFFFF">324</text>
    <text x="${W / 2}" y="936" text-anchor="middle" font-family="${MONO}" font-size="34" fill="${MUTED}" letter-spacing="3">Mbps</text>

    <text x="${W / 2}" y="1130" text-anchor="middle" font-family="${SANS}" font-size="36" fill="${MUTED}">Üyelik yok · Reklam yok · Ücretsiz</text>
    ${handle()}`
  },

  // 2 — the differentiator. The whole reason the project exists, as one
  // before/after pair, because that is the only part a scrolling reader keeps.
  {
    file: 'ig-02-ping.png',
    svg: `
    <rect width="${W}" height="${H}" fill="${CARBON}"/>
    ${wordmark()}

    <text x="72" y="290" font-family="${SANS}" font-size="72" font-weight="800" fill="#FFFFFF" letter-spacing="-2">Çoğu hız testi</text>
    <text x="72" y="372" font-family="${SANS}" font-size="72" font-weight="800" fill="${LIME}" letter-spacing="-2">ping&#8217;i yanlış ölçer.</text>

    <text x="72" y="470" font-family="${SANS}" font-size="34" fill="${MUTED}">Sunucunun cevap yazma süresini de</text>
    <text x="72" y="516" font-family="${SANS}" font-size="34" fill="${MUTED}">gecikmeye ekliyorlar.</text>

    <rect x="72" y="600" width="440" height="230" rx="28" fill="#1A1C22" stroke="#2A2D34" stroke-width="2"/>
    <text x="292" y="668" text-anchor="middle" font-family="${SANS}" font-size="28" fill="${MUTED}" letter-spacing="2">DİĞERLERİ</text>
    <text x="292" y="770" text-anchor="middle" font-family="${MONO}" font-size="96" font-weight="700" fill="#6B7280">42<tspan font-size="40">ms</tspan></text>

    <rect x="568" y="600" width="440" height="230" rx="28" fill="#16210D" stroke="${LIME}" stroke-width="2"/>
    <text x="788" y="668" text-anchor="middle" font-family="${SANS}" font-size="28" fill="${LIME_DIM}" letter-spacing="2">NETMETER</text>
    <text x="788" y="770" text-anchor="middle" font-family="${MONO}" font-size="96" font-weight="700" fill="${LIME}">3<tspan font-size="40">ms</tspan></text>

    <text x="72" y="940" font-family="${SANS}" font-size="34" fill="#FFFFFF">Biz gecikmeyi çekirdek katmanından</text>
    <text x="72" y="988" font-family="${SANS}" font-size="34" fill="#FFFFFF">okuyoruz. Aradaki fark bu.</text>

    <text x="72" y="1110" font-family="${SANS}" font-size="30" fill="${MUTED}">Jitter · Bufferbloat · Paket kaybı · Oyun pingi</text>
    ${handle()}`
  },

  // 3 — the ask. Light canvas so the carousel does not end on a third dark
  // frame, and the handle is the largest thing on it.
  {
    file: 'ig-03-cta.png',
    svg: `
    <rect width="${W}" height="${H}" fill="${LIGHT}"/>
    ${mark(W / 2 - 110, 210, 220)}

    <text x="${W / 2}" y="560" text-anchor="middle" font-family="${SANS}" font-size="76" font-weight="800" fill="${CARBON}" letter-spacing="-2">NetMeter</text>
    <text x="${W / 2}" y="632" text-anchor="middle" font-family="${SANS}" font-size="36" fill="#4B5563">Tarayıcıdan çalışan hız testi</text>

    <g font-family="${SANS}" font-size="38" fill="${CARBON}">
      <text x="200" y="770">13 dilde</text>
      <text x="200" y="846">Üyelik istemez</text>
      <text x="200" y="922">Verini saklamaz</text>
      <text x="200" y="998">Cloudflare edge ağı</text>
    </g>
    <g fill="${LIME_DIM}" font-family="${SANS}" font-size="38" font-weight="800">
      <text x="140" y="770">→</text>
      <text x="140" y="846">→</text>
      <text x="140" y="922">→</text>
      <text x="140" y="998">→</text>
    </g>

    <rect x="180" y="1090" width="720" height="110" rx="55" fill="${CARBON}"/>
    <text x="${W / 2}" y="1160" text-anchor="middle" font-family="${MONO}" font-size="44" font-weight="700" fill="${LIME}" letter-spacing="1">netmeter.app</text>`
  }
];

for (const s of slides) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s.svg}</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${OUT}/${s.file}`);
  console.log(`${s.file}  ${W}x${H}`);
}
