import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS, siteSettingsSchema, type SiteSettings } from "@/lib/settings-schema";

const KEY = "site";

function merge(stored: unknown): SiteSettings {
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
  const s = stored as Record<string, unknown>;
  const merged: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    merged[k] = { ...(v as object), ...((s[k] as object) ?? {}) };
  }
  const parsed = siteSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return merge(row?.value);
});

export async function saveSettings(next: SiteSettings) {
  const value = siteSettingsSchema.parse(next);
  await prisma.setting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  return value;
}
