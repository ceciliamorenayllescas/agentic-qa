import type { Page } from '@playwright/test';
import { InventoryPage } from '../pages/InventoryPage.js';
import { LoginPage } from '../pages/LoginPage.js';

export async function loginAsStandardUser(page: Page): Promise<InventoryPage> {
  const username = process.env.TEST_STANDARD_USER_USERNAME;
  const password = process.env.TEST_STANDARD_USER_PASSWORD;
  if (!username || !password) throw new Error('Requires TEST_STANDARD_USER_USERNAME and TEST_STANDARD_USER_PASSWORD');
  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);
  await login.navigate();
  await login.login(username, password);
  await page.waitForURL(/inventory\.html$/);
  await inventory.waitUntilLoaded();
  return inventory;
}
