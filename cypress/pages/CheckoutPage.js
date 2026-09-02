class CheckoutPage {
  fillInformation(firstName, lastName, postalCode) {
    cy.get('[placeholder="First Name"]').type(firstName);
    cy.get('[placeholder="Last Name"]').type(lastName);
    cy.get('[placeholder="Zip/Postal Code"]').type(postalCode);
  }
  continue() { cy.get('[data-test="continue"]').click(); }
  finish() { cy.get('[data-test="finish"]').click(); }
  getSummaryItemCount() { return cy.get('[data-test="inventory-item"]').its('length'); }
  getSummarySubtotal() { return cy.get('[data-test="subtotal-label"]').invoke('text').then(text => text.trim()); }
  getSummaryTotal() { return cy.get('[data-test="total-label"]').invoke('text').then(text => text.trim()); }
}

module.exports = CheckoutPage;
