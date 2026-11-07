import { execSync } from "node:child_process";
import { config } from "dotenv";

export default function setup() {
  const env = config({ path: ".env.test" }).parsed ?? {};
  if (!env.DATABASE_URL || !/_test\b|test/.test(env.DATABASE_URL)) {
    throw new Error("Refusing to run tests: .env.test DATABASE_URL must point to a *test* database");
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: env.DATABASE_URL } });
}
