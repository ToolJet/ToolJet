const { defineConfig } = require("cypress");
const { rmdir } = require("fs");
const fs = require("fs");
const XLSX = require("node-xlsx");

const pg = require("pg");
const path = require("path");
const pdf = require("pdf-parse");

module.exports = defineConfig({
  execTimeout: 1800000,
  defaultCommandTimeout: 30000,
  requestTimeout: 10000,
  pageLoadTimeout: 20000,
  responseTimeout: 10000,
  viewportWidth: 1440,
  viewportHeight: 960,
  chromeWebSecurity: false,
  trashAssetsBeforeRuns: true,

  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        readPdf(pathToPdf) {
          return new Promise((resolve, reject) => {
            const pdfPath = path.resolve(pathToPdf);
            let dataBuffer = fs.readFileSync(pdfPath);
            // reject (fails the calling test) instead of an unhandled rejection that crashes the whole run
            pdf(dataBuffer).then(function ({ text }) {
              resolve(text);
            }, reject);
          });
        },
      });

      on("task", {
        readXlsx(filePath) {
          return new Promise((resolve, reject) => {
            try {
              let dataBuffer = fs.readFileSync(filePath);
              const jsonData = XLSX.parse(dataBuffer);
              // jsonData= jsonData[0].data
              resolve(jsonData[0]["data"].toString());
            } catch (e) {
              reject(e);
            }
          });
        },
      });

      on("task", {
        deleteFolder(folderName) {
          return new Promise((resolve, reject) => {
            rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
              // a folder that does not exist yet is already "deleted" (a fresh CI checkout has no
              // cypress/downloads until the first download; Node's recursive rmdir throws ENOENT for it)
              if (err && err.code === "ENOENT") return resolve(null);
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
        dbConnection({ dbconfig, sql }) {
          const client = new pg.Pool(dbconfig);
          return client.query(sql);
        },
      });

      config = require("./cypress/plugins/index.js")(on, config);
      // cypress-live-reporter — self-disables when no CLR sink is set in cypress env.
      return require("cypress-live-reporter/plugin").livePlugin(on, config);
    },
    env: {
      CLR_PROJECT_ID: "appbuilder",
    },
    downloadsFolder: "cypress/downloads",
    experimentalRunAllSpecs: true,
    experimentalModfyObstructiveThirdPartyCode: true,
    experimentalRunAllSpecs: true,
    baseUrl: "http://localhost:8082",
    specPattern: [
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/updateLicense.cy.js",
      "cypress/e2e/happyPath/appbuilder/**/*.cy.js"
    ],
    numTestsKeptInMemory: 1,
    redirectionLimit: 7,
    experimentalRunAllSpecs: true,
    experimentalMemoryManagement: true,
    video: false,
    videoUploadOnPasses: false,
    retries: {
      runMode: 0,
      openMode: 0,
    },
  },
});
