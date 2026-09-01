import { expect, test } from '../fixtures/test.fixture.js';

test('@cart @regression TC-CARTMANA-001: Add three distinct products and remove one while preserving cart state', async ({ page, authenticatedInventoryPage, cartPage }) => {
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();

  const visibleProducts = await authenticatedInventoryPage.getProductNames();
  expect(visibleProducts.length).toBeGreaterThanOrEqual(3);

  const selectedProducts = await authenticatedInventoryPage.selectRandomProducts(3);
  const selectedProductNames = selectedProducts.map((product) => product.name);
  await authenticatedInventoryPage.addProductsToCart(selectedProducts);

  await expect(await authenticatedInventoryPage.cartBadgeCount()).toBe(3);
  await authenticatedInventoryPage.openCart();
  await cartPage.waitUntilLoaded();

  const cartProductNames = await cartPage.getProductNames();
  await expect(cartProductNames).toEqual(selectedProductNames);

  const [removedProductName] = selectedProductNames;
  const remainingProductNames = selectedProductNames.filter((name) => name !== removedProductName);
  await cartPage.removeProductByName(removedProductName);

  const postRemovalProductNames = await cartPage.getProductNames();
  await expect(postRemovalProductNames).not.toContain(removedProductName);
  await expect(postRemovalProductNames).toEqual(expect.arrayContaining(remainingProductNames));
  await expect(postRemovalProductNames).toHaveLength(2);
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
});
