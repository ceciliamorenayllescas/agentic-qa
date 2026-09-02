import { test, expect } from '@playwright/test';
import { loginAsStandardUser } from '../../helpers/authentication.js';
import { normalizeNumericText, sortNumbersAscending, sortNumbersDescending, sortStringsAscending, sortStringsDescending } from '../../helpers/sorting.js';
import type { ProductListingEntry } from '../../helpers/product.js';
import { InventoryPage } from '../../pages/InventoryPage.js';

test.describe('Product Listing', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_STANDARD_USER_USERNAME || !process.env.TEST_STANDARD_USER_PASSWORD, 'Requires standard-user credentials');
    await loginAsStandardUser(page);
  });

  test('shows a complete product listing @regression @smoke', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
    const products = inventory.getProductCards();
    await expect(products).toHaveCount(6);
    for (const product of await inventory.getProductEntries()) {
      expect(product.name).not.toBe('');
      expect(product.price).toMatch(/^\$\d+\.\d{2}$/);
      expect(product.imageAlt).not.toBe('');
      expect(product.actions).toHaveLength(1);
    }
  });

  test('sorts by name without changing the product set @regression @smoke', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const initial = await inventory.getProductEntries();
    await inventory.sortByNameAscending();
    const ascending = await inventory.getProductNames();
    await inventory.sortByNameDescending();
    const descending = await inventory.getProductNames();
    expect(ascending).toEqual(sortStringsAscending(ascending));
    expect(descending).toEqual(sortStringsDescending(ascending));
    expect(new Set(descending)).toEqual(new Set(initial.map((product) => product.name)));
    await expect(page.getByRole('combobox')).toHaveValue('za');
  });

  test('sorts by price including equal-price boundary values @regression @smoke', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await inventory.sortByPriceAscending();
    const lowPrices = (await inventory.getProductPrices()).map(normalizeNumericText);
    await inventory.sortByPriceDescending();
    const highEntries: ProductListingEntry[] = await inventory.getProductEntries();
    const highPrices = highEntries.map((product) => normalizeNumericText(product.price));
    expect(lowPrices).toEqual(sortNumbersAscending(lowPrices));
    expect(highPrices).toEqual(sortNumbersDescending(highPrices));
    expect(highEntries.filter((product) => product.price === '$15.99')).toHaveLength(2);
  });

  test('keeps the listing usable on mobile after sorting @regression', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
    await expect(page.getByRole('combobox')).toBeVisible();
    const products = inventory.getProductCards();
    await expect(products).toHaveCount(6);
    await products.last().scrollIntoViewIfNeeded();
    await inventory.sortByPriceAscending();
    expect(await inventory.getFirstProductPrice()).toBe('$7.99');
  });
});
