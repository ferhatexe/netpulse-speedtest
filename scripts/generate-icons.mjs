/**
 * Generates the icon sizes index.html references.
 *
 * index.html linked 11 icons that were never in public/, so every page load
 * fired 11 404s and iOS/Android home-screen icons fell back to a screenshot.
 * Derived from the largest existing source so they stay on-brand.
 *
 *   node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const SOURCE = 'public/web-app-manifest-512x512.png';

const TARGETS = [
  ['public/favicon-16x16.png', 16],
  ['public/favicon-32x32.png', 32],
  ['public/android-icon-192x192.png', 192],
  ['public/apple-icon-57x57.png', 57],
  ['public/apple-icon-60x60.png', 60],
  ['public/apple-icon-72x72.png', 72],
  ['public/apple-icon-76x76.png', 76],
  ['public/apple-icon-114x114.png', 114],
  ['public/apple-icon-120x120.png', 120],
  ['public/apple-icon-144x144.png', 144],
  ['public/apple-icon-152x152.png', 152],
  ['public/ms-icon-144x144.png', 144]
];

if (!existsSync(SOURCE)) {
  console.error(`missing source icon: ${SOURCE}`);
  process.exit(1);
}

let written = 0;
for (const [out, size] of TARGETS) {
  await sharp(SOURCE).resize(size, size, { fit: 'cover' }).png({ compressionLevel: 9 }).toFile(out);
  written++;
}

console.log(`icons: ${written} written from ${SOURCE}`);
