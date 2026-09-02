const { loginAsErrorUser, hasErrorUserCredentials } = require('../../support/authentication');
const { createCheckoutCustomer } = require('../../support/data');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage = require('../../pages/CartPage');
const CheckoutPage = require('../../pages/CheckoutPage');

describe('Checkout - error user', () => {
  beforeEach(function () { if (!hasErrorUserCredentials()) this.skip(); loginAsErrorUser(); });

  it('attempts checkout with one product @regression @smoke', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.addFirstProductToCart(); inventory.openCart(); cart.startCheckout();
    const customer = createCheckoutCustomer(); checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode); checkout.continue();
    cy.url().should('match', /checkout-step-two\.html$/); checkout.getSummaryItemCount().should('equal', 1);
  });

  it('attempts multiple-product checkout @regression @smoke', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.addProductToCart(0); inventory.addProductToCart(1); inventory.addProductToCart(2); inventory.openCart(); cart.startCheckout();
    const customer = createCheckoutCustomer(); checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode); checkout.continue();
    checkout.getSummaryItemCount().should('equal', 3); checkout.getSummarySubtotal().should('match', /^Item total: \$\d+\.\d{2}$/);
  });

  it('validates empty required checkout fields @regression', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.addFirstProductToCart(); inventory.openCart(); cart.startCheckout(); checkout.continue();
    cy.get('[data-test="error"]').should('be.visible').and('contain.text', 'First Name is required');
  });

  it('keeps the reachable checkout form usable on mobile @regression', () => {
    cy.viewport(390, 844); const inventory = new InventoryPage(); const cart = new CartPage(); inventory.addFirstProductToCart(); inventory.openCart(); cart.startCheckout();
    cy.contains('Checkout: Your Information', { exact: true }).should('be.visible'); cy.get('[placeholder="First Name"]').should('be.visible');
  });
});
