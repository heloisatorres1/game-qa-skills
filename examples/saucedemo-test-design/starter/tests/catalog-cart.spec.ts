import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('TC-CAT-001 product list shows all 6 products with the right prices', { tag: '@push' }, async ({ page }) => {
  await login(page);
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText([
    'Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt',
    'Sauce Labs Fleece Jacket', 'Sauce Labs Onesie', 'Test.allTheThings() T-Shirt (Red)',
  ]);
  await expect(page.locator('[data-test="inventory-item-price"]')).toHaveText(['$29.99', '$9.99', '$15.99', '$49.99', '$7.99', '$15.99']);
});

test('TC-CART-001 adding one product shows 1 on the badge and a Remove button', { tag: '@push' }, async ({ page }) => {
  await login(page);
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toHaveText('Remove');
});

test('TC-CART-002 removing a product from the cart page updates the list and the badge', { tag: '@pr' }, async ({ page }) => {
  await login(page);
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('[data-test="add-to-cart-sauce-labs-bike-light"]').click();
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.locator('[data-test="remove-sauce-labs-bike-light"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Backpack']);
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
});
