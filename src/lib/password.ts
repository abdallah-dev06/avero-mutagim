import { hash, verify } from "@node-rs/argon2";

const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const; // OWASP argon2id baseline

export function hashPassword(password: string) {
  return hash(password, OPTS);
}

export async function verifyPassword(hashStr: string, password: string) {
  try {
    return await verify(hashStr, password);
  } catch {
    return false;
  }
}

// Constant-ish work when user does not exist, to avoid user enumeration by timing.
let dummy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummy ??= hash("vetrina-dummy-password", OPTS);
  await verifyPassword(await dummy, password);
}
