class InventoryPage {
  waitUntilLoaded() { cy.get('[data-test="inventory-list"]').should('be.visible'); cy.get('[data-test="inventory-item"]').should('have.length.greaterThan', 0); }
  sortBy(value) { cy.get('[data-test="product-sort-container"]').select(value); }
  sortByNameAscending() { this.sortBy('az'); }
  sortByNameDescending() { this.sortBy('za'); }
  sortByPriceAscending() { this.sortBy('lohi'); }
  sortByPriceDescending() { this.sortBy('hilo'); }
  getProductNames() { return cy.get('[data-test="inventory-item-name"]').then($items => [...$items].map(item => item.innerText.trim())); }
  getProductPrices() { return cy.get('[data-test="inventory-item-price"]').then($items => [...$items].map(item => item.innerText.trim())); }
  getProductEntries() { return cy.get('[data-test="inventory-item"]').then($cards => [...$cards].map(card => ({ name: card.querySelector('[data-test="inventory-item-name"]').innerText.trim(), price: card.querySelector('[data-test="inventory-item-price"]').innerText.trim(), imageAlt: card.querySelector('img')?.getAttribute('alt')?.trim() || '', actions: [...card.querySelectorAll('button')].map(button => button.innerText.trim()).filter(Boolean) }))); }
  getProductCards() { return cy.get('[data-test="inventory-item"]'); }
  getFirstProductPrice() { return cy.get('[data-test="inventory-item"]').first().find('[data-test="inventory-item-price"]').invoke('text').then(text => text.trim()); }
  addProductByName(name) { cy.get('[data-test="inventory-item"]').contains(name).closest('[data-test="inventory-item"]').contains('button', 'Add to cart').click(); }
  addFirstProductToCart() { this.addProductToCart(0); }
  addProductToCart(index) { cy.get('[data-test="inventory-item"]').eq(index).contains('button', 'Add to cart').click(); }
  openCart() { cy.get('[data-test="shopping-cart-link"]').click(); }
  openProductDetailsByName(name) {
    cy.get('[data-test="inventory-item"]').contains(name).closest('[data-test="inventory-item"]').find('[data-test$="title-link"]').click();
  }
  openProductDetailsFromImageByName(name) {
    cy.get('[data-test="inventory-item"]').contains(name).closest('[data-test="inventory-item"]').find('[data-test$="img-link"]').click();
  }
  clearCart() { cy.contains('button', 'Remove').click({ multiple: true, force: true }); }
}

module.exports = InventoryPage;
