const { defineConfig } = require('cypress');

// Small browser harness: real auth/API/UI, without optional reporting/drag plugins.
module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 960,
  video: false,
  defaultCommandTimeout: 20000,
  responseTimeout: 30000,
  retries: 0,
  trashAssetsBeforeRuns: false,
  screenshotsFolder: '../nakul-workflow/verification/query-library-license-gating/screenshots',
  e2e: {
    baseUrl: process.env.QUERY_LIBRARY_FRONTEND_ORIGIN,
    supportFile: 'cypress/support/query-library.js',
    specPattern: 'cypress/e2e/happyPath/platform/eeTestcases/queryLibrary/{versionLifecycle,consumerJourneys,consumerEdgeCases,licensing}.cy.js',
  },
});
