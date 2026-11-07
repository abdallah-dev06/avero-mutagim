"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; key: string; width: number; height: number };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX = 8 * 1024 * 1024;

export async function uploadImage(file: File, folder = "products"): Promise<UploadedImage> {
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("صيغة غير مدعومة. استخدمي JPG أو PNG أو WebP");
  if (file.size > MAX) throw new Error("حجم الصورة أكبر من 8 ميغابايت");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "تعذّر رفع الصورة");
  return body as UploadedImage;
}

/** Drop zone / picker that uploads files one by one and reports each result. */
export function ImageDropzone({ onUploaded, folder, multiple = true, label = "اسحبي الصور هنا أو اضغطي للاختيار", compact }: { onUploaded: (img: UploadedImage) => void; folder?: string; multiple?: boolean; label?: string; compact?: boolean }) {
  const [busy, setBusy] = React.useState(0);
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, multiple ? 12 : 1);
    setBusy((b) => b + list.length);
    for (const f of list) {
      try {
        onUploaded(await uploadImage(f, folder));
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message}`);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm text-muted transition",
        compact ? "aspect-[3/4] p-2" : "p-6",
        drag ? "border-burgundy bg-blush" : "border-line bg-ivory hover:border-mauve",
      )}
      aria-busy={busy > 0}
    >
      {busy > 0 ? <Loader2 className="size-6 animate-spin text-burgundy" /> : <ImagePlus className="size-6 text-mauve" />}
      <span className="text-center">{busy > 0 ? `جارٍ رفع ${busy}…` : label}</span>
      {!compact && <span className="text-xs">JPG / PNG / WebP — حتى 8MB</span>}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handle(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
