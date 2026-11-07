import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { randomToken } from "@/lib/crypto";
import { DomainError } from "@/server/errors";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);
const MAX_DIMENSION = 2000;

/** Directory for the `local` driver. Served by the /media route (works after `next build`). */
export const LOCAL_UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_DIR ?? "uploads");

export type StoredImage = { url: string; key: string; width: number; height: number };

let s3: S3Client | null = null;
function s3Client() {
  if (!s3) {
    const { S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
    if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !process.env.S3_BUCKET || !process.env.S3_PUBLIC_BASE_URL) {
      throw new Error("S3 storage is not fully configured (see .env.example)");
    }
    s3 = new S3Client({
      region: S3_REGION || "auto",
      endpoint: S3_ENDPOINT || undefined,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    });
  }
  return s3;
}

function driver() {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

/**
 * Validates (declared type, size, real decoded format), normalises (auto-rotate,
 * strip EXIF/GPS metadata, resize, WebP) and stores an uploaded image.
 */
export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
  if (!(file instanceof File) || file.size === 0) throw new DomainError("لم يتم اختيار صورة");
  if (file.size > MAX_UPLOAD_BYTES) throw new DomainError("حجم الصورة أكبر من 8 ميغابايت");
  if (!ALLOWED_TYPES.has(file.type)) throw new DomainError("صيغة غير مدعومة. استخدمي JPG أو PNG أو WebP");

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new DomainError("الملف ليس صورة صالحة");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new DomainError("الملف ليس صورة صالحة");

  const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const key = `${safeFolder}/${new Date().toISOString().slice(0, 7)}/${randomToken(12)}.webp`;

  if (driver() === "s3") {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const base = process.env.S3_PUBLIC_BASE_URL!.replace(/\/$/, "");
    return { url: `${base}/${key}`, key, width: info.width, height: info.height };
  }

  const full = path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return { url: `/media/${key}`, key, width: info.width, height: info.height };
}

export async function deleteStoredImage(key: string | null | undefined) {
  if (!key || key.includes("..")) return;
  try {
    if (driver() === "s3") {
      await s3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    } else {
      await unlink(path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, key));
    }
  } catch {
    // Already gone — nothing to do.
  }
}
