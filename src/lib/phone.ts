import { parsePhoneNumberFromString } from "libphonenumber-js/max";

/**
 * Normalise a Palestinian (or Israeli-network, used in Jerusalem & 48 areas) phone
 * number to canonical E.164. Returns null when invalid.
 *   "0599 571 202" → "+970599571202"
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "").replace(/^00/, "+");
  const digits = cleaned.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  for (const country of ["PS", "IL"] as const) {
    const p = parsePhoneNumberFromString(digits, country);
    if (p && p.isValid()) return p.number;
  }
  return null;
}

/** Digits only, as required by wa.me links. */
export function waDigits(e164: string) {
  return e164.replace(/\D/g, "");
}

export function displayPhone(e164: string) {
  const p = parsePhoneNumberFromString(e164);
  if (!p) return e164;
  const national = p.formatNational();
  return p.countryCallingCode === "970" || p.countryCallingCode === "972" ? national : p.formatInternational();
}
