import { ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/store/checkout-form";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { getCart } from "@/server/cart";

export const metadata: Metadata = { title: "إتمام الطلب", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, settings, cities, user] = await Promise.all([
    getCart(),
    getSettings(),
    prisma.city.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    getCurrentUser(),
  ]);
  if (cart.hasIssues) redirect("/cart");
  const account = user?.role === "CUSTOMER" ? await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, phone: true } }) : null;

  return (
    <div className="container-lux py-8 md:py-12">
      <h1 className="mb-8 text-3xl font-medium text-burgundy md:text-4xl">إتمام الطلب</h1>
      {cart.lines.length ? (
        <CheckoutForm
          cities={cities}
          lines={cart.lines}
          subtotal={cart.subtotal}
          shippingFee={settings.shipping.fee}
          inside48Fee={settings.shipping.inside48Fee ?? 3000}
          shippingMessage={settings.shipping.message}
          inside48Message={settings.shipping.inside48Message ?? "توصيل مناطق الداخل بـ 30 ₪ (نصف السعر)"}
          defaults={account ? { customerName: account.name, phone: account.phone ? displayPhone(account.phone) : "" } : undefined}
        />
      ) : (
        <EmptyState
          icon={<ShoppingBag />}
          title="لا يوجد ما يمكن طلبه"
          description="سلتك فارغة حالياً."
          action={
            <Link href="/shop" className={buttonVariants()}>
              تسوّقي الآن
            </Link>
          }
        />
      )}
    </div>
  );
}
