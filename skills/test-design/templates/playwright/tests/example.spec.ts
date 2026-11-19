import { test, expect } from '@playwright/test';

// One test per approved case. The title starts with the case ID.
// Steps as comments first, then code: the test reads like the manual case.
test('TC-LOGIN-001 standard user logs in and sees the product list', { tag: '@push' }, async ({ page }) => {
  // 1. Open the site
  await page.goto('/');

  // 2. Log in
  await page.getByPlaceholder('Username').fill('standard_user');
  await page.getByPlaceholder('Password').fill('secret_sauce');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. Check the result
  await expect(page).toHaveURL(/inventory/);
  await expect(page.getByText('Products')).toBeVisible();
});

// A known bug: the test documents the right behaviour and is expected to fail
// until the bug is fixed. Link the bug report in the reason.
// test('TC-CART-007 ...', async ({ page }) => {
//   test.fail(true, 'BUG-012: badge shows 0 after removing the last item');
//   ...
// });
