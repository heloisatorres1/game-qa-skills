import { defineConfig, devices } from '@playwright/test';

// Each test title starts with its case ID from ../test-cases.md and carries a
// tag for its CI stage (@push, @pr, @nightly).
// Locally, PW_CHANNEL=msedge uses the installed Edge instead of a downloaded browser.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }], ['github']]
    : [['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }], ['list']],
  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
