import { test as base, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { ProductDetailsPage } from '../pages/ProductDetailsPage.js';

export interface TestCredentials { username: string; password: string; }
export interface AppFixtures {
  credentials: TestCredentials; invalidCredentials: TestCredentials; blockedUserCredentials: TestCredentials;
  optionalCredentials: TestCredentials | undefined; optionalInvalidCredentials: TestCredentials | undefined;
  loginPage: LoginPage; inventoryPage: InventoryPage; cartPage: CartPage;
  checkoutPage: CheckoutPage; authenticatedInventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
}
function readCredentials(usernameKeys: string[], passwordKeys: string[], description: string): TestCredentials {
  const username = usernameKeys.map((key) => process.env[key]).find(Boolean);
  const password = passwordKeys.map((key) => process.env[key]).find(Boolean);
  if (!username || !password) throw new Error(`Set ${description} username and password environment variables.`);
  return { username, password };
}
function readOptionalCredentials(usernameKeys: string[], passwordKeys: string[]): TestCredentials | undefined {
  const username = usernameKeys.map((key) => process.env[key]).find(Boolean);
  const password = passwordKeys.map((key) => process.env[key]).find(Boolean);
  return username && password ? { username, password } : undefined;
}
export const test = base.extend<AppFixtures>({
  credentials: async ({}, use) => {
    await use(readCredentials(
      ['TEST_STANDARD_USER_USERNAME', 'TEST_USERNAME'],
      ['TEST_STANDARD_USER_PASSWORD', 'TEST_PASSWORD'],
      'TEST_STANDARD_USER_USERNAME/TEST_STANDARD_USER_PASSWORD or TEST_USERNAME/TEST_PASSWORD',
    ));
  },
  invalidCredentials: async ({}, use) => {
    await use(readCredentials(
      ['TEST_INVALID_USER_USERNAME', 'TEST_REJECTED_USER_USERNAME'],
      ['TEST_INVALID_USER_PASSWORD', 'TEST_REJECTED_USER_PASSWORD'],
      'TEST_INVALID_USER_USERNAME/TEST_INVALID_USER_PASSWORD or TEST_REJECTED_USER_USERNAME/TEST_REJECTED_USER_PASSWORD',
    ));
  },
  blockedUserCredentials: async ({}, use) => {
    await use(readCredentials(
      ['TEST_BLOCKED_USER_USERNAME', 'TEST_LOCKED_USER_USERNAME'],
      ['TEST_BLOCKED_USER_PASSWORD', 'TEST_LOCKED_USER_PASSWORD'],
      'TEST_BLOCKED_USER_USERNAME/TEST_BLOCKED_USER_PASSWORD or TEST_LOCKED_USER_USERNAME/TEST_LOCKED_USER_PASSWORD',
    ));
  },
  optionalCredentials: async ({}, use) => {
    await use(readOptionalCredentials(
      ['TEST_STANDARD_USER_USERNAME', 'TEST_USERNAME'],
      ['TEST_STANDARD_USER_PASSWORD', 'TEST_PASSWORD'],
    ));
  },
  optionalInvalidCredentials: async ({}, use) => {
    await use(readOptionalCredentials(
      ['TEST_INVALID_USER_USERNAME', 'TEST_REJECTED_USER_USERNAME'],
      ['TEST_INVALID_USER_PASSWORD', 'TEST_REJECTED_USER_PASSWORD'],
    ));
  },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  inventoryPage: async ({ page }, use) => { await use(new InventoryPage(page)); },
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
  checkoutPage: async ({ page }, use) => { await use(new CheckoutPage(page)); },
  productDetailsPage: async ({ page }, use) => { await use(new ProductDetailsPage(page)); },
  authenticatedInventoryPage: async ({ loginPage, credentials, inventoryPage }, use) => {
    await loginPage.navigate(); await loginPage.login(credentials.username, credentials.password);
    await inventoryPage.waitUntilLoaded(); await use(inventoryPage);
  },
});
export { expect };
