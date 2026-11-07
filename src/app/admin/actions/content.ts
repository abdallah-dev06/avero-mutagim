"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALL_STATUSES } from "@/lib/order-status";
import { normalizePhone } from "@/lib/phone";
import { saveSettings } from "@/lib/settings";
import { siteSettingsSchema } from "@/lib/settings-schema";
import { slugify } from "@/lib/utils";
import { DomainError, isUniqueViolation, publicMessage } from "@/server/errors";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function refreshAll() {
  revalidatePath("/", "layout");
}

/* ───────── WhatsApp templates ───────── */
export async function saveWhatsAppTemplate(status: string, body: string): Promise<R> {
  try {
    const user = await requireStaff();
    if (!ALL_STATUSES.includes(status as OrderStatus)) throw new DomainError("حالة غير صالحة");
    const text = String(body).trim();
    if (text.length < 5 || text.length > 1500) throw new DomainError("نص الرسالة يجب أن يكون بين 5 و1500 حرف");
    await prisma.whatsAppTemplate.upsert({ where: { status: status as OrderStatus }, create: { status: status as OrderStatus, body: text }, update: { body: text } });
    await audit({ actorId: user.id, action: "whatsapp.template.update", entity: "WhatsAppTemplate", entityId: status });
    revalidatePath("/admin/whatsapp");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

/* ───────── Site settings ───────── */
export async function saveSiteSettings(raw: unknown): Promise<R> {
  try {
    const user = await requireStaff({ adminOnly: true });
    const parsed = siteSettingsSchema.safeParse(raw);
    if (!parsed.success) throw new DomainError(`بيانات غير صالحة: ${parsed.error.issues[0]?.path.join(".")} — ${parsed.error.issues[0]?.message}`);
    const s = parsed.data;
    if (s.business.whatsappNumber) {
      const p = normalizePhone(s.business.whatsappNumber);
      if (!p) throw new DomainError("رقم واتساب المتجر غير صحيح");
      s.business.whatsappNumber = p;
    }
    for (const url of [s.business.instagramUrl, s.business.facebookUrl]) {
      if (url && !/^https:\/\//.test(url)) throw new DomainError("الروابط يجب أن تبدأ بـ https://");
    }
    for (const href of [s.hero.primaryCta.href, s.hero.secondaryCta.href]) {
      if (!href.startsWith("/") && !href.startsWith("https://")) throw new DomainError("روابط الأزرار يجب أن تبدأ بـ / أو https://");
    }
    await saveSettings(s);
    await audit({ actorId: user.id, action: "settings.update", entity: "Setting", entityId: "site" });
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

/* ───────── Testimonials (real reviews only) ───────── */
const testimonialSchema = z.object({ id: z.string().optional(), name: z.string().trim().min(1).max(60), city: z.string().trim().max(60).optional(), text: z.string().trim().min(3).max(500), rating: z.number().int().min(1).max(5), isActive: z.boolean() });
export async function saveTestimonial(raw: unknown): Promise<R> {
  try {
    const user = await requireStaff();
    const d = testimonialSchema.parse(raw);
    const data = { name: d.name, city: d.city || null, text: d.text, rating: d.rating, isActive: d.isActive };
    if (d.id) await prisma.testimonial.update({ where: { id: d.id }, data });
    else await prisma.testimonial.create({ data });
    await audit({ actorId: user.id, action: "testimonial.save", entity: "Testimonial", entityId: d.id ?? null });
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}
export async function deleteTestimonial(id: string): Promise<R> {
  try {
    const user = await requireStaff();
    await prisma.testimonial.delete({ where: { id } });
    await audit({ actorId: user.id, action: "testimonial.delete", entity: "Testimonial", entityId: id });
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

/* ───────── Cities & areas ───────── */
export async function saveCity(input: { id?: string; name: string; isActive: boolean; sortOrder?: number }): Promise<R> {
  try {
    const user = await requireStaff();
    const name = String(input.name).trim().slice(0, 60);
    if (!name) throw new DomainError("اسم المدينة مطلوب");
    if (input.id) await prisma.city.update({ where: { id: input.id }, data: { name, isActive: !!input.isActive, sortOrder: input.sortOrder ?? undefined } });
    else {
      const max = await prisma.city.aggregate({ _max: { sortOrder: true } });
      await prisma.city.create({ data: { name, isActive: !!input.isActive, sortOrder: (max._max.sortOrder ?? 0) + 1, areas: { create: { name: "منطقة أخرى", sortOrder: 99 } } } });
    }
    await audit({ actorId: user.id, action: "city.save", entity: "City", entityId: input.id ?? name });
    revalidatePath("/admin/delivery");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: isUniqueViolation(e) ? "هذه المدينة موجودة مسبقاً" : publicMessage(e) };
  }
}

export async function saveArea(input: { id?: string; cityId: string; name: string; isActive: boolean }): Promise<R> {
  try {
    const user = await requireStaff();
    const name = String(input.name).trim().slice(0, 60);
    if (!name) throw new DomainError("اسم المنطقة مطلوب");
    if (input.id) await prisma.area.update({ where: { id: input.id }, data: { name, isActive: !!input.isActive } });
    else {
      const max = await prisma.area.aggregate({ where: { cityId: input.cityId }, _max: { sortOrder: true } });
      await prisma.area.create({ data: { cityId: input.cityId, name, isActive: true, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
    }
    await audit({ actorId: user.id, action: "area.save", entity: "Area", entityId: input.id ?? name });
    revalidatePath("/admin/delivery");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: isUniqueViolation(e) ? "هذه المنطقة موجودة مسبقاً" : publicMessage(e) };
  }
}

/* ───────── Categories & collections ───────── */
const catSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["category", "collection"]),
  name: z.string().trim().min(1).max(60),
  nameEn: z.string().trim().max(60).optional(),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  sizeChartId: z.string().optional(),
});

export async function saveCategory(raw: unknown): Promise<R> {
  try {
    const user = await requireStaff();
    const d = catSchema.parse(raw);
    const slug = slugify(d.slug || d.nameEn || d.name);
    const base = {
      name: d.name,
      nameEn: d.nameEn || null,
      slug,
      description: d.description || null,
      imageUrl: d.imageUrl || null,
      isActive: d.isActive,
      sortOrder: d.sortOrder ?? 0,
    };
    if (d.kind === "category") {
      const data = { ...base, isFeatured: d.isFeatured ?? true, sizeChartId: d.sizeChartId || null };
      if (d.id) await prisma.category.update({ where: { id: d.id }, data });
      else await prisma.category.create({ data });
    } else {
      if (d.id) await prisma.collection.update({ where: { id: d.id }, data: base });
      else await prisma.collection.create({ data: base });
    }
    await audit({ actorId: user.id, action: `${d.kind}.save`, entity: d.kind, entityId: d.id ?? slug });
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: isUniqueViolation(e) ? "الرابط (slug) مستخدم مسبقاً" : publicMessage(e) };
  }
}

/* ───────── Size charts ───────── */
const chartSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional(),
  measurementType: z.enum(["BODY", "GARMENT"]),
  isDefault: z.boolean(),
  rows: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(12),
        euSize: z.string().trim().max(8).optional(),
        bustCm: z.number().int().min(30).max(250).nullable(),
        waistCm: z.number().int().min(30).max(250).nullable(),
        hipsCm: z.number().int().min(30).max(250).nullable(),
      }),
    )
    .min(1)
    .max(40),
});

export async function saveSizeChart(raw: unknown): Promise<R<{ id: string }>> {
  try {
    const user = await requireStaff();
    const parsed = chartSchema.safeParse(raw);
    if (!parsed.success) throw new DomainError("تحققي من قيم الجدول (أرقام بالسنتيمتر بين 30 و250)");
    const d = parsed.data;
    const id = await prisma.$transaction(async (tx) => {
      if (d.isDefault) await tx.sizeChart.updateMany({ where: { isDefault: true, ...(d.id ? { id: { not: d.id } } : {}) }, data: { isDefault: false } });
      const data = { name: d.name, description: d.description || null, measurementType: d.measurementType, isDefault: d.isDefault };
      const chart = d.id ? await tx.sizeChart.update({ where: { id: d.id }, data }) : await tx.sizeChart.create({ data });
      await tx.sizeChartRow.deleteMany({ where: { chartId: chart.id } });
      await tx.sizeChartRow.createMany({ data: d.rows.map((r, i) => ({ chartId: chart.id, label: r.label.toUpperCase(), euSize: r.euSize || null, bustCm: r.bustCm, waistCm: r.waistCm, hipsCm: r.hipsCm, sortOrder: i })) });
      return chart.id;
    });
    await audit({ actorId: user.id, action: "sizechart.save", entity: "SizeChart", entityId: id });
    refreshAll();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}

export async function deleteSizeChart(id: string): Promise<R> {
  try {
    const user = await requireStaff({ adminOnly: true });
    const chart = await prisma.sizeChart.findUnique({ where: { id } });
    if (!chart) throw new DomainError("غير موجود");
    if (chart.isDefault) throw new DomainError("لا يمكن حذف الجدول الافتراضي — عيّني جدولاً آخر كافتراضي أولاً");
    await prisma.sizeChart.delete({ where: { id } });
    await audit({ actorId: user.id, action: "sizechart.delete", entity: "SizeChart", entityId: id });
    refreshAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: publicMessage(e) };
  }
}
