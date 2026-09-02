const { loginAsStandardUser, hasStandardUserCredentials } = require('../../support/authentication');
const InventoryPage = require('../../pages/InventoryPage');
const ProductDetailsPage = require('../../pages/ProductDetailsPage');

describe('Product details navigation', () => {
  beforeEach(function () {
    if (!hasStandardUserCredentials()) this.skip();
    loginAsStandardUser();
  });

  it('opens the selected product detail from its name @regression @smoke', () => {
    const inventory = new InventoryPage();
    const detail = new ProductDetailsPage();
    inventory.openProductDetailsByName('Sauce Labs Backpack');
    cy.url().should('match', /inventory-item\.html/);
    detail.assertLoaded();
    detail.getProductName().should('equal', 'Sauce Labs Backpack');
    detail.getProductPrice().should('equal', '$29.99');
  });

  it('opens the selected product detail from its image @regression @smoke', () => {
    const inventory = new InventoryPage();
    const detail = new ProductDetailsPage();
    inventory.openProductDetailsFromImageByName('Sauce Labs Bike Light');
    cy.url().should('match', /inventory-item\.html/);
    detail.getProductName().should('equal', 'Sauce Labs Bike Light');
    detail.getProductPrice().should('equal', '$9.99');
  });

  it('returns from detail to the product listing @regression', () => {
    const inventory = new InventoryPage();
    const detail = new ProductDetailsPage();
    inventory.openProductDetailsByName('Sauce Labs Backpack');
    detail.backToProducts();
    cy.url().should('match', /inventory\.html$/);
    cy.contains('Products', { exact: true }).should('be.visible');
    inventory.getProductCards().should('have.length', 6);
  });

  it('keeps detail navigation usable on mobile @regression', () => {
    cy.viewport(390, 844);
    const inventory = new InventoryPage();
    const detail = new ProductDetailsPage();
    inventory.openProductDetailsByName('Sauce Labs Backpack');
    cy.url().should('match', /inventory-item\.html/);
    detail.assertLoaded();
    detail.backToProducts();
    cy.url().should('match', /inventory\.html$/);
    cy.document().its('documentElement.scrollWidth').should('be.lte', 390);
  });
});
