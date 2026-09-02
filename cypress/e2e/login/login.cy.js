const LoginPage = require('../../pages/LoginPage');
const { getStandardUserCredentials, hasStandardUserCredentials } = require('../../support/authentication');

describe('Login', () => {
  it('authenticates a valid standard user @regression @smoke', function () {
    if (!hasStandardUserCredentials()) this.skip(); const credentials = getStandardUserCredentials(); const login = new LoginPage(); login.navigate(); login.login(credentials.username, credentials.password);
    cy.location('pathname').should('eq', '/inventory.html'); cy.contains('Products', { exact: true }).should('be.visible');
  });
  it('validates required fields @regression', () => {
    const login = new LoginPage(); login.navigate(); login.login('', ''); cy.location('pathname').should('eq', '/'); login.error().should('be.visible').and('contain.text', 'Username');
  });
  it('keeps login usable on mobile @regression', function () {
    if (!hasStandardUserCredentials()) this.skip(); cy.viewport(390, 844); const login = new LoginPage(); login.navigate();
    login.username().should('be.visible'); login.password().should('be.visible'); login.submitButton().should('be.visible').and('be.enabled');
  });
});
