import { test, expect, Page } from '@playwright/test';
import { login, PASSWORD } from './helpers';

const error = (page: Page) => page.locator('[data-test="error"]');

test('TC-LOGIN-001 standard user logs in and sees the product list', { tag: '@push' }, async ({ page }) => {
  await login(page);
  await expect(page.getByText('Products')).toBeVisible();
  await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(6);
});

test('TC-LOGIN-004 wrong password is refused with a clear message', { tag: '@pr' }, async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('wrong_pass');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(error(page)).toHaveText('Epic sadface: Username and password do not match any user in this service');
  await expect(page).toHaveURL('/');
});

test('TC-LOGIN-006 locked-out user cannot log in and is told why', { tag: '@pr' }, async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill('locked_out_user');
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(error(page)).toHaveText('Epic sadface: Sorry, this user has been locked out.');
  await expect(page).toHaveURL('/');
});
