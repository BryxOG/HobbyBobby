/**
 * Renders the PWA icon set from one SVG source.
 *
 * Run with `npm run icons` after changing the mark. Output lands in
 * public/icons and is committed, so a normal build needs no rasterizer.
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const BLUE = "#228be6";

/** `bleed` fills the whole canvas for maskable icons, which get cropped. */
function svg(size, { bleed }) {
  const r = bleed ? 0 : Math.round(size * 0.22);
  const scale = bleed ? 0.62 : 0.78;
  const glyph = Math.round(size * scale);
  const offset = Math.round((size - glyph) / 2);

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${BLUE}"/>
  <g transform="translate(${offset} ${offset})">
    <svg width="${glyph}" height="${glyph}" viewBox="0 0 100 100">
      <!-- Map pin holding a chat dot: "meet up, then talk". -->
      <path d="M50 8c-16 0-29 13-29 29 0 21 29 55 29 55s29-34 29-55c0-16-13-29-29-29z"
            fill="#fff"/>
      <circle cx="50" cy="37" r="14" fill="${BLUE}"/>
      <circle cx="44" cy="37" r="2.6" fill="#fff"/>
      <circle cx="50" cy="37" r="2.6" fill="#fff"/>
      <circle cx="56" cy="37" r="2.6" fill="#fff"/>
    </svg>
  </g>
</svg>`);
}

async function main() {
  await mkdir("public/icons", { recursive: true });

  const targets = [
    // Referenced by app/manifest.ts, so these live under public/.
    ["public/icons/icon-192.png", 192, { bleed: false }],
    ["public/icons/icon-512.png", 512, { bleed: false }],
    ["public/icons/icon-maskable-512.png", 512, { bleed: true }],

    // These two are Next metadata file conventions: only a file at exactly
    // src/app/icon.png / src/app/apple-icon.png makes Next emit the <link>
    // tags. In public/ they are silently ignored.
    ["src/app/icon.png", 192, { bleed: false }],
    ["src/app/apple-icon.png", 180, { bleed: true }], // iOS masks it itself.
  ];

  for (const [path, size, opts] of targets) {
    const png = await sharp(svg(size, opts)).png().toBuffer();
    await writeFile(path, png);
    console.log(`${path} (${size}×${size}, ${png.length} B)`);
  }
}

await main();
