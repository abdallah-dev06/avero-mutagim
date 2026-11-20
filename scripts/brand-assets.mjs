import sharp from "sharp";
import fs from "node:fs";

const src = "C:/Users/AbdullahY/.gemini/antigravity/brain/ea6ebf3a-b71c-4dbb-976f-f5d65a31620f/.user_uploaded/media_1795206954406_e2f882dc.jpg";

// 1. Copy source
fs.copyFileSync(src, "public/brand/logo-source.jpg");

// 2. Full logo webp
await sharp(src).resize(800, 800).webp({ quality: 90 }).toFile("public/brand/logo.webp");

// 3. Round monogram (crop top portion with crown and AR emblem, center it in a circle)
const emblem = await sharp(src)
  .extract({ left: 260, top: 120, width: 504, height: 440 })
  .resize(512, 512, { fit: "contain", background: "#F7EEDC" })
  .toBuffer();

const circle = Buffer.from('<svg width="512" height="512"><circle cx="256" cy="256" r="250" fill="#000"/></svg>');
const round = await sharp(emblem).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();

await sharp(round).resize(256, 256).png().toFile("public/brand/logo-round.png");
await sharp(round).resize(512, 512).png().toFile("src/app/icon.png");
await sharp(round).resize(180, 180).png().toFile("src/app/apple-icon.png");

// 4. OG Image 1200x630 in Deep Emerald Green (#0B4D3B) with the logo centered
const logoForOg = await sharp(src).resize(480, 480).png().toBuffer();
const ogMask = Buffer.from('<svg width="480" height="480"><rect x="0" y="0" width="480" height="480" rx="240" fill="#000"/></svg>');
const maskedLogoForOg = await sharp(logoForOg).composite([{ input: ogMask, blend: "dest-in" }]).png().toBuffer();

await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#0B4D3B" },
})
  .composite([{ input: maskedLogoForOg, gravity: "centre" }])
  .jpeg({ quality: 90 })
  .toFile("public/brand/og.jpg");

console.log("AVERO MUTAGIM brand assets generated successfully!");
