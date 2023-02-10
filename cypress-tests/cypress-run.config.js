const { defineConfig } = require("cypress");
const { rmdir } = require("fs");
const pg = require("pg");

module.exports = defineConfig({
  execTimeout: 1800000,
  defaultCommandTimeout: 30000,
  requestTimeout: 10000,
  pageLoadTimeout: 20000,
  responseTimeout: 10000,
  viewportWidth: 1200,
  viewportHeight: 960,
  chromeWebSecurity: false,
  trashAssetsBeforeRuns: true,

  e2e: {
    setupNodeEvents(on, config) {
      on("task", { 
        deleteFolder(folderName) {
          return new Promise((resolve, reject) => {
            rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
              if (err) {
                console.error(err);
                return reject(err);
              }
              resolve(null);
            });
          });
        },
      });

      on("task", {
        UpdateId({ dbconfig, sql }) {
          const client = new pg.Pool(dbconfig);
          return client.query(sql);
        },
      });

      return require("./cypress/plugins/index.js")(on, config);
    },
    experimentalRunAllSpecs: true,
    experimentalModfyObstructiveThirdPartyCode: true,
    experimentalRunAllSpecs: true,
    baseUrl: "http://localhost:8082",
    specPattern: ["cypress/e2e/editor/**/*.cy.js","cypress/e2e/exportImport/**/*.cy.js", "cypress/e2e/authentication/**/*.cy.js", "cypress/e2e/dashboard/multi-workspace/**/*.cy.js","cypress/e2e/dashboard/*.cy.js", ],
    numTestsKeptInMemory: 1,
    redirectionLimit: 10,
    experimentalRunAllSpecs: true,
    experimentalMemoryManagement: true,
  },
});
