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
    // ORDER IS LOAD-BEARING — do not collapse into a single glob.
    //
    // Cypress resolves specPattern in array order and dedupes, and this suite
    // shares one instance, so earlier specs set up state later ones need:
    //   - firstUserOnboarding provisions the instance's first user.
    //   - updateLicense applies the EE license. Specs after it create workspaces,
    //     groups and granular permissions freely; specs before it are capped by
    //     the default plan. Running e.g. access/userRoleUI (a workspace per test)
    //     ahead of it returns 451 "You have reached your limit for number of
    //     workspaces" and kills the suite in beforeEach.
    //
    // Groups below reproduce the pre-restructure order, remapped to product-area
    // paths. Every area is named explicitly; the trailing glob is a safety net so
    // a newly added spec still runs rather than silently not existing.
    specPattern: [
      "cypress/e2e/happyPath/platform/onboarding/firstUserOnboarding.cy.js",   // was firstUser/
      "cypress/e2e/happyPath/platform/licensing/basicPlan/**/*.cy.js",         // was licensing/basicPlanTestcases/
      "cypress/e2e/happyPath/platform/licensing/paidPlan/**/*.cy.js",          // was licensing/paidPlanTestcases/
      "cypress/e2e/happyPath/platform/licensing/updateLicense.ee.cy.js",       // applies the EE license
      "cypress/e2e/happyPath/platform/onboarding/googleSso.ee.cy.js",          // was sso/
      "cypress/e2e/happyPath/platform/onboarding/ldapOnboarding.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/oidcOkta.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/openId.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/samlUI.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/instanceLogin*.ee.cy.js",     // was settings/
      "cypress/e2e/happyPath/platform/workspace/multiEnvironment.ee.cy.js",    // was multi-env/
      "cypress/e2e/happyPath/platform/externalApi/**/*.cy.js",                 // was externalApi/
      "cypress/e2e/happyPath/platform/access/userMetadata.ee.cy.js",           // was userMetadata/
      "cypress/e2e/happyPath/platform/superAdmin/**/*.cy.js",                  // was superAdmin/
      "cypress/e2e/happyPath/platform/onboarding/manageSSO.ce.cy.js",          // was ceTestcases/

      // former commonTestcases, in its original sub-order
      "cypress/e2e/happyPath/platform/apps/**/*.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/*.cy.js",
      "cypress/e2e/happyPath/platform/access/**/*.cy.js",
      "cypress/e2e/happyPath/platform/workspace/dashboard.cy.js",
      "cypress/e2e/happyPath/platform/workspace/errorPage.cy.js",
      "cypress/e2e/happyPath/platform/workspace/homePageDashboard.cy.js",
      "cypress/e2e/happyPath/platform/workspace/profile.cy.js",
      "cypress/e2e/happyPath/platform/workspace/workspace.cy.js",
      "cypress/e2e/happyPath/platform/workspace/constants*.cy.js",

      // safety net: anything new in any area still runs even if not named above
      "cypress/e2e/happyPath/platform/**/*.cy.js",
    ],

    // gitSync runs from cypress-gitsync.config.js under its own CI label
    // (run-cypress-git-sync-ee); licensing/ai is covered by the BYOK/AI suite.
    // Neither was matched by this config before the restructure, so the resolved
    // set is unchanged at 59 specs.
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
