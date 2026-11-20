import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "أدخل رقم هاتف صحيح")
  .max(20, "أدخل رقم هاتف صحيح")
  .refine((v) => normalizePhone(v) !== null, "رقم الهاتف غير صحيح — مثال: 0599 123 456");

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "يرجى كتابة الاسم الكامل").max(80, "الاسم طويل جداً"),
  phone: phoneSchema,
  cityId: z.string().min(1, "يرجى اختيار المدينة"),
  areaName: z.string().trim().min(1, "يرجى اختيار المنطقة").max(80),
  addressLine: z.string().trim().min(4, "يرجى كتابة العنوان بالتفصيل (الشارع، معلم قريب…)").max(240, "العنوان طويل جداً"),
  note: z.string().trim().max(500, "الملاحظة طويلة جداً").optional().or(z.literal("")),
  whatsappOptIn: z.boolean().optional(),
  idempotencyKey: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح").max(120),
  password: z.string().min(1, "أدخل كلمة المرور").max(200),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "يرجى كتابة الاسم").max(80),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح").max(120),
  phone: phoneSchema.optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(200),
});

export const trackSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^VB-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "رقم الطلب بصيغة VB-XXXX-XXXX"),
  phone: phoneSchema,
});
