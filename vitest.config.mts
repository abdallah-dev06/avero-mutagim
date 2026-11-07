import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Tests run against a dedicated PostgreSQL database (see .env.test) — never the dev/prod DB.
const env = config({ path: ".env.test" }).parsed ?? {};

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    env,
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts"],
  },
});
