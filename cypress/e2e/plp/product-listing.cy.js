const { loginAsStandardUser, hasStandardUserCredentials } = require('../../support/authentication');
const InventoryPage = require('../../pages/InventoryPage');
const { normalizeNumericText, sortNumbersAscending, sortStringsAscending } = require('../../support/data');

describe('Product Listing', () => {
  beforeEach(function () { if (!hasStandardUserCredentials()) this.skip(); loginAsStandardUser(); });
  it('shows a complete product listing @regression @smoke', () => {
    const inventory = new InventoryPage(); cy.contains('Products', { exact: true }).should('be.visible'); inventory.getProductCards().should('have.length', 6);
    inventory.getProductEntries().then(products => products.forEach(product => { expect(product.name).not.to.equal(''); expect(product.price).to.match(/^\$\d+\.\d{2}$/); }));
  });
  it('sorts products by name and price @regression @smoke', () => {
    const inventory = new InventoryPage(); inventory.sortByNameAscending(); inventory.getProductNames().then(names => expect(names).to.deep.equal(sortStringsAscending(names)));
    inventory.sortByPriceAscending(); inventory.getProductPrices().then(prices => { const values = prices.map(normalizeNumericText); expect(values).to.deep.equal(sortNumbersAscending(values)); });
  });
  it('keeps the listing usable on mobile @regression', () => {
    cy.viewport(375, 667); const inventory = new InventoryPage(); inventory.getProductCards().should('have.length', 6); cy.get('[data-test="product-sort-container"]').should('be.visible');
  });
});
