import { ProductGridSkeleton } from "@/components/store/product-card";

export default function Loading() {
  return (
    <div className="container-lux py-10" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="mx-auto mb-10 flex flex-col items-center gap-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-56 rounded-xl" />
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  );
}
