import { Page, expect } from '@playwright/test';

export const PASSWORD = 'secret_sauce';
export const CUSTOMER = { first: 'Ana', last: 'Silva', zip: '86000' };

// Shared by many tests: log in and wait for the product list.
export async function login(page: Page, user = 'standard_user') {
  await page.goto('/');
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/inventory\.html/);
}

// Fill checkout step one and continue to step two.
export async function fillCheckout(page: Page) {
  await page.getByPlaceholder('First Name').fill(CUSTOMER.first);
  await page.getByPlaceholder('Last Name').fill(CUSTOMER.last);
  await page.getByPlaceholder('Zip/Postal Code').fill(CUSTOMER.zip);
  await page.getByRole('button', { name: 'Continue' }).click();
}
