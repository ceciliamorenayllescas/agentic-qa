class CartPage {
  getProductNames() { return cy.get('[data-test="inventory-item-name"]').then($items => [...$items].map(item => item.innerText.trim())); }
  getProductQuantity(name) { return cy.get('[data-test="inventory-item"]').contains(name).closest('[data-test="inventory-item"]').find('[data-test="item-quantity"]').invoke('text').then(Number); }
  startCheckout() { cy.get('[data-test="checkout"]').click(); }
}

module.exports = CartPage;
