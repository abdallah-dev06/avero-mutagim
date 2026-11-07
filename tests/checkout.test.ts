import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createOrder } from "@/server/orders";
import { StockError } from "@/server/errors";
import { customer, db, resetDb, seedCity, seedProduct } from "./helpers";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

describe("checkout persistence", () => {
  it("creates an order with server-computed totals, snapshots and stock movements", async () => {
    const { variants } = await seedProduct({ price: 18900, salePrice: 15900 });
    const city = await seedCity();
    const res = await createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 2 }], customer: customer(city.id), shippingFee: 0, idempotencyKey: randomUUID() });

    const order = await db.order.findUniqueOrThrow({ where: { id: res.orderId }, include: { items: true, events: true } });
    expect(order.reference).toMatch(/^VB-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(order.subtotal).toBe(31800); // sale price × 2, from the DB
    expect(order.total).toBe(31800);
    expect(order.shippingFee).toBe(0);
    expect(order.status).toBe("NEW");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.cityName).toBe(city.name);
    expect(order.items[0]).toMatchObject({ quantity: 2, unitPrice: 15900, colorName: "black", size: "S", imageUrl: "/b1.webp" });
    expect(order.events.map((e) => e.type)).toEqual(["CREATED"]);
    expect(order.accessToken.length).toBeGreaterThanOrEqual(30);

    const v = await db.productVariant.findUniqueOrThrow({ where: { id: variants["black/S"] } });
    expect(v.stock).toBe(3);
    const mv = await db.stockMovement.findMany({ where: { variantId: v.id } });
    expect(mv).toHaveLength(1);
    expect(mv[0]).toMatchObject({ delta: -2, stockAfter: 3, reason: "ORDER" });
  });

  it("applies the per-variant price adjustment", async () => {
    const { variants } = await seedProduct({ price: 10000 });
    await db.productVariant.update({ where: { id: variants["black/M"] }, data: { priceAdjustment: 1500 } });
    const city = await seedCity();
    const res = await createOrder(db, { lines: [{ variantId: variants["black/M"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 });
    expect((await db.order.findUniqueOrThrow({ where: { id: res.orderId } })).total).toBe(11500);
  });

  it("is idempotent: retries with the same key return the same order", async () => {
    const { variants } = await seedProduct();
    const city = await seedCity();
    const key = randomUUID();
    const input = { lines: [{ variantId: variants["black/S"], quantity: 1 }], customer: customer(city.id), shippingFee: 0, idempotencyKey: key };
    const [a, b, c] = await Promise.all([createOrder(db, input), createOrder(db, input), createOrder(db, input)]);
    expect(new Set([a.orderId, b.orderId, c.orderId]).size).toBe(1);
    expect([a, b, c].filter((r) => !r.duplicate)).toHaveLength(1);
    expect(await db.order.count()).toBe(1);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variants["black/S"] } })).stock).toBe(4);
  });

  it("rejects out-of-stock, inactive and unpublished variants without side effects", async () => {
    const { variants, product } = await seedProduct();
    const city = await seedCity();
    await expect(createOrder(db, { lines: [{ variantId: variants["rose/M"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 })).rejects.toBeInstanceOf(StockError);
    // second line fails → first line's decrement must roll back
    await expect(
      createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 1 }, { variantId: variants["rose/L"], quantity: 5 }], customer: customer(city.id), shippingFee: 0 }),
    ).rejects.toBeInstanceOf(StockError);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variants["black/S"] } })).stock).toBe(5);

    await db.productVariant.update({ where: { id: variants["black/M"] }, data: { isActive: false } });
    await expect(createOrder(db, { lines: [{ variantId: variants["black/M"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 })).rejects.toBeInstanceOf(StockError);

    await db.product.update({ where: { id: product.id }, data: { status: "DRAFT" } });
    await expect(createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 })).rejects.toBeInstanceOf(StockError);
    expect(await db.order.count()).toBe(0);
  });

  it("rejects inactive cities and invalid quantities", async () => {
    const { variants } = await seedProduct();
    const city = await seedCity();
    await db.city.update({ where: { id: city.id }, data: { isActive: false } });
    await expect(createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 })).rejects.toThrow("مدينة");
    const ok = await seedCity();
    await expect(createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 0 }], customer: customer(ok.id), shippingFee: 0 })).rejects.toThrow();
    await expect(createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 21 }], customer: customer(ok.id), shippingFee: 0 })).rejects.toThrow();
  });
});

describe("stock transactions (no overselling)", () => {
  it("never oversells under concurrent checkouts", async () => {
    const { variants } = await seedProduct({ stock: { "black/S": 3 } });
    const city = await seedCity();
    const attempts = Array.from({ length: 8 }, () =>
      createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 1 }], customer: customer(city.id), shippingFee: 0, idempotencyKey: randomUUID() }).then(
        () => "ok",
        (e) => (e instanceof StockError ? "out" : Promise.reject(e)),
      ),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((r) => r === "ok")).toHaveLength(3);
    expect(results.filter((r) => r === "out")).toHaveLength(5);
    const v = await db.productVariant.findUniqueOrThrow({ where: { id: variants["black/S"] } });
    expect(v.stock).toBe(0);
    expect(await db.order.count()).toBe(3);
  });

  it("handles multi-line orders competing for the same stock", async () => {
    const { variants } = await seedProduct({ stock: { "black/S": 2, "rose/L": 2 } });
    const city = await seedCity();
    const lines = [
      { variantId: variants["rose/L"], quantity: 1 },
      { variantId: variants["black/S"], quantity: 1 },
    ];
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => createOrder(db, { lines, customer: customer(city.id), shippingFee: 0 })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    const stocks = await db.productVariant.findMany({ where: { id: { in: Object.values(variants) } } });
    expect(stocks.every((s) => s.stock === 0)).toBe(true);
  });
});
