/**
 * Creates (or promotes / resets) an admin account securely.
 *
 *   npm run admin:create -- --email owner@example.com --name "Owner"
 *
 * The password is asked interactively (hidden) unless ADMIN_PASSWORD is set in the
 * environment (useful for CI). It is hashed with argon2id; it is never logged.
 * Add --reset to change the password of an existing account.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createInterface } from "node:readline";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    let muted = false;
    out._writeToOutput = (s: string) => {
      if (!muted) out.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = (arg("name") ?? process.env.ADMIN_NAME ?? "Admin").trim();
  const reset = process.argv.includes("--reset");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Provide a valid --email");

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await askHidden("Admin password (min 12 chars): ");
    const again = await askHidden("Repeat password: ");
    if (password !== again) throw new Error("Passwords do not match");
  }
  if (password.length < 12) throw new Error("Password must be at least 12 characters");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", isActive: true, ...(reset ? { passwordHash: await hashPassword(password) } : {}) },
      });
      if (reset) await prisma.session.deleteMany({ where: { userId: existing.id } });
      console.log(`✔ ${email} is now an ADMIN${reset ? " (password reset, sessions revoked)" : " (password unchanged; use --reset to change it)"}`);
    } else {
      await prisma.user.create({ data: { email, name, role: "ADMIN", passwordHash: await hashPassword(password) } });
      console.log(`✔ Admin ${email} created`);
    }
    await prisma.auditLog.create({ data: { action: existing ? "admin.promote" : "admin.create", entity: "User", entityId: email } });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("✖", e instanceof Error ? e.message : e);
  process.exit(1);
});
