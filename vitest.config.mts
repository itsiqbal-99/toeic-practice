import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/data/question-bank": path.resolve(
        root,
        "packages/content/src/question-bank.ts",
      ),
      "@/features/test": path.resolve(root, "packages/content/src"),
      "@/config/app": path.resolve(root, "packages/content/src/app.ts"),
      "@": path.resolve(root, "apps/web/src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
    ],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
