const LoginPage = require('../pages/LoginPage');
const InventoryPage = require('../pages/InventoryPage');

function getStandardUserCredentials() {
  return {
    username: Cypress.env('TEST_STANDARD_USER_USERNAME') || Cypress.env('TEST_USERNAME'),
    password: Cypress.env('TEST_STANDARD_USER_PASSWORD') || Cypress.env('TEST_PASSWORD'),
  };
}

function hasStandardUserCredentials() {
  const { username, password } = getStandardUserCredentials();
  return Boolean(username && password);
}

function loginAsStandardUser() {
  const credentials = getStandardUserCredentials();
  if (!credentials.username || !credentials.password) {
    throw new Error('Standard-user credentials are not configured');
  }
  const loginPage = new LoginPage();
  loginPage.navigate();
  loginPage.login(credentials.username, credentials.password);
  cy.url().should('match', /inventory\.html$/);
  new InventoryPage().waitUntilLoaded();
  return new InventoryPage();
}

function getErrorUserCredentials() {
  return {
    username: Cypress.env('TEST_ERROR_USER_USERNAME'),
    password: Cypress.env('TEST_ERROR_USER_PASSWORD'),
  };
}

function hasErrorUserCredentials() {
  const { username, password } = getErrorUserCredentials();
  return Boolean(username && password);
}

function loginAsErrorUser() {
  const credentials = getErrorUserCredentials();
  if (!credentials.username || !credentials.password) {
    throw new Error('Error-user credentials are not configured');
  }
  const loginPage = new LoginPage();
  loginPage.navigate();
  loginPage.login(credentials.username, credentials.password);
  cy.url().should('match', /inventory\.html$/);
  new InventoryPage().waitUntilLoaded();
  return new InventoryPage();
}

function getProblemUserCredentials() {
  return {
    username: Cypress.env('TEST_PROBLEM_USER_USERNAME'),
    password: Cypress.env('TEST_PROBLEM_USER_PASSWORD'),
  };
}

function hasProblemUserCredentials() {
  const { username, password } = getProblemUserCredentials();
  return Boolean(username && password);
}

function loginAsProblemUser() {
  const credentials = getProblemUserCredentials();
  if (!credentials.username || !credentials.password) {
    throw new Error('Problem-user credentials are not configured');
  }
  const loginPage = new LoginPage();
  loginPage.navigate();
  loginPage.login(credentials.username, credentials.password);
  cy.url().should('match', /inventory\.html$/);
  new InventoryPage().waitUntilLoaded();
  return new InventoryPage();
}

module.exports = {
  getStandardUserCredentials,
  hasStandardUserCredentials,
  loginAsStandardUser,
  getErrorUserCredentials,
  hasErrorUserCredentials,
  loginAsErrorUser,
  getProblemUserCredentials,
  hasProblemUserCredentials,
  loginAsProblemUser,
};
