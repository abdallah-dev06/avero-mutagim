import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

/** Serves images stored by the `local` storage driver. (S3 images are served by the CDN.) */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  if (!/^[a-z0-9-]+\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.webp$/.test(rel)) return new Response("Not found", { status: 404 });
  const full = path.join(/*turbopackIgnore: true*/ LOCAL_UPLOAD_DIR, rel);
  if (!full.startsWith(LOCAL_UPLOAD_DIR)) return new Response("Not found", { status: 404 });
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
    return new Response("Not found", { status: 404 });
  }
}
