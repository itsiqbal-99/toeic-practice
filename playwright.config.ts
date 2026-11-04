import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
const browsers = path.resolve(".rebuild/browsers");
if (existsSync(browsers) && !process.env.PLAYWRIGHT_BROWSERS_PATH)
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsers;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/dev.mjs",
    url: "http://127.0.0.1:3000/api/v1/health",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      WEB_ORIGIN: "http://127.0.0.1:3000",
      PORT: "4001",
      API_INTERNAL_URL: "http://127.0.0.1:4001",
      LOCAL_DB_PORT: "5435",
      LOCAL_DB_PATH: ".rebuild/e2e-db",
      DATABASE_URL: "",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
