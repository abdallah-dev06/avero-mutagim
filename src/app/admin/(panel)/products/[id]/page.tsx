import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/product-editor";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { editorOptions, loadEditorState } from "@/server/admin-products";

export const metadata = { title: "تعديل منتج" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [data, opts] = await Promise.all([loadEditorState(id), editorOptions()]);
  if (!data) notFound();
  return (
    <div>
      <Link href="/admin/products" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-burgundy">
        <ArrowRight className="size-4" /> المنتجات
      </Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-burgundy">{data.state.name}</h1>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
            {data.status === "ARCHIVED" && <span className="rounded-full bg-stone-100 px-2 py-0.5">مؤرشف</span>}
            {data.isDemo && <span className="rounded-full bg-stone-100 px-2 py-0.5">منتج تجريبي — استبدلي الصور والبيانات أو احذفيه</span>}
            {data.hasOrders && <span className="rounded-full bg-blush px-2 py-0.5 text-burgundy">موجود في طلبات — الحذف النهائي غير متاح</span>}
            {data.status === "PUBLISHED" && (
              <Link href={`/product/${data.state.slug}`} target="_blank" className="inline-flex items-center gap-1 text-burgundy hover:underline">
                عرض في المتجر <ExternalLink className="size-3" />
              </Link>
            )}
          </p>
        </div>
        <ProductRowActions id={id} name={data.state.name} status={data.status as "DRAFT"} variant="bar" />
      </div>
      <ProductEditor key={JSON.stringify(data.state.variants.map((v) => v.stock))} initial={data.state} {...opts} />
    </div>
  );
}
