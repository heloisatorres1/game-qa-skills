import { test, expect } from '@playwright/test';
import { login } from './helpers';

const LOGGED_OUT_MESSAGE = "Epic sadface: You can only access '/inventory.html' when you are logged in.";

test('TC-SESSION-001 product page while logged out returns to login with a message', { tag: '@pr' }, async ({ page }) => {
  await page.goto('/inventory.html');
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-test="error"]')).toHaveText(LOGGED_OUT_MESSAGE);
});

test('TC-SESSION-003 logout from the menu returns to the login page', { tag: '@pr' }, async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.locator('[data-test="logout-sidebar-link"]').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('TC-SESSION-004 browser Back after logout does not show private pages', { tag: '@pr' }, async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.locator('[data-test="logout-sidebar-link"]').click();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-test="error"]')).toHaveText(LOGGED_OUT_MESSAGE);
  await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(0);
});
