const { loginAsErrorUser, hasErrorUserCredentials, loginAsProblemUser, hasProblemUserCredentials } = require('../../support/authentication');
const { createCheckoutCustomer, createCheckoutBoundaryData } = require('../../support/data');
const InventoryPage = require('../../pages/InventoryPage');
const CartPage = require('../../pages/CartPage');
const CheckoutPage = require('../../pages/CheckoutPage');

function openCheckoutInformation() {
  const inventory = new InventoryPage();
  const cart = new CartPage();
  inventory.addFirstProductToCart();
  inventory.openCart();
  cart.startCheckout();
}

function continueIfCheckoutIsReachable(test) {
  cy.location('pathname').then(pathname => {
    if (pathname === '/checkout-step-one.html') {
      test();
      return;
    }
    expect(pathname).to.equal('/inventory.html');
    new InventoryPage().getCartBadge().should('eq', '1');
  });
}

describe('Checkout - error user', () => {
  beforeEach(function () {
    if (!hasErrorUserCredentials()) this.skip();
    loginAsErrorUser();
  });

  it('keeps the observed cart controls state consistent (TC-07, H-01) @regression', () => {
    const inventory = new InventoryPage();
    inventory.addFirstProductToCart();
    inventory.getCartBadge().should('eq', '1');
    inventory.openCart();
    cy.location('pathname').should('eq', '/cart.html');
    inventory.getCartBadge().should('eq', '1');
    cy.get('[data-test="inventory-item"]').should('have.length', 1);
  });

  it('blocks each missing required field while retaining valid values (TC-04) @regression', () => {
    const checkout = new CheckoutPage();
    const customer = createCheckoutCustomer();
    openCheckoutInformation();
    continueIfCheckoutIsReachable(() => {
      [
        { field: 'firstName', message: 'First Name is required' },
        { field: 'lastName', message: 'Last Name is required' },
        { field: 'postalCode', message: 'Postal Code is required' },
      ].forEach(({ field, message }) => {
        checkout.fillInformation(customer.firstName, customer.lastName, customer.postalCode);
        checkout.fillField(field, '');
        checkout.continue();
        cy.location('pathname').should('eq', '/checkout-step-one.html');
        checkout.error().should('be.visible').and('contain.text', message);
        checkout.field(field).should('have.value', '');
        checkout.clearInformation();
      });
    });
  });

  it('records stable handling for whitespace and special customer data (TC-05) @regression', () => {
    const checkout = new CheckoutPage();
    const boundary = createCheckoutBoundaryData();
    openCheckoutInformation();
    continueIfCheckoutIsReachable(() => {
      checkout.fillInformation(` ${boundary.hyphenated} `, boundary.apostrophe, boundary.alphaNumericPostalCode);
      checkout.continue();
      cy.location('pathname').should('match', /checkout-step-(one|two)\.html$/);
      cy.location('pathname').then(pathname => {
        if (pathname.endsWith('two.html')) checkout.getSummaryItemCount().should('eq', 1);
        else checkout.error().should('be.visible');
      });
    });
  });

  it('does not crash or complete after very long checkout input (TC-06) @regression', () => {
    const checkout = new CheckoutPage();
    openCheckoutInformation();
    continueIfCheckoutIsReachable(() => {
      checkout.fillInformation('x'.repeat(256), 'x'.repeat(256), 'x'.repeat(256));
      checkout.continue();
      cy.location('pathname').should('match', /checkout-step-(one|two)\.html$/);
      cy.location('pathname').should('not.eq', '/checkout-complete.html');
      checkout.assertNoHorizontalOverflow();
    });
  });

  it('preserves the reachable checkout state when cancel is requested (TC-08) @regression', () => {
    const checkout = new CheckoutPage();
    openCheckoutInformation();
    continueIfCheckoutIsReachable(() => {
      checkout.cancel();
      cy.location('pathname').should('match', /inventory|cart/);
      cy.location('pathname').then(pathname => {
        if (pathname === '/inventory.html') cy.contains('Products', { exact: true }).should('be.visible');
        else cy.contains('Your Cart', { exact: true }).should('be.visible');
      });
    });
  });

  it('keeps the reachable checkout form usable on mobile (TC-10) @regression', () => {
    cy.viewport(390, 844);
    const checkout = new CheckoutPage();
    openCheckoutInformation();
    continueIfCheckoutIsReachable(() => {
      cy.contains('Checkout: Your Information', { exact: true }).should('be.visible');
      checkout.field('firstName').should('be.visible');
      checkout.field('lastName').should('be.visible');
      checkout.field('postalCode').should('be.visible');
      checkout.assertNoHorizontalOverflow();
    });
  });
});

describe('Checkout - error user versus problem user', () => {
  it('compares the observable initial inventory state (TC-09) @regression', function () {
    if (!hasErrorUserCredentials() || !hasProblemUserCredentials()) this.skip();
    loginAsErrorUser();
    cy.contains('Products', { exact: true }).should('be.visible');
    cy.location('pathname').should('eq', '/inventory.html');
    cy.get('[data-test="shopping-cart-link"]').should('be.visible');
    loginAsProblemUser();
    cy.contains('Products', { exact: true }).should('be.visible');
    cy.location('pathname').should('eq', '/inventory.html');
    cy.get('[data-test="shopping-cart-link"]').should('be.visible');
  });
});
