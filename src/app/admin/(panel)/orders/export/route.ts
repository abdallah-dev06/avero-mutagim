import { audit } from "@/lib/audit";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_SOURCE_LABEL, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-status";
import { csvEscape, orderFilters, orderWhere } from "@/server/admin-orders";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!isStaff(user)) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const where = orderWhere(orderFilters(sp));
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 10000, include: { items: true } });
  const header = ["reference", "created_at", "status", "payment_status", "source", "customer_name", "phone", "city", "area", "address", "note", "items", "item_count", "subtotal_ils", "shipping_ils", "total_ils"];
  const rows = orders.map((o) =>
    [
      o.reference,
      o.createdAt.toISOString(),
      ORDER_STATUS_LABEL[o.status],
      PAYMENT_STATUS_LABEL[o.paymentStatus],
      ORDER_SOURCE_LABEL[o.source],
      o.customerName,
      o.phone,
      o.cityName,
      o.areaName,
      o.addressLine,
      o.note ?? "",
      o.items.map((i) => `${i.productName} (${i.colorName}/${i.size}) x${i.quantity} [${i.sku}]`).join(" | "),
      o.itemCount,
      (o.subtotal / 100).toFixed(2),
      (o.shippingFee / 100).toFixed(2),
      (o.total / 100).toFixed(2),
    ]
      .map(csvEscape)
      .join(","),
  );
  await audit({ actorId: user.id, action: "orders.export", entity: "Order", data: { count: orders.length } });
  const body = "﻿" + [header.join(","), ...rows].join("\r\n"); // BOM so Excel shows Arabic correctly
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vetrina-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
