import type { Locator, Page } from '@playwright/test';

export class ProductDetailsPage {
  private readonly name: Locator;
  private readonly price: Locator;

  constructor(private readonly page: Page) {
    this.name = page.locator('[data-test="inventory-item-name"]');
    this.price = page.locator('[data-test="inventory-item-price"]');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.name.waitFor();
    await this.price.waitFor();
  }

  async getName(): Promise<string> { return (await this.name.innerText()).trim(); }
  async getPrice(): Promise<string> { return (await this.price.innerText()).trim(); }
}
