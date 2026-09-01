import type { Locator, Page } from '@playwright/test';

export class CartPage {
  private readonly items: Locator;
  constructor(private readonly page: Page) { this.items = page.locator('[data-test="inventory-item"]'); }
  async waitUntilLoaded(): Promise<void> { await this.page.getByText('Your Cart', { exact: true }).waitFor(); }
  async clear(): Promise<void> {
    const removeButtons = this.page.getByRole('button', { name: 'Remove' });
    while ((await removeButtons.count()) > 0) await removeButtons.first().click();
  }
  async continueShopping(): Promise<void> { await this.page.getByRole('button', { name: 'Continue Shopping' }).click(); }
  async getProductNames(): Promise<string[]> {
    return (await this.page.locator('[data-test="inventory-item-name"]').allTextContents()).map((value) => value.trim());
  }
  async getProductSnapshots(): Promise<{ name: string }[]> { return (await this.getProductNames()).map((name) => ({ name })); }
  async getProductQuantity(productName: string): Promise<number> {
    const item = this.items.filter({ hasText: productName }).first();
    return Number(await item.locator('[data-test="item-quantity"]').innerText());
  }
  async removeProductByName(productName: string): Promise<void> {
    const item = this.items.filter({ hasText: productName }).first();
    await item.getByRole('button', { name: 'Remove' }).click();
  }
  async startCheckout(): Promise<void> { await this.page.getByRole('button', { name: 'Checkout' }).click(); }
}
