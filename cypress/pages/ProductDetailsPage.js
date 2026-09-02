class ProductDetailsPage {
  getProductCard() { return cy.get('[data-test="inventory-item"]'); }
  getProductName() { return cy.get('[data-test="inventory-item-name"]').invoke('text').then(text => text.trim()); }
  getProductPrice() { return cy.get('[data-test="inventory-item-price"]').invoke('text').then(text => text.trim()); }
  backToProducts() { cy.get('[data-test="back-to-products"]').click(); }
  assertLoaded() { this.getProductCard().should('be.visible'); this.getProductName().should('not.equal', ''); this.getProductPrice().should('match', /^\$\d+\.\d{2}$/); }
}

module.exports = ProductDetailsPage;
