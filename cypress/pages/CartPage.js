class CartPage {
  getProductNames() { return cy.get('[data-test="inventory-item-name"]').then($items => [...$items].map(item => item.innerText.trim())); }
  getProductEntries() { return cy.get('[data-test="inventory-item"]').then($items => [...$items].map(item => ({ name: item.querySelector('[data-test="inventory-item-name"]').innerText.trim(), price: item.querySelector('[data-test="inventory-item-price"]').innerText.trim(), quantity: Number(item.querySelector('[data-test="item-quantity"]').innerText.trim()) }))); }
  getProductQuantity(name) { return cy.get('[data-test="inventory-item"]').contains(name).closest('[data-test="inventory-item"]').find('[data-test="item-quantity"]').invoke('text').then(Number); }
  startCheckout() { cy.get('[data-test="checkout"]').click(); }
  isCheckoutEnabled() { return cy.get('[data-test="checkout"]').then($button => !$button.prop('disabled')); }
  getBadgeText() { return cy.get('body').then($body => $body.find('[data-test="shopping-cart-badge"]').text().trim()); }
  getCheckoutButton() { return cy.get('[data-test="checkout"]'); }
  continueShopping() { cy.contains('button', 'Continue Shopping').click(); }
}

module.exports = CartPage;
