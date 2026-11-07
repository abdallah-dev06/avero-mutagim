// Generates optimized logo derivatives from the approved logo file (never alters the design).
import sharp from "sharp";
const src = "public/brand/logo-source.jpg";
await sharp(src).resize(640, 640).webp({ quality: 88 }).toFile("public/brand/logo.webp");
const circle = Buffer.from('<svg width="1254" height="1254"><circle cx="627" cy="627" r="600"/></svg>');
const round = await sharp(src).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();
await sharp(round).resize(256, 256).png().toFile("public/brand/logo-round.png");
await sharp(round).resize(512, 512).png().toFile("src/app/icon.png");
await sharp(src).resize(180, 180).png().toFile("src/app/apple-icon.png");
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#F7E8EC" } })
  .composite([{ input: await sharp(round).resize(520, 520).png().toBuffer(), gravity: "centre" }])
  .jpeg({ quality: 86 }).toFile("public/brand/og.jpg");
console.log("brand assets ok");
