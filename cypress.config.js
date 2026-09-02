require('dotenv/config');
const { defineConfig } = require('cypress');
const { createFailureReports } = require('./cypress/reporters/test-report-generator');

module.exports = defineConfig({
  env: {
    TEST_BASE_URL: process.env.TEST_BASE_URL,
    TEST_STANDARD_USER_USERNAME: process.env.TEST_STANDARD_USER_USERNAME,
    TEST_STANDARD_USER_PASSWORD: process.env.TEST_STANDARD_USER_PASSWORD,
    TEST_USERNAME: process.env.TEST_USERNAME,
    TEST_PASSWORD: process.env.TEST_PASSWORD,
    TEST_INVALID_USER_USERNAME: process.env.TEST_INVALID_USER_USERNAME,
    TEST_INVALID_USER_PASSWORD: process.env.TEST_INVALID_USER_PASSWORD,
    TEST_BLOCKED_USER_USERNAME: process.env.TEST_BLOCKED_USER_USERNAME,
    TEST_BLOCKED_USER_PASSWORD: process.env.TEST_BLOCKED_USER_PASSWORD,
    TEST_ERROR_USER_USERNAME: process.env.TEST_ERROR_USER_USERNAME,
    TEST_ERROR_USER_PASSWORD: process.env.TEST_ERROR_USER_PASSWORD,
    TEST_PROBLEM_USER_USERNAME: process.env.TEST_PROBLEM_USER_USERNAME,
    TEST_PROBLEM_USER_PASSWORD: process.env.TEST_PROBLEM_USER_PASSWORD,
  },
  e2e: {
    baseUrl: process.env.TEST_BASE_URL || 'https://www.saucedemo.com/',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: true,
    screenshotsFolder: 'artifacts/cypress/screenshots',
    videosFolder: 'artifacts/cypress/videos',
    downloadsFolder: 'artifacts/cypress/downloads',
    retries: process.env.CI ? 2 : 0,
    setupNodeEvents(on, config) {
      on('after:spec', (spec, results) => {
        if (results && results.tests) {
          createFailureReports(results, config.projectRoot);
        }
      });
      return config;
    },
  },
});
