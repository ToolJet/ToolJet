const { defineConfig } = require("cypress");
const { rmdir } = require("fs");

module.exports = defineConfig({
  execTimeout: 1800000,
  defaultCommandTimeout: 30000,
  requestTimeout: 10000,
  pageLoadTimeout: 20000,
  responseTimeout: 10000,
  viewportWidth: 1200,
  viewportHeight: 960,
  chromeWebSecurity: true,
  trashAssetsBeforeRuns: true,
  env: {
    pg_host: "",
    pg_user: "",
    pg_password: "",
  },
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

      return require("./cypress/plugins/index.js")(on, config);
    },
    baseUrl: "http://localhost:8082",
    specPattern: "cypress/e2e/**/*.cy.js",
  },
});
