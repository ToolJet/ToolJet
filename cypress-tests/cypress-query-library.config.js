const { defineConfig } = require('cypress');

// Small browser harness: real auth/API/UI, without optional reporting/drag plugins.
module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 960,
  video: false,
  defaultCommandTimeout: 20000,
  responseTimeout: 30000,
  retries: 0,
  screenshotsFolder: '../nakul-workflow/verification/query-library-task9/screenshots',
  e2e: {
    baseUrl: 'http://localhost:8093',
    supportFile: 'cypress/support/query-library.js',
    specPattern: 'cypress/e2e/happyPath/platform/eeTestcases/queryLibrary/versionLifecycle.cy.js',
  },
});
