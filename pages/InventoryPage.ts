import type { Locator, Page } from '@playwright/test';
import { chooseUnique, createSeededRandom } from '../helpers/random.js';
import type { ProductListingEntry, ProductSnapshot } from '../helpers/product.js';

export type ProductSort = 'az' | 'za' | 'lohi' | 'hilo';
export interface ProductSortOption { value: string; label: string; }

export class InventoryPage {
  private readonly productCards: Locator;
  constructor(private readonly page: Page) { this.productCards = page.locator('[data-test="inventory-item"]'); }
  async waitUntilLoaded(): Promise<void> {
    // The heading text is presentation/localization-sensitive. The inventory
    // container and its cards are the observable state needed by callers.
    await this.page.locator('[data-test="inventory-list"]').waitFor();
    await this.productCards.first().waitFor();
  }
  async isLoaded(): Promise<boolean> {
    return (await this.page.locator('[data-test="inventory-list"]').count()) > 0
      && (await this.productCards.count()) > 0;
  }
  async openMenu(): Promise<void> { await this.page.getByRole('button', { name: 'Open Menu' }).click(); }
  async logout(): Promise<void> { await this.page.getByRole('link', { name: 'Logout' }).click(); }
  private sortSelector(): Locator { return this.page.locator('[data-test="product-sort-container"]'); }
  async sortBy(sort: ProductSort): Promise<void> { await this.sortSelector().selectOption(sort); }
  async selectSortOption(value: string): Promise<void> { await this.sortSelector().selectOption(value); }
  async getSelectedSortValue(): Promise<string> { return this.sortSelector().inputValue(); }
  async getSortOptions(): Promise<ProductSortOption[]> {
    return this.sortSelector().locator('option').evaluateAll((options) => options.map((option) => ({
      value: (option as HTMLOptionElement).value,
      label: (option.textContent ?? '').trim(),
    })));
  }
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
  getProductCards(): Locator { return this.productCards; }
  async getProductCount(): Promise<number> { return this.productCards.count(); }
  async getFirstProductPrice(): Promise<string> { return (await this.productCards.first().locator('[data-test="inventory-item-price"]').innerText()).trim(); }
  async getProductEntries(): Promise<ProductListingEntry[]> {
    const cards = await this.productCards.all();
    const entries: ProductListingEntry[] = [];
    for (const card of cards) {
      entries.push({
        name: (await card.locator('[data-test="inventory-item-name"]').innerText()).trim(),
        price: (await card.locator('[data-test="inventory-item-price"]').innerText()).trim(),
        imageAlt: (await card.getByRole('img').getAttribute('alt') ?? '').trim(),
        actions: (await card.getByRole('button').allTextContents()).map((value) => value.trim()).filter(Boolean),
      });
    }
    return entries;
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
  async openProductByName(name: string): Promise<void> {
    const product = this.productCards.filter({ hasText: name }).first();
    await product.getByRole('link', { name, exact: true }).click();
  }
  async openCart(): Promise<void> { await this.page.locator('[data-test="shopping-cart-link"]').click(); }
  async clearCart(): Promise<void> {
    const removeButtons = this.page.getByRole('button', { name: 'Remove' });
    while (await removeButtons.count() > 0) await removeButtons.first().click();
  }
  async addFirstProductToCart(): Promise<string> { return this.addProductToCart(0); }
  async addSecondProductToCart(): Promise<string> { return this.addProductToCart(1); }
  async cartBadgeCount(): Promise<number> {
    const badge = this.page.locator('[data-test="shopping-cart-badge"]');
    return (await badge.count()) === 0 ? 0 : Number(await badge.innerText());
  }
}
