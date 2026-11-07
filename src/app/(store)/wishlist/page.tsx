import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getCart } from "@/server/cart";
import { productCards } from "@/server/catalog";

export const metadata: Metadata = { title: "المفضلة", robots: { index: false } };

export default async function WishlistPage() {
  const cart = await getCart();
  const products = cart.wishlistIds.length ? await productCards({ id: { in: cart.wishlistIds } }, [{ name: "asc" }], 60) : [];
  return (
    <div className="container-lux py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-medium text-burgundy md:text-4xl">المفضلة</h1>
      {products.length ? (
        <ProductGrid products={products} wishlistIds={cart.wishlistIds} />
      ) : (
        <EmptyState
          icon={<Heart />}
          title="لا توجد منتجات في المفضلة"
          description="اضغطي على القلب في أي منتج لحفظه هنا."
          action={
            <Link href="/shop" className={buttonVariants()}>
              تصفّحي المنتجات
            </Link>
          }
        />
      )}
    </div>
  );
}
