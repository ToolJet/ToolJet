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
    async setupNodeEvents (on, config) {
      require("./cypress/config/tasks")(on);
      await require("./cypress/config/cloudTasks")(on, config);
      require("./cypress/config/browserConfig")(on);

      config = require("./cypress/plugins/index.js")(on, config);
      return require("cypress-live-reporter/plugin").livePlugin(on, config);
    },

    env: {
      CLR_PROJECT_ID: "platform-cloud",
      environment: "Cloud",
      aiGatewayStubPort: 3200,
    },

    baseUrl: "http://localhost:3000", // Default for local development (GitHub workflow overrides this)
    specPattern: ["cypress/e2e/happyPath/platform/cloudTestcases/**/*.cy.js"],

    testIsolation: true,
    // Repo convention: every spec sets retries: 0, so a flake shows up as a failure instead of hiding behind a retry.
    retries: {
      runMode: 0,
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
