import { expect, test } from '../fixtures/test.fixture.js';
import { normalizeNumericText, sortNumbersAscending, sortNumbersDescending, sortStringsAscending, sortStringsDescending } from '../helpers/sorting.js';

test("@sorting @regression TC-PRODUCTS-001: Sort the visible product listing by name from A to Z", async ({ page, loginPage, credentials, authenticatedInventoryPage, cartPage, checkoutPage }) => {
  
  const productsBeforeSort = (await authenticatedInventoryPage.getProductNames());
  await authenticatedInventoryPage.sortBy("az");
  const productsAfterSort = (await authenticatedInventoryPage.getProductNames());
  const current_product_names = (await authenticatedInventoryPage.getProductNames());
  await expect(current_product_names).toEqual(sortStringsAscending(current_product_names));
});

test("@sorting @regression TC-PRODUCTS-002: Sort the visible product listing by name from Z to A", async ({ page, loginPage, credentials, authenticatedInventoryPage, cartPage, checkoutPage }) => {
  
  const productsBeforeSort = (await authenticatedInventoryPage.getProductNames());
  await authenticatedInventoryPage.sortBy("za");
  const productsAfterSort = (await authenticatedInventoryPage.getProductNames());
  const current_product_names = (await authenticatedInventoryPage.getProductNames());
  await expect(current_product_names).toEqual(sortStringsDescending(current_product_names));
});

test("@sorting @regression TC-PRODUCTS-003: Sort the visible product listing by price from low to high", async ({ page, loginPage, credentials, authenticatedInventoryPage, cartPage, checkoutPage }) => {
  
  const productsBeforeSort = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  await authenticatedInventoryPage.sortBy("lohi");
  const productsAfterSort = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  const current_product_prices = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  await expect(current_product_prices).toEqual(sortNumbersAscending(current_product_prices));
});

test("@sorting @regression TC-PRODUCTS-004: Sort the visible product listing by price from high to low", async ({ page, loginPage, credentials, authenticatedInventoryPage, cartPage, checkoutPage }) => {
  
  const productsBeforeSort = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  await authenticatedInventoryPage.sortBy("hilo");
  const productsAfterSort = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  const current_product_prices = (await authenticatedInventoryPage.getProductPrices()).map(normalizeNumericText);
  await expect(current_product_prices).toEqual(sortNumbersDescending(current_product_prices));
});
