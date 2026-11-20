import sharp from "sharp";
import fs from "fs";
import path from "path";

async function main() {
  const suitSource = "C:/Users/AbdullahY/.gemini/antigravity/brain/ea6ebf3a-b71c-4dbb-976f-f5d65a31620f/luxury_mens_suit_catalog_1795214493592.jpg";
  if (fs.existsSync(suitSource)) {
    // 1. Full view
    await sharp(suitSource)
      .resize(1200, 1500, { fit: "cover", position: "center" })
      .webp({ quality: 88 })
      .toFile("public/products/classic-suit-1.webp");

    // 2. Detail close-up of lapel and fabric
    await sharp(suitSource)
      .extract({ left: 200, top: 150, width: 624, height: 780 })
      .resize(1200, 1500, { fit: "cover" })
      .webp({ quality: 88 })
      .toFile("public/products/classic-suit-2.webp");

    console.log("✓ Classic Suit images processed to WebP!");
  }
}

main().catch(console.error);
