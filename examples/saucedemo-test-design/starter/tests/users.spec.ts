import { test, expect } from '@playwright/test';
import { login, fillCheckout } from './helpers';

// TC-USERS-001 and TC-USERS-002: the same purchase as TC-CO-001 with other user types.
// Equivalence partitioning: each user type is one class of valid input.
const users = [
  { id: 'TC-USERS-001', user: 'problem_user' },
  { id: 'TC-USERS-002', user: 'error_user' },
];

for (const { id, user } of users) {
  test(`${id} ${user} can buy two products with correct items and totals`, { tag: '@nightly' }, async ({ page }) => {
    await login(page, user);
    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
    await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');

    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await fillCheckout(page);
    await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $43.18');

    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
  });
}
