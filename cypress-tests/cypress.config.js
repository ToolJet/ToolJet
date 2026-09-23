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

  e2e: {
    setupNodeEvents (on, config) {
      require("./cypress/config/tasks")(on);
      require("./cypress/config/browserConfig")(on);
      require("@cypress/code-coverage/task")(on, config);
      require("./cypress/plugins/index.js")(on, config);
      // cypress-live-reporter — self-disables (one warning) when neither
      // CLR_DB nor CLR_WEBHOOK is set in cypress env, so it's a no-op otherwise.
      return require("cypress-live-reporter/plugin").livePlugin(on, config);
    },

    env: {
      CLR_PROJECT_ID: "happy-path",
    },

    baseUrl: "http://localhost:8082",
    specPattern: "cypress/e2e/happyPath/**/*.cy.js",

    testIsolation: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    redirectionLimit: 3,

    numTestsKeptInMemory: 1,
    experimentalMemoryManagement: true,

    experimentalRunAllSpecs: true,
    experimentalOriginDependencies: true,

    downloadsFolder: "cypress/downloads",
    trashAssetsBeforeRuns: true,
    video: false,
    videoUploadOnPasses: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',

    coverage: false,
    codeCoverageTasksRegistered: false,

    projectId: "ca6324a0-4210-4f7e-846a-71ca2766ca4",
  },
});
