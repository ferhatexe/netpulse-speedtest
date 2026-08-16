/**
 * Renders the logo at social-profile sizes.
 *
 * Instagram, X and LinkedIn all crop a profile picture to a circle, so the
 * rounded-square corners of the favicon are thrown away. The square variant
 * here goes full-bleed instead — no corner radius to lose — and the mark is
 * pulled in slightly so nothing important sits where the crop bites.
 *
 *   node scripts/generate-brand.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const OUT = 'brand';
mkdirSync(OUT, { recursive: true });

const CARBON = '#121316';
const LIME = '#88E724';

/** The mark itself, scaled into a 512 viewBox. `inset` shrinks it for circular crops. */
const mark = (scale = 1) => {
  const c = 256;
  const t = `translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})`;
  // fill="none" on the circle is load-bearing: it is a stroked arc, and without
  // it SVG fills the disc black, which reads as a dark blob behind the bolt.
  return `
  <g transform="${t}">
    <circle cx="256" cy="256" r="180" fill="none" stroke="${LIME}" stroke-width="24"
            stroke-linecap="round" stroke-dasharray="800" stroke-dashoffset="200"/>
    <path d="M280 120L180 280H270L232 392L332 232H242L280 120Z" fill="${LIME}"/>
  </g>`;
};

const variants = [
  {
    file: 'netmeter-profile-1080.png',
    size: 1080,
    // Full square: the circular crop removes the corners, so a radius here would
    // only eat into the visible area.
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="${CARBON}"/>${mark(0.82)}</svg>`
  },
  {
    file: 'netmeter-logo-1024.png',
    size: 1024,
    // Keeps the app-icon look, rounded corners and all
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="128" fill="${CARBON}"/>${mark(1)}</svg>`
  },
  {
    file: 'netmeter-mark-transparent-1024.png',
    size: 1024,
    // Mark only, for placing on someone else's background
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${mark(1)}</svg>`
  },
  {
    file: 'netmeter-mark-light-1024.png',
    size: 1024,
    // Same mark on the light canvas, for light-background layouts
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#F6F6F2"/>${mark(1)}</svg>`
  }
];

for (const v of variants) {
  await sharp(Buffer.from(v.svg))
    .resize(v.size, v.size)
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${v.file}`);
  console.log(`${v.file}  ${v.size}x${v.size}`);
}
