const { loginAsStandardUser, hasStandardUserCredentials } = require('../../support/authentication');
const { createCheckoutCustomer } = require('../../support/data');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage = require('../../pages/CartPage');
const CheckoutPage = require('../../pages/CheckoutPage');

describe('Checkout - standard user', () => {
  beforeEach(function () {
    if (!hasStandardUserCredentials()) this.skip();
    loginAsStandardUser();
  });

  it('completes checkout with one product @regression @smoke', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.getProductEntries().then(products => {
      inventory.addProductByName(products[0].name); inventory.openCart();
      cart.getProductNames().should('deep.equal', [products[0].name]); cart.getProductQuantity(products[0].name).should('equal', 1); cart.startCheckout();
      const customer = createCheckoutCustomer(); checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode); checkout.continue();
      cy.url().should('match', /checkout-step-two\.html$/); checkout.getSummaryItemCount().should('equal', 1); checkout.finish();
      cy.url().should('match', /checkout-complete\.html$/); cy.contains('Thank you for your order!', { exact: true }).should('be.visible');
    });
  });

  it('preserves multiple products and prices through checkout @regression @smoke', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.getProductEntries().then(products => { products.slice(0, 3).forEach(product => inventory.addProductByName(product.name)); inventory.openCart(); });
    cart.getProductNames().should('have.length', 3); cart.startCheckout(); const customer = createCheckoutCustomer();
    checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode); checkout.continue(); checkout.getSummaryItemCount().should('equal', 3);
    checkout.getSummarySubtotal().should('match', /^Item total: \$\d+\.\d{2}$/); checkout.getSummaryTotal().should('match', /^Total: \$\d+\.\d{2}$/);
  });

  it('blocks checkout information when required fields are empty @regression', () => {
    const inventory = new InventoryPage(); const cart = new CartPage(); const checkout = new CheckoutPage();
    inventory.addFirstProductToCart(); inventory.openCart(); cart.startCheckout(); checkout.continue();
    cy.url().should('match', /checkout-step-one\.html$/); cy.get('[data-test="error"]').should('be.visible').and('contain.text', 'First Name is required');
  });

  it('does not complete an order with an empty cart @regression', () => {
    const inventory = new InventoryPage(); inventory.openCart(); cy.get('[data-test="inventory-item"]').should('have.length', 0);
    cy.get('[data-test="checkout"]').should('be.enabled').click(); cy.url().should('match', /checkout-step-one\.html$/);
    cy.contains('Checkout: Your Information', { exact: true }).should('be.visible');
  });

  it('keeps checkout usable on mobile @regression', () => {
    cy.viewport(375, 667); const inventory = new InventoryPage(); const cart = new CartPage(); inventory.addFirstProductToCart(); inventory.openCart(); cart.startCheckout();
    cy.contains('Checkout: Your Information', { exact: true }).should('be.visible'); cy.get('[placeholder="First Name"]').should('be.visible'); cy.get('[data-test="continue"]').should('be.visible');
  });
});
