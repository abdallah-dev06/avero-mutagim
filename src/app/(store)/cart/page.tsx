import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/store/cart-view";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getSettings } from "@/lib/settings";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { title: "سلة التسوق", robots: { index: false } };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  return (
    <div className="container-lux py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-medium text-burgundy md:text-4xl">
        سلة التسوق {cart.count > 0 && <span className="text-lg text-muted">({cart.count})</span>}
      </h1>
      {cart.lines.length ? (
        <CartView lines={cart.lines} subtotal={cart.subtotal} shippingFee={settings.shipping.fee} shippingMessage={settings.shipping.message} hasIssues={cart.hasIssues} />
      ) : (
        <EmptyState
          icon={<ShoppingBag />}
          title="سلتك فارغة"
          description="اكتشفي تشكيلتنا وأضيفي ما يعجبك."
          action={
            <Link href="/shop" className={buttonVariants()}>
              ابدئي التسوق
            </Link>
          }
        />
      )}
    </div>
  );
}
