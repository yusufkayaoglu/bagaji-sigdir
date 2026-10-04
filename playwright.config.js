import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    browserName: "chromium",
    channel: process.env.CI ? undefined : "msedge",
    viewport: { width: 390, height: 844 },
    baseURL: "http://127.0.0.1:5174",
  },
  webServer: {
    command: process.platform === "win32" ? "npm.cmd run dev" : "npm run dev",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
  },
});
