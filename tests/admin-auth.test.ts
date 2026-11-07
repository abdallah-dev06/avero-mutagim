import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "@/lib/crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { customer, db, resetDb, seedCity, seedProduct } from "./helpers";

// ── Minimal request-context mocks for Server Actions ──
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) => (jar.has(k) ? { name: k, value: jar.get(k)! } : undefined),
    set: (k: string, v: string) => void jar.set(k, v),
    delete: (k: string) => void jar.delete(k),
    has: (k: string) => jar.has(k),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "10.0.0.1", "user-agent": "vitest" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw Object.assign(new Error(`REDIRECT:${to}`), { digest: `NEXT_REDIRECT;${to}` });
  },
}));

const { requireStaff, getCurrentUser } = await import("@/lib/auth");
const { updateOrderStatus, createManualOrder } = await import("@/app/admin/actions/orders");
const { saveSiteSettings } = await import("@/app/admin/actions/content");
const { adminLogin } = await import("@/app/admin/login/actions");
const { DEFAULT_SETTINGS } = await import("@/lib/settings-schema");

async function signInAs(role: "ADMIN" | "STAFF" | "CUSTOMER") {
  const user = await db.user.create({ data: { email: `${role.toLowerCase()}-${Math.random()}@t.test`, name: role, role, passwordHash: await hashPassword("correct horse battery") } });
  const token = `tok-${Math.random()}`;
  await db.session.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 3600_000) } });
  jar.set("vb_session", token);
  return user;
}

beforeEach(async () => {
  jar.clear();
  await resetDb();
});
afterAll(() => db.$disconnect());

describe("admin authorization", () => {
  it("rejects anonymous users and customers", async () => {
    await expect(requireStaff()).rejects.toThrow("غير مصرّح");
    await signInAs("CUSTOMER");
    await expect(requireStaff()).rejects.toThrow("غير مصرّح");
  });

  it("accepts staff, and restricts admin-only operations", async () => {
    await signInAs("STAFF");
    await expect(requireStaff()).resolves.toMatchObject({ role: "STAFF" });
    await expect(requireStaff({ adminOnly: true })).rejects.toThrow("للمدير فقط");
    const res = await saveSiteSettings(DEFAULT_SETTINGS);
    expect(res.ok).toBe(false);
  });

  it("rejects expired sessions", async () => {
    const u = await signInAs("ADMIN");
    await db.session.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getCurrentUser()).toBeNull();
  });

  it("protects sensitive server actions", async () => {
    const { variants } = await seedProduct();
    const city = await seedCity();
    const { createOrder } = await import("@/server/orders");
    const order = await createOrder(db, { lines: [{ variantId: variants["black/S"], quantity: 1 }], customer: customer(city.id), shippingFee: 0 });

    // anonymous
    const denied = await updateOrderStatus({ orderId: order.orderId, to: "CONFIRMED" });
    expect(denied).toMatchObject({ ok: false });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.orderId } })).status).toBe("NEW");
    const manualDenied = await createManualOrder({});
    expect(manualDenied.ok).toBe(false);

    // customer
    await signInAs("CUSTOMER");
    expect((await updateOrderStatus({ orderId: order.orderId, to: "CONFIRMED" })).ok).toBe(false);

    // admin
    await signInAs("ADMIN");
    const ok = await updateOrderStatus({ orderId: order.orderId, to: "CONFIRMED" });
    expect(ok).toMatchObject({ ok: true });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.orderId } })).status).toBe("CONFIRMED");
    expect(await db.auditLog.count({ where: { action: "order.status" } })).toBe(1);
  });
});

describe("admin login", () => {
  it("hashes passwords with argon2id", async () => {
    const h = await hashPassword("s3cret-password!");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "s3cret-password!")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
  });

  it("rate-limits repeated failures and never logs customers into admin", async () => {
    const admin = await db.user.create({ data: { email: "boss@t.test", name: "Boss", role: "ADMIN", passwordHash: await hashPassword("right-password-123") } });
    await db.user.create({ data: { email: "cust@t.test", name: "C", role: "CUSTOMER", passwordHash: await hashPassword("right-password-123") } });
    const fd = (email: string, password: string) => {
      const f = new FormData();
      f.set("email", email);
      f.set("password", password);
      return f;
    };
    expect(await adminLogin(undefined, fd("cust@t.test", "right-password-123"))).toMatchObject({ error: expect.any(String) });
    for (let i = 0; i < 5; i++) expect(await adminLogin(undefined, fd("boss@t.test", "nope"))).toMatchObject({ error: "بيانات الدخول غير صحيحة" });
    // even the correct password is blocked now
    const blocked = await adminLogin(undefined, fd("boss@t.test", "right-password-123"));
    expect(blocked?.error).toContain("إيقاف");
    expect(await db.session.count({ where: { userId: admin.id } })).toBe(0);
  });

  it("creates a server-side session on success", async () => {
    const admin = await db.user.create({ data: { email: "ok@t.test", name: "OK", role: "ADMIN", passwordHash: await hashPassword("right-password-123") } });
    const f = new FormData();
    f.set("email", "ok@t.test");
    f.set("password", "right-password-123");
    await expect(adminLogin(undefined, f)).rejects.toThrow("REDIRECT:/admin");
    const token = jar.get("vb_session")!;
    expect(token).toBeTruthy();
    const session = await db.session.findUniqueOrThrow({ where: { id: sha256(token) } });
    expect(session.userId).toBe(admin.id); // raw token is never stored
  });
});
