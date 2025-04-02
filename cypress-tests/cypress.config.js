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
  requestTimeout: 30000,
  pageLoadTimeout: 30000,
  responseTimeout: 30000,
  viewportWidth: 1440,
  viewportHeight: 960,
  chromeWebSecurity: false,
  trashAssetsBeforeRuns: true,

  e2e: {
    setupNodeEvents (on, config) {
      on("task", {
        readPdf (pathToPdf) {
          return new Promise((resolve) => {
            const pdfPath = path.resolve(pathToPdf);
            let dataBuffer = fs.readFileSync(pdfPath);
            pdf(dataBuffer).then(function ({ text }) {
              resolve(text);
            });
          });
        },
      });

      on("task", {
        readXlsx (filePath) {
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
        deleteFolder (folderName) {
          return new Promise((resolve, reject) => {
            if (fs.existsSync(folderName)) {
              rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
                if (err) {
                  console.error(err);
                  return reject(err);
                }
                return resolve(null);
              });
            } else {
              return resolve(null);
            }
          });
        },
      });

      on("task", {
        dbConnection ({ dbconfig, sql }) {
          const client = new pg.Pool(dbconfig);
          return client.query(sql);
        },
      });
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless === false) {
          launchOptions.args.push(
            '--disable-features=AutofillAccountStorage,PasswordManager',
            '--disable-save-password-bubble',
            '--disable-password-generation',
            '--disable-password-manager-reauthentication'
          );
        }
        return launchOptions;
      });
      require("@cypress/code-coverage/task")(on, config);
      // return config;

      require("./cypress/plugins/index.js")(on, config);
      return config;
    },
    experimentalRunAllSpecs: true,
    experimentalModfyObstructiveThirdPartyCode: true,
    experimentalRunAllSpecs: true,
    baseUrl: "http://localhost:8082",
    specPattern: [
      "cypress/e2e/happyPath/platform/ceTestcases/userFlow/firstUserOnboarding.cy.js",
      "cypress/e2e/happyPath/platform/ceTestcases/!(userFlow)/**/*.cy.js",
      "cypress/e2e/happyPath/platform/commonTestcases/**/*.cy.js",
    ],
    downloadsFolder: "cypress/downloads",
    numTestsKeptInMemory: 0,
    redirectionLimit: 10,
    experimentalRunAllSpecs: true,
    trashAssetsBeforeRuns: true,
    experimentalMemoryManagement: true,
    coverage: true,
    codeCoverageTasksRegistered: true,
    video: false,
    videoUploadOnPasses: false,
    experimentalStudio: true,
  },
});
