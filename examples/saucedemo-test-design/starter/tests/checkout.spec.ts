import { test, expect } from '@playwright/test';
import { login, fillCheckout } from './helpers';

test('TC-CO-001 buying two products shows the right totals and completes the order', { tag: '@push' }, async ({ page }) => {
  // 1. Log in and add two products
  await login(page);
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();

  // 2. Check out
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await fillCheckout(page);

  // 3. Check the totals: money is the risk
  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $39.98');
  await expect(page.locator('[data-test="tax-label"]')).toHaveText('Tax: $3.20');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $43.18');

  // 4. Finish, then check the order is done and the cart is empty
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('Thank you for your order!')).toBeVisible();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
});

test('TC-CO-002 buying all 6 products shows the right totals', { tag: '@pr' }, async ({ page }) => {
  await login(page);
  // Each click turns one "Add to cart" into "Remove", so always click the first one left.
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('6');
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await fillCheckout(page);
  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $129.94');
  await expect(page.locator('[data-test="tax-label"]')).toHaveText('Tax: $10.40');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $140.34');
});
