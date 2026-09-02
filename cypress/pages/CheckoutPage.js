class CheckoutPage {
  field(field) {
    const selectors = { firstName: '[placeholder="First Name"]', lastName: '[placeholder="Last Name"]', postalCode: '[placeholder="Zip/Postal Code"]' };
    return cy.get(selectors[field]);
  }
  fillInformation(firstName, lastName, postalCode) {
    this.fillField('firstName', firstName);
    this.fillField('lastName', lastName);
    this.fillField('postalCode', postalCode);
  }
  clearInformation() { this.field('firstName').clear(); this.field('lastName').clear(); this.field('postalCode').clear(); }
  fillField(field, value) {
    this.field(field).clear().type(value);
  }
  continue() { cy.get('[data-test="continue"]').click(); }
  cancel() { cy.get('[data-test="cancel"]').click(); }
  finish() { cy.get('[data-test="finish"]').click(); }
  getSummaryItemCount() { return cy.get('[data-test="inventory-item"]').its('length'); }
  getSummaryEntries() { return cy.get('[data-test="inventory-item"]').then($items => [...$items].map(item => ({ name: item.querySelector('[data-test="inventory-item-name"]').innerText.trim(), price: item.querySelector('[data-test="inventory-item-price"]').innerText.trim(), quantity: Number(item.querySelector('[data-test="item-quantity"]').innerText.trim()) }))); }
  getSummarySubtotal() { return cy.get('[data-test="subtotal-label"]').invoke('text').then(text => text.trim()); }
  getSummaryTotal() { return cy.get('[data-test="total-label"]').invoke('text').then(text => text.trim()); }
  getErrorText() { return cy.get('[data-test="error"]').invoke('text').then(text => text.trim()); }
  error() { return cy.get('[data-test="error"]'); }
  assertNoHorizontalOverflow() {
    cy.document().then(document => expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth));
  }
}

module.exports = CheckoutPage;
