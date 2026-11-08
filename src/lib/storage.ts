import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/db";
import { DomainError } from "@/server/errors";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB for modern smartphone cameras
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/pjpeg",
  "image/x-png",
  "image/gif",
]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "heif", "avif", "gif", "tiff"]);
const MAX_DIMENSION = 2000;

/** Directory for local disk cache. Served by the /media route. */
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

function isS3Configured() {
  return (
    process.env.STORAGE_DRIVER === "s3" &&
    !!process.env.S3_BUCKET &&
    !!process.env.S3_PUBLIC_BASE_URL &&
    !!process.env.S3_ACCESS_KEY_ID &&
    !!process.env.S3_SECRET_ACCESS_KEY
  );
}

/**
 * Validates, normalises (auto-rotate, strip EXIF/GPS, resize, WebP conversion)
 * and permanently stores an uploaded image in Neon DB and/or S3 bucket.
 */
export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
  if (!(file instanceof File) || file.size === 0) throw new DomainError("لم يتم اختيار صورة");
  if (file.size > MAX_UPLOAD_BYTES) throw new DomainError("حجم الصورة أكبر من 12 ميغابايت");

  // Allow files if MIME matches or if binary header is a valid image format
  if (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase())) {
    // Check if filename ends with common extensions
    const ext = file.name?.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"].includes(ext ?? "")) {
      throw new DomainError("صيغة غير مدعومة. استخدمي JPG أو PNG أو WebP أو HEIC");
    }
  }

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 45_000_000 }).metadata();
  } catch {
    throw new DomainError("الملف ليس صورة صالحة أو تعذّر فك تشفيره");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new DomainError("صيغة الصورة غير مدعومة");
  }

  const { data, info } = await sharp(input, { limitInputPixels: 45_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "misc";
  const key = `${safeFolder}/${new Date().toISOString().slice(0, 7)}/${randomToken(12)}.webp`;

  // 1. If S3 is configured, upload to S3 bucket
  if (isS3Configured()) {
    try {
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
    } catch (err) {
      console.error("S3 upload failed, falling back to permanent database storage:", err);
    }
  }

  // 2. Permanent storage in Neon PostgreSQL database (guarantees survival across Vercel deploys, restarts, and devices)
  try {
    await prisma.storedMedia.upsert({
      where: { key },
      create: {
        key,
        mimeType: "image/webp",
        data,
        width: info.width,
        height: info.height,
      },
      update: {
        data,
        width: info.width,
        height: info.height,
      },
    });
  } catch (dbErr) {
    console.error("Database storage failed for image:", dbErr);
    throw new DomainError("تعذّر حفظ الصورة في قاعدة البيانات");
  }

  // 3. Best-effort local filesystem write (for local development caching; safe if EROFS on serverless)
  try {
    const full = path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  } catch {
    // Read-only filesystem on Vercel is expected and safely bypassed by DB storage
  }

  return { url: `/media/${key}`, key, width: info.width, height: info.height };
}

export async function deleteStoredImage(key: string | null | undefined) {
  if (!key || key.includes("..")) return;
  try {
    if (isS3Configured()) {
      await s3Client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    }
  } catch {
    // Ignore external S3 delete errors
  }

  try {
    await prisma.storedMedia.delete({ where: { key } }).catch(() => undefined);
  } catch {
    // Ignore if already deleted
  }

  try {
    await unlink(path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, key));
  } catch {
    // Already gone — nothing to do.
  }
}
