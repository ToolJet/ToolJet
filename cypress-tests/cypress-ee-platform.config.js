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

    baseUrl: "http://localhost:3000",

    specPattern: [
      "cypress/e2e/happyPath/platform/onboarding/firstUserOnboarding.cy.js",   
      "cypress/e2e/happyPath/platform/licensing/basicPlan/**/*.cy.js",        
      "cypress/e2e/happyPath/platform/licensing/paidPlan/**/*.cy.js",          
      "cypress/e2e/happyPath/platform/licensing/updateLicense.ee.cy.js",       
      "cypress/e2e/happyPath/platform/onboarding/googleSso.ee.cy.js",          
      "cypress/e2e/happyPath/platform/onboarding/ldapOnboarding.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/oidcOkta.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/openId.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/samlUI.ee.cy.js",
      "cypress/e2e/happyPath/platform/onboarding/instanceLogin*.ee.cy.js",     
      "cypress/e2e/happyPath/platform/workspace/multiEnvironment.ee.cy.js",    
      "cypress/e2e/happyPath/platform/externalApi/**/*.cy.js",                 
      "cypress/e2e/happyPath/platform/access/userMetadata.ee.cy.js",          
      "cypress/e2e/happyPath/platform/superAdmin/**/*.cy.js",                  
      "cypress/e2e/happyPath/platform/modules/**/*.cy.js",                     
      "cypress/e2e/happyPath/platform/onboarding/manageSSO.ce.cy.js",          
      "cypress/e2e/happyPath/platform/**/*.cy.js",
    ],

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
