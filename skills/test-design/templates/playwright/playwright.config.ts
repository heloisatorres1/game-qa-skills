import { defineConfig, devices } from '@playwright/test';

// Starter config. Each test carries a tag for its CI stage (@push, @pr, @nightly)
// and its case ID in the title, so a result traces back to test-cases.md.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  // Allure instead or as well (only if chosen): npm i -D allure-playwright, then add ['allure-playwright'] above.
  use: {
    baseURL: process.env.BASE_URL || 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
