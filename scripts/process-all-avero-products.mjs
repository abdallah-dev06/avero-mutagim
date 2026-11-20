import sharp from "sharp";
import fs from "fs";

const brainDir = "C:/Users/AbdullahY/.gemini/antigravity/brain/ea6ebf3a-b71c-4dbb-976f-f5d65a31620f";

const items = [
  {
    name: "classic-suit",
    catSlug: "suits",
    src: `${brainDir}/luxury_mens_suit_catalog_1795214493592.jpg`,
    crop: { left: 160, top: 120, width: 700, height: 875 },
  },
  {
    name: "premium-shirt",
    catSlug: "shirts",
    src: `${brainDir}/avero_dress_shirt_1795214565835.jpg`,
    crop: { left: 140, top: 80, width: 740, height: 925 },
  },
  {
    name: "tailored-trousers",
    catSlug: "trousers",
    src: `${brainDir}/avero_tailored_trousers_1795214582702.jpg`,
    crop: { left: 180, top: 100, width: 680, height: 850 },
  },
  {
    name: "cashmere-overcoat",
    catSlug: "outerwear",
    src: `${brainDir}/avero_cashmere_overcoat_1795214600771.jpg`,
    crop: { left: 180, top: 100, width: 680, height: 850 },
  },
  {
    name: "knit-sweater",
    catSlug: "knitwear",
    src: `${brainDir}/avero_knit_sweater_1795214619851.jpg`,
    crop: { left: 150, top: 220, width: 720, height: 900 },
  },
  {
    name: "leather-belt-set",
    catSlug: "accessories",
    src: `${brainDir}/avero_leather_accessories_1795214639934.jpg`,
    crop: { left: 150, top: 300, width: 720, height: 900 },
  },
];

async function main() {
  if (!fs.existsSync("public/products")) fs.mkdirSync("public/products", { recursive: true });
  if (!fs.existsSync("public/categories")) fs.mkdirSync("public/categories", { recursive: true });

  for (const item of items) {
    console.log(`Processing ${item.name}...`);
    // 1. Main product image (3:4 ratio)
    await sharp(item.src)
      .resize(1000, 1333, { fit: "cover", position: "center" })
      .webp({ quality: 86 })
      .toFile(`public/products/${item.name}-1.webp`);

    // 2. Detail close-up
    await sharp(item.src)
      .extract(item.crop)
      .resize(1000, 1333, { fit: "cover" })
      .webp({ quality: 86 })
      .toFile(`public/products/${item.name}-2.webp`);

    // 3. Category image
    await sharp(item.src)
      .resize(800, 1067, { fit: "cover", position: "center" })
      .webp({ quality: 84 })
      .toFile(`public/categories/${item.catSlug}.webp`);
  }

  console.log("✓ All product and category images generated successfully!");
}

main().catch(console.error);
