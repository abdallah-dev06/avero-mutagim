import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { allowedTransitions, canTransition } from "@/lib/order-status";
import { adjustStock } from "@/server/inventory";
import { changeOrderStatus, createOrder, restoreOrderStock } from "@/server/orders";
import { customer, db, resetDb, seedCity, seedProduct } from "./helpers";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

const actor = { id: "admin-test", name: "مديرة" };

async function newOrder(qty = 2) {
  const { variants } = await seedProduct();
  const city = await seedCity();
  const res = await createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: qty }], customer: customer(city.id), shippingFee: 0 });
  return { orderId: res.orderId, variantId: variants["black/S"] };
}
const stockOf = async (id: string) => (await db.productVariant.findUniqueOrThrow({ where: { id } })).stock;

describe("order status transitions", () => {
  it("defines the allowed state machine", () => {
    expect(allowedTransitions("NEW")).toEqual(["CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("DELIVERED", "RETURNED")).toBe(true);
    expect(canTransition("NEW", "RETURNED")).toBe(false);
    expect(canTransition("CONFIRMED", "NEW")).toBe(false);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
    expect(allowedTransitions("RETURNED")).toEqual([]);
  });

  it("updates status, timestamps and timeline", async () => {
    const { orderId } = await newOrder();
    await changeOrderStatus(db, { orderId, to: "CONFIRMED", actor, note: "تم الاتصال" });
    await changeOrderStatus(db, { orderId, to: "DELIVERED", actor });
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { events: { orderBy: { createdAt: "asc" } } } });
    expect(o.status).toBe("DELIVERED");
    expect(o.confirmedAt).not.toBeNull();
    expect(o.deliveredAt).not.toBeNull();
    expect(o.paymentStatus).toBe("UNPAID"); // payment is tracked separately
    expect(o.events.filter((e) => e.type === "STATUS_CHANGE").map((e) => [e.fromStatus, e.toStatus])).toEqual([
      ["NEW", "CONFIRMED"],
      ["CONFIRMED", "DELIVERED"],
    ]);
  });

  it("rejects forbidden transitions", async () => {
    const { orderId } = await newOrder();
    await expect(changeOrderStatus(db, { orderId, to: "RETURNED", actor })).rejects.toThrow("لا يمكن");
    await changeOrderStatus(db, { orderId, to: "CANCELLED", actor });
    await expect(changeOrderStatus(db, { orderId, to: "CONFIRMED", actor })).rejects.toThrow("لا يمكن");
  });

  it("restores stock exactly once on cancellation", async () => {
    const { orderId, variantId } = await newOrder(2);
    expect(await stockOf(variantId)).toBe(3);
    const r = await changeOrderStatus(db, { orderId, to: "CANCELLED", actor });
    expect(r.restored).toBe(true);
    expect(await stockOf(variantId)).toBe(5);
    // A second restoration attempt (e.g. retry / race) is a no-op.
    const again = await db.$transaction((tx) => restoreOrderStock(tx, orderId, "CANCEL_RESTORE", null));
    expect(again).toBe(false);
    expect(await stockOf(variantId)).toBe(5);
    const moves = await db.stockMovement.findMany({ where: { orderId } });
    expect(moves.map((m) => m.reason).sort()).toEqual(["CANCEL_RESTORE", "ORDER"]);
  });

  it("concurrent cancellations restore stock once", async () => {
    const { orderId, variantId } = await newOrder(2);
    const results = await Promise.allSettled([1, 2, 3].map(() => changeOrderStatus(db, { orderId, to: "CANCELLED", actor })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(variantId)).toBe(5);
  });

  it("returns restock only when requested", async () => {
    const a = await newOrder(1);
    await changeOrderStatus(db, { orderId: a.orderId, to: "DELIVERED", actor });
    await changeOrderStatus(db, { orderId: a.orderId, to: "RETURNED", actor, restock: false });
    expect(await stockOf(a.variantId)).toBe(4);

    const b = await newOrder(1);
    await changeOrderStatus(db, { orderId: b.orderId, to: "OUT_FOR_DELIVERY", actor });
    await changeOrderStatus(db, { orderId: b.orderId, to: "RETURNED", actor, restock: true });
    expect(await stockOf(b.variantId)).toBe(5);
  });
});

describe("manual stock adjustment", () => {
  it("adjusts atomically, logs reason, never goes negative", async () => {
    const { variants } = await seedProduct();
    const id = variants["black/M"]; // 3
    await adjustStock(db, { variantId: id, mode: "delta", value: 4, reason: "MANUAL", note: "بضاعة جديدة", actorId: null });
    expect(await stockOf(id)).toBe(7);
    await adjustStock(db, { variantId: id, mode: "set", value: 2, reason: "CORRECTION", note: "جرد", actorId: null });
    expect(await stockOf(id)).toBe(2);
    await expect(adjustStock(db, { variantId: id, mode: "delta", value: -5, reason: "MANUAL", actorId: null })).rejects.toThrow();
    expect(await stockOf(id)).toBe(2);
    const moves = await db.stockMovement.findMany({ where: { variantId: id }, orderBy: { createdAt: "asc" } });
    expect(moves.map((m) => [m.delta, m.stockAfter, m.note])).toEqual([
      [4, 7, "بضاعة جديدة"],
      [-5, 2, "جرد"],
    ]);
  });
});
