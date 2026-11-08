import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

/**
 * Serves images stored permanently in Neon database or local disk cache.
 * Fully supports Vercel Serverless environment with permanent persistence.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  if (!/^[a-z0-9-]+\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.webp$/.test(rel)) {
    return new Response("Not found", { status: 404 });
  }

  // 1. Try reading from local disk cache if available
  const full = path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, rel);
  if (full.startsWith(LOCAL_UPLOAD_DIR)) {
    try {
      const data = await readFile(full);
      return new Response(new Uint8Array(data), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      // Fall through to database lookup
    }
  }

  // 2. Fetch permanently stored image from Neon PostgreSQL
  try {
    const record = await prisma.storedMedia.findUnique({
      where: { key: rel },
      select: { data: true, mimeType: true },
    });

    if (record?.data) {
      return new Response(new Uint8Array(record.data), {
        headers: {
          "Content-Type": record.mimeType || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  } catch (err) {
    console.error("Failed to load stored media from database:", err);
  }

  return new Response("Not found", { status: 404 });
}
