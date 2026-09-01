import type { Locator, Page } from '@playwright/test';
import { chooseUnique, createSeededRandom } from '../helpers/random.js';
import type { ProductSnapshot } from '../helpers/product.js';

export type ProductSort = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  private readonly productCards: Locator;
  constructor(private readonly page: Page) { this.productCards = page.locator('[data-test="inventory-item"]'); }
  async waitUntilLoaded(): Promise<void> {
    await this.page.getByText('Products', { exact: true }).waitFor();
    await this.productCards.first().waitFor();
  }
  async openMenu(): Promise<void> { await this.page.getByRole('button', { name: 'Open Menu' }).click(); }
  async logout(): Promise<void> { await this.page.getByRole('link', { name: 'Logout' }).click(); }
  async sortBy(sort: ProductSort): Promise<void> { await this.page.locator('[data-test="product-sort-container"]').selectOption(sort); }
  async sortByNameAscending(): Promise<void> { await this.sortBy('az'); }
  async sortByNameDescending(): Promise<void> { await this.sortBy('za'); }
  async sortByPriceAscending(): Promise<void> { await this.sortBy('lohi'); }
  async sortByPriceDescending(): Promise<void> { await this.sortBy('hilo'); }
  async getProductNames(): Promise<string[]> {
    return (await this.page.locator('[data-test="inventory-item-name"]').allTextContents()).map((value) => value.trim());
  }
  async getProductPrices(): Promise<string[]> {
    return (await this.page.locator('[data-test="inventory-item-price"]').allTextContents()).map((value) => value.trim());
  }
  async getProductName(index: number): Promise<string> {
    return (await this.productCards.nth(index).locator('[data-test="inventory-item-name"]').innerText()).trim();
  }
  async getProducts(): Promise<ProductSnapshot[]> {
    const names = await this.getProductNames();
    const prices = (await this.getProductPrices()).map((value) => Number(value.replace(/[^0-9.-]+/g, '')));
    return names.map((name, index) => ({ name, price: prices[index] }));
  }
  async selectRandomProducts(count: number): Promise<ProductSnapshot[]> {
    return chooseUnique(await this.getProducts(), count, createSeededRandom());
  }
  async addProductsToCart(products: readonly ProductSnapshot[]): Promise<void> {
    for (const product of products) await this.addProductByName(product.name);
  }
  async addProductToCart(index: number): Promise<string> {
    const product = this.productCards.nth(index);
    const name = (await product.locator('[data-test="inventory-item-name"]').innerText()).trim();
    await product.getByRole('button', { name: 'Add to cart' }).click();
    return name;
  }
  async addProductByName(name: string): Promise<void> {
    const product = this.productCards.filter({ hasText: name }).first();
    await product.getByRole('button', { name: 'Add to cart' }).click();
  }
  async openCart(): Promise<void> { await this.page.locator('[data-test="shopping-cart-link"]').click(); }
  async addFirstProductToCart(): Promise<string> { return this.addProductToCart(0); }
  async addSecondProductToCart(): Promise<string> { return this.addProductToCart(1); }
  async cartBadgeCount(): Promise<number> {
    const badge = this.page.locator('[data-test="shopping-cart-badge"]');
    return (await badge.count()) === 0 ? 0 : Number(await badge.innerText());
  }
}
