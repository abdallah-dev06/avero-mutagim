// Generates clearly-labelled DEMO garment illustrations (not product photos).
// Replace them with real photography from the admin panel.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

export const DEMO_COLORS = {
  black: { name: "أسود ليلي", hex: "#1F1A1C" },
  burgundy: { name: "عنابي", hex: "#6B2238" },
  sand: { name: "بيج رملي", hex: "#CDB49A" },
  rose: { name: "وردي غباري", hex: "#D9A6B6" },
  olive: { name: "زيتي", hex: "#5E6B4E" },
  navy: { name: "كحلي", hex: "#22304A" },
  ivory: { name: "عاجي", hex: "#EFE8DF" },
  mocha: { name: "موكا", hex: "#7A5A4A" },
};

const hanger = `<path d="M450 150 q0 -38 30 -38 q26 0 26 24 q0 18 -26 30 L450 180" fill="none" stroke="#8B4B65" stroke-width="7" stroke-linecap="round"/>
<path d="M450 180 L300 262 L600 262 Z" fill="none" stroke="#8B4B65" stroke-width="7" stroke-linejoin="round"/>`;

const SHAPES = {
  abaya: `${hanger}
    <path d="M450 232 C410 232 362 246 332 266 L228 560 L286 588 L340 418 L296 1084 Q450 1112 604 1084 L560 418 L614 588 L672 560 L568 266 C538 246 490 232 450 232 Z" fill="C"/>
    <path d="M408 244 Q450 300 492 244" fill="none" stroke="S" stroke-width="5"/>
    <path d="M420 460 L384 1070 M482 460 L520 1070 M450 320 L450 1090" stroke="S" stroke-width="3" opacity=".55"/>`,
  blouse: `${hanger}
    <path d="M450 262 C412 262 372 272 344 290 L250 600 L308 624 L364 450 L346 840 Q450 866 554 840 L536 450 L592 624 L650 600 L556 290 C528 272 488 262 450 262 Z" fill="C"/>
    <path d="M412 272 Q450 340 488 272" fill="none" stroke="S" stroke-width="5"/>
    <path d="M450 330 L450 846 M410 520 L398 834 M492 520 L504 834" stroke="S" stroke-width="3" opacity=".5"/>
    <circle cx="450" cy="380" r="7" fill="S"/><circle cx="450" cy="450" r="7" fill="S"/><circle cx="450" cy="520" r="7" fill="S"/>`,
  trousers: `<path d="M330 210 L570 210" stroke="#8B4B65" stroke-width="9" stroke-linecap="round"/>
    <path d="M450 150 q0 -38 30 -38 q26 0 26 24 q0 18 -26 30 L450 210" fill="none" stroke="#8B4B65" stroke-width="7" stroke-linecap="round"/>
    <path d="M352 236 L548 236 L590 1080 L476 1080 L450 540 L424 1080 L310 1080 Z" fill="C"/>
    <path d="M352 236 L548 236 L548 280 L352 280 Z" fill="S" opacity=".35"/>
    <path d="M400 300 L370 1070 M500 300 L530 1070" stroke="S" stroke-width="3" opacity=".5"/>`,
  scarf: `<path d="M300 250 L600 250" stroke="#8B4B65" stroke-width="10" stroke-linecap="round"/>
    <path d="M450 190 q0 -38 30 -38 q26 0 26 24 q0 18 -26 30 L450 250" fill="none" stroke="#8B4B65" stroke-width="7" stroke-linecap="round"/>
    <path d="M318 256 L582 256 C600 520 612 760 628 980 Q450 1036 272 980 C288 760 300 520 318 256 Z" fill="C"/>
    <path d="M318 256 L582 256 L470 640 Z" fill="S" opacity=".22"/>
    <path d="M380 300 C392 560 372 800 352 990 M540 300 C530 560 548 800 566 990" stroke="S" stroke-width="3" opacity=".45" fill="none"/>
    <path d="M282 984 l-4 40 M310 994 l-2 40 M338 1002 l0 40 M366 1007 l0 40 M394 1010 l0 40 M422 1012 l0 40 M450 1012 l0 40 M478 1012 l0 40 M506 1010 l0 40 M534 1007 l0 40 M562 1002 l0 40 M590 994 l2 40 M618 984 l4 40" stroke="C" stroke-width="5" stroke-linecap="round"/>`,
  set: `${hanger}
    <path d="M450 262 C414 262 376 272 350 288 L268 520 L320 542 L366 420 L356 640 Q450 662 544 640 L534 420 L580 542 L632 520 L550 288 C524 272 486 262 450 262 Z" fill="C"/>
    <path d="M414 272 Q450 334 486 272" fill="none" stroke="S" stroke-width="5"/>
    <path d="M362 680 L538 680 L572 1090 L474 1090 L450 820 L426 1090 L328 1090 Z" fill="C"/>
    <path d="M362 680 L538 680 L538 712 L362 712 Z" fill="S" opacity=".35"/>
    <path d="M450 320 L450 650 M406 740 L380 1080 M494 740 L520 1080" stroke="S" stroke-width="3" opacity=".5"/>`,
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function svg(kind, hex, variant) {
  const light = parseInt(hex.slice(1, 3), 16) > 180;
  const stroke = light ? shade(hex, -38) : shade(hex, 34);
  const bg = variant === 0 ? ["#FBF4F5", "#F1E2E6"] : ["#F7EFEA", "#EADBD3"];
  const view = variant === 0 ? "0 0 900 1200" : "190 260 520 693";
  const body = SHAPES[kind].replaceAll('"C"', `"${hex}"`).replaceAll('"S"', `"${stroke}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="${view}" preserveAspectRatio="xMidYMid slice">
  <defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient></defs>
  <rect x="-200" y="-200" width="1400" height="1600" fill="url(#g)"/>
  <ellipse cx="450" cy="1120" rx="250" ry="22" fill="#4B1F34" opacity=".08"/>
  ${body}
  <g font-family="Georgia, serif" fill="#4B1F34" opacity=".55"><text x="450" y="${variant === 0 ? 1172 : 938}" text-anchor="middle" font-size="${variant === 0 ? 22 : 13}" letter-spacing="6">DEMO IMAGE</text></g>
</svg>`;
}

export async function generate(outDir = "public/demo") {
  await mkdir(outDir, { recursive: true });
  const files = [];
  for (const kind of Object.keys(SHAPES)) {
    for (const [key, c] of Object.entries(DEMO_COLORS)) {
      for (const v of [0, 1]) {
        const name = `${kind}-${key}-${v + 1}.webp`;
        await sharp(Buffer.from(svg(kind, c.hex, v))).webp({ quality: 82 }).toFile(`${outDir}/${name}`);
        files.push(name);
      }
    }
  }
  // Category covers
  for (const kind of Object.keys(SHAPES)) {
    const hex = { abaya: "#1F1A1C", blouse: "#D9A6B6", trousers: "#CDB49A", scarf: "#6B2238", set: "#7A5A4A" }[kind];
    await sharp(Buffer.from(svg(kind, hex, 0))).webp({ quality: 82 }).toFile(`${outDir}/category-${kind}.webp`);
  }
  return files.length;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("demo-images.mjs")) {
  const n = await generate();
  console.log(`generated ${n} demo images`);
}
