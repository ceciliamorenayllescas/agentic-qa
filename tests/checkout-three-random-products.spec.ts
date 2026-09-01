import { expect, test } from '../fixtures/test.fixture.js';
import { createCheckoutCustomer } from '../helpers/test-data.js';

test("@checkout @regression TC-CHECKOUT-001: Complete checkout with three distinct randomly selected products", async ({ page, loginPage, credentials, authenticatedInventoryPage, cartPage, checkoutPage }) => {
  const customer = createCheckoutCustomer();
  await loginPage.navigate();
  await loginPage.login(credentials.username, credentials.password);
  await expect(page).toHaveURL(/\/inventory\.html$/)
  await expect(page.getByText('Products', { exact: true })).toBeVisible()
  const visibleProducts = (await authenticatedInventoryPage.getProductNames());
  const selectedProducts = await authenticatedInventoryPage.selectRandomProducts(3);
  const selectedProductNames = selectedProducts.map((product) => product.name);
  await authenticatedInventoryPage.addProductsToCart(selectedProducts);
  const cartCount = await authenticatedInventoryPage.cartBadgeCount();
  await expect(cartCount).toBe(3);
  await authenticatedInventoryPage.openCart();
  await cartPage.waitUntilLoaded()
  const cartProductNames = await cartPage.getProductNames();
  await expect(cartProductNames).toEqual(selectedProductNames);
  await cartPage.startCheckout();
  await checkoutPage.fillInformation(customer.firstName, customer.lastName, customer.postalCode);
  await checkoutPage.continue();
  await expect(page).toHaveURL(/checkout-step-two\.html$/)
  const overviewProductNames = await checkoutPage.getProductNames();
  await expect(overviewProductNames).toEqual(selectedProductNames);
  await checkoutPage.finish();
  await expect(await checkoutPage.getConfirmationMessage()).toBe("Thank you for your order!");
});
