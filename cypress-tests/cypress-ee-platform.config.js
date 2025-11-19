const { defineConfig } = require("cypress");

const environments = {
  "run-cypress-platform": {
    baseUrl: "http://localhost:3000",
    configFile: "cypress-platform.config.js",
  },
  "run-cypress-platform-subpath": {
    baseUrl: "http://localhost:3000/apps",
    configFile: "cypress-platform.config.js",
  },
  "run-cypress-platform-proxy": {
    baseUrl: "http://localhost:4001",
    configFile: "cypress-platform.config.js",
  },
  "run-cypress-platform-proxy-subpath": {
    baseUrl: "http://localhost:4001/apps",
    configFile: "cypress-platform.config.js",
  },
};

const githubLabel = process.env.GITHUB_LABEL || "run-cypress-platform";
const environment = environments[githubLabel];

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
      config.baseUrl = environment.baseUrl;

      require("./cypress/config/tasks")(on);
      require("./cypress/config/browserConfig")(on);

      return require("./cypress/plugins/index.js")(on, config);
    },

    baseUrl: environment.baseUrl,
    configFile: environment.configFile,
    specPattern: [
      "cypress/e2e/happyPath/platform/firstUser/firstUserOnboarding.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/basicPlanTestcases/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/paidPlanTestcases/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/updateLicense.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/sso/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/multi-env/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/externalApi/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/userMetadata/**/*.cy.js",
      "cypress/e2e/happyPath/platform/eeTestcases/superAdmin/**/*.cy.js"
      "cypress/e2e/happyPath/platform/ceTestcases/**/*.cy.js",
      "cypress/e2e/happyPath/platform/commonTestcases/**/*.cy.js",
    ],

    testIsolation: true,
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
