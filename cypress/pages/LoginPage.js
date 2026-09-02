class LoginPage {
  username() { return cy.get('[data-test="username"]'); }
  password() { return cy.get('[data-test="password"]'); }
  submitButton() { return cy.get('[data-test="login-button"]'); }
  error() { return cy.get('[data-test="error"]'); }
  navigate() { cy.visit(Cypress.env('TEST_BASE_URL') || '/'); }
  login(username, password) {
    this.username().clear();
    if (username) this.username().type(username);
    this.password().clear();
    if (password) this.password().type(password);
    this.submit();
  }
  submit() { this.submitButton().click(); }
  loginWithKeyboard(username, password) {
    this.username().clear();
    if (username) this.username().type(username);
    this.password().clear();
    if (password) this.password().type(password);
    this.password().type('{enter}');
  }
}

module.exports = LoginPage;
