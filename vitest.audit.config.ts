import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Separate config: the audit reads a frozen snapshot and writes docs/audit/*. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["audit/**/*.audit.ts"], testTimeout: 120_000 },
});
