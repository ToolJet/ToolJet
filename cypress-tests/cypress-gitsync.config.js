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
    specPattern: [
      "cypress/e2e/happyPath/platform/firstUser/firstUserOnboarding.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/updateLicense.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/gitSync/**/*.cy.js",
    ],

    testIsolation: true,
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
