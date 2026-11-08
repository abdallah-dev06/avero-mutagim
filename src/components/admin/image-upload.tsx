"use client";

import { ImagePlus, Loader2, AlertCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; key: string; width: number; height: number };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif";
const MAX_BYTES = 12 * 1024 * 1024;

export async function uploadImage(file: File, folder = "products"): Promise<UploadedImage> {
  if (file.size > MAX_BYTES) {
    throw new Error(`حجم الصورة (${(file.size / (1024 * 1024)).toFixed(1)}MB) يتجاوز الحد المسموح (12MB)`);
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: fd,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? "تعذّر رفع الصورة إلى السيرفر");
  }

  return body as UploadedImage;
}

/** Drop zone / picker that uploads files with smooth progress feedback and validation */
export function ImageDropzone({
  onUploaded,
  folder,
  multiple = true,
  label = "اسحبي الصور هنا أو اضغطي للاختيار",
  compact,
}: {
  onUploaded: (img: UploadedImage) => void;
  folder?: string;
  multiple?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [progress, setProgress] = React.useState<{ current: number; total: number; name?: string } | null>(null);
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, multiple ? 20 : 1);
    if (!list.length) return;

    setProgress({ current: 0, total: list.length, name: list[0]?.name });
    let successCount = 0;

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      setProgress({ current: i + 1, total: list.length, name: f.name });
      try {
        const uploaded = await uploadImage(f, folder);
        onUploaded(uploaded);
        successCount++;
      } catch (e) {
        toast.error(`فشل رفع ${f.name}: ${(e as Error).message}`);
      }
    }

    setProgress(null);
    if (successCount > 0) {
      toast.success(successCount === 1 ? "تم رفع الصورة بنجاح وتخزينها بأمان" : `تم رفع ${successCount} صور بنجاح`);
    }
  };

  const isBusy = progress !== null;

  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files?.length) handle(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm text-muted transition select-none",
        compact ? "aspect-[3/4] p-2" : "p-6",
        drag ? "border-burgundy bg-blush" : "border-line bg-ivory hover:border-mauve",
        isBusy && "cursor-wait opacity-80",
      )}
      aria-busy={isBusy}
    >
      {isBusy ? (
        <Loader2 className="size-6 animate-spin text-burgundy" />
      ) : (
        <ImagePlus className="size-6 text-mauve transition-transform group-hover:scale-110" />
      )}
      <span className="text-center font-medium">
        {isBusy ? (
          <span className="text-burgundy">
            جارٍ رفع {progress.current} من {progress.total}…
          </span>
        ) : (
          label
        )}
      </span>
      {!compact && !isBusy && (
        <span className="text-xs text-muted/80">
          JPG / PNG / WebP / HEIC — حتى 12MB للملف الواحد
        </span>
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        disabled={isBusy}
        onChange={(e) => {
          if (e.target.files?.length) handle(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
