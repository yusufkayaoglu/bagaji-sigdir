import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { browserName: 'chromium', channel: 'msedge', viewport: { width: 390, height: 844 }, baseURL: 'http://127.0.0.1:5174' },
  webServer: { command: 'npm.cmd run dev', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
});
