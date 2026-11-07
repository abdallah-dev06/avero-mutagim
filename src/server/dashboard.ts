import "server-only";
import { prisma } from "@/lib/db";

export const TZ = "Asia/Hebron";

/** Start of the given local (Palestine) day as a UTC Date. */
export function localDayStart(dateStr: string) {
  // Interpret YYYY-MM-DD at local midnight in Asia/Hebron.
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  const offsetMin = tzOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMin * 60000);
}

function tzOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function localDateDaysAgo(days: number) {
  return localDateString(new Date(Date.now() - days * 864e5));
}

export function localDateString(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export async function getDashboard(fromStr: string, toStr: string, recognizeOn: "DELIVERED" | "PAID") {
  const from = localDayStart(fromStr);
  const to = new Date(localDayStart(toStr).getTime() + 864e5); // exclusive
  const inRange = { createdAt: { gte: from, lt: to } };
  const todayStart = localDayStart(localDateString(new Date()));

  const [byStatus, gross, realised, todayCount, productsTotal, productsPublished, topVariants, perDay, recentOrders, recentEvents, recentAudit] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: inRange, _count: { _all: true }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...inRange, status: { notIn: ["CANCELLED"] } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.aggregate({
      where: recognizeOn === "PAID" ? { ...inRange, paymentStatus: "PAID" } : { ...inRange, status: "DELIVERED" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.product.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.orderItem.groupBy({
      by: ["sku", "productName", "colorName", "size"],
      where: { order: { ...inRange, status: { notIn: ["CANCELLED"] } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.$queryRaw<{ day: string; orders: bigint; gross: bigint | null }[]>`
      SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ}), 'YYYY-MM-DD') AS day,
             COUNT(*) AS orders,
             SUM(CASE WHEN status <> 'CANCELLED' THEN total ELSE 0 END) AS gross
      FROM "Order"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1 ORDER BY 1`,
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, reference: true, customerName: true, total: true, status: true, createdAt: true, cityName: true } }),
    prisma.orderEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { order: { select: { reference: true, id: true } } } }),
    prisma.auditLog.findMany({ where: { action: { notIn: ["admin.login", "admin.logout"] } }, orderBy: { createdAt: "desc" }, take: 6, include: { actor: { select: { name: true } } } }),
  ]);

  // Fill missing days with zeros (cap 120 bars).
  const days: { day: string; orders: number; gross: number }[] = [];
  const map = new Map(perDay.map((r) => [r.day, r]));
  for (let t = from.getTime() + 12 * 36e5; t < to.getTime() && days.length < 120; t += 864e5) {
    const key = localDateString(new Date(t));
    const r = map.get(key);
    days.push({ day: key, orders: Number(r?.orders ?? 0), gross: Number(r?.gross ?? 0) });
  }

  const status = Object.fromEntries(byStatus.map((s) => [s.status, { count: s._count._all, total: s._sum.total ?? 0 }]));
  const returnedValue = status.RETURNED?.total ?? 0;
  const allCount = byStatus.reduce((s, x) => s + x._count._all, 0);

  return {
    allCount,
    status,
    grossValue: gross._sum.total ?? 0,
    grossCount: gross._count._all,
    realisedValue: realised._sum.total ?? 0,
    realisedCount: realised._count._all,
    returnedValue,
    aov: gross._count._all ? Math.round((gross._sum.total ?? 0) / gross._count._all) : 0,
    todayCount,
    productsTotal,
    productsPublished,
    topVariants,
    days,
    recentOrders,
    recentEvents,
    recentAudit,
  };
}
