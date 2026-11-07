export class DomainError extends Error {
  constructor(
    message: string,
    public code: string = "DOMAIN",
  ) {
    super(message);
  }
}

export class StockError extends DomainError {
  constructor(
    message: string,
    public variantId: string,
  ) {
    super(message, "OUT_OF_STOCK");
  }
}

export function isUniqueViolation(e: unknown, field?: string) {
  if (!e || typeof e !== "object" || (e as { code?: string }).code !== "P2002") return false;
  if (!field) return true;
  const meta = (e as { meta?: unknown }).meta;
  return JSON.stringify(meta ?? {}).includes(field);
}

/** Converts unknown errors into a safe Arabic message for the UI (no internals leaked). */
export function publicMessage(e: unknown, fallback = "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى") {
  if (e instanceof DomainError) return e.message;
  if (e && typeof e === "object" && "message" in e && (e as Error).name === "AuthError") return (e as Error).message;
  console.error(e);
  return fallback;
}
