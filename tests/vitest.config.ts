import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "./vitest.setup.ts")],
    include: [
      path.resolve(projectRoot, "lib/**/*.test.{ts,tsx}"),
      path.resolve(projectRoot, "tests/contracts/**/*.test.{ts,tsx}")
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "scripts/",
        "vitest.setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/layout.tsx",
        "**/page.tsx",
        "**/loading.tsx",
        "**/error.tsx",
        "**/not-found.tsx",
      ],
    },
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".."),
    },
  },
});
