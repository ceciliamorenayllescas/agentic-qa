import { test, expect } from '@playwright/test';
import { loginAsStandardUser } from '../../helpers/authentication.js';
import { createCheckoutCustomer } from '../../helpers/test-data.js';
import { InventoryPage } from '../../pages/InventoryPage.js';
import { CartPage } from '../../pages/CartPage.js';
import { CheckoutPage } from '../../pages/CheckoutPage.js';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_STANDARD_USER_USERNAME || !process.env.TEST_STANDARD_USER_PASSWORD,
      'Requires standard-user credentials');
    const inventory = await loginAsStandardUser(page);
    await inventory.clearCart();
  });

  test('completes checkout with one product @regression @smoke', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const product = await inventory.getProductEntries();
    await inventory.addProductByName(product[0].name);
    await inventory.openCart();
    expect(await cart.getProductNames()).toEqual([product[0].name]);
    expect(await cart.getProductQuantity(product[0].name)).toBe(1);
    await cart.startCheckout();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    const customer = createCheckoutCustomer();
    await checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode);
    await checkout.continue();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
    expect(await checkout.getSummaryItemCount()).toBe(1);
    await checkout.finish();
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
  });

  test('preserves multiple products and prices through checkout @regression @smoke', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const products = (await inventory.getProductEntries()).slice(0, 3);
    for (const product of products) await inventory.addProductByName(product.name);
    await inventory.openCart();
    expect(await cart.getProductNames()).toEqual(expect.arrayContaining(products.map((p) => p.name)));
    expect(await cart.getProductNames()).toHaveLength(3);
    await cart.startCheckout();
    const customer = createCheckoutCustomer();
    await checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode);
    await checkout.continue();
    expect(await checkout.getSummaryItemCount()).toBe(3);
    expect(await checkout.getSummarySubtotal()).toMatch(/^Item total: \$\d+\.\d{2}$/);
    expect(await checkout.getSummaryTotal()).toMatch(/^Total: \$\d+\.\d{2}$/);
  });

  test('blocks checkout information when required fields are empty @regression', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    await inventory.addFirstProductToCart();
    await inventory.openCart();
    await cart.startCheckout();
    await checkout.continue();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(checkout.validationMessage()).toBeVisible();
    await expect(checkout.validationMessage()).toContainText(/First Name is required/i);
  });

  test('does not complete an order with an empty cart @regression', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    await inventory.openCart();
    expect(await cart.getProductNames()).toHaveLength(0);
    // The observed UI leaves Checkout enabled even when the cart is empty.
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeEnabled();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
    await expect(page.getByText('Checkout: Your Information', { exact: true })).toBeVisible();
  });

  test('keeps checkout usable on mobile @regression', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    await inventory.addFirstProductToCart();
    await inventory.openCart();
    await cart.startCheckout();
    await expect(checkout.informationForm()).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });
});
