const { defineConfig } = require("cypress");

module.exports = defineConfig({
  execTimeout: 1800000,
  defaultCommandTimeout: 30000,
  requestTimeout: 30000,
  pageLoadTimeout: 30000,
  responseTimeout: 30000,
  viewportWidth: 1440,
  viewportHeight: 960,
  chromeWebSecurity: false,
  projectId: "sk3oji",

  e2e: {
    setupNodeEvents (on, config) {
      require("./cypress/config/tasks")(on);
      require("./cypress/config/browserConfig")(on);

      return require("./cypress/plugins/index.js")(on, config);
    },

    baseUrl: "http://localhost:3000", // Default for local development (GitHub workflow overrides this)
    // Specs are grouped by product area since the 2026-09-04 restructure; edition is
    // carried by the filename suffix (.ee / .ce / plain = both). This config runs the
    // full platform surface, so it globs every area rather than listing them.
    specPattern: [
      // Must run first — provisions the instance's first user. Kept explicit for ordering.
      "cypress/e2e/happyPath/platform/onboarding/firstUserOnboarding.cy.js",
      "cypress/e2e/happyPath/platform/**/*.cy.js",
    ],
    // gitSync runs from cypress-gitsync.config.js under its own CI label
    // (run-cypress-git-sync-ee); licensing/ai is covered by the BYOK/AI suite. Neither
    // was matched by this config before the restructure, so the resolved set is
    // unchanged at 77 specs.
    excludeSpecPattern: [
      "cypress/e2e/happyPath/platform/gitSync/**/*.cy.js",
      "cypress/e2e/happyPath/platform/licensing/ai/**/*.cy.js",
    ],

    testIsolation: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    redirectionLimit: 10,

    numTestsKeptInMemory: 0,
    experimentalMemoryManagement: true,

    experimentalRunAllSpecs: true,
    experimentalModifyObstructiveThirdPartyCode: true,
    experimentalOriginDependencies: true,

    downloadsFolder: "cypress/downloads",
    trashAssetsBeforeRuns: true,
    video: false,
    videoUploadOnPasses: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",

    coverage: false,
    codeCoverageTasksRegistered: false,
  },
});
