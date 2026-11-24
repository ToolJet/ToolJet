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

      const launchHandlers = [];
      const onProxy = (event, handler) => {
        if (event === "before:browser:launch") {
          launchHandlers.push(handler);
          return;
        }
        on(event, handler);
      };

      launchHandlers.push((browser = {}, launchOptions) => {
        const width = 1920;
        const height = 1280;
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.args.push(`--window-size=${width},${height}`);
        }
        if (browser.name === "electron") {
          launchOptions.preferences.width = width;
          launchOptions.preferences.height = height;
        }
        return launchOptions;
      });

      on("task", {
        readPdf(pathToPdf) {
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
        readXlsx(filePath) {
          return new Promise((resolve, reject) => {
            try {
              let dataBuffer = fs.readFileSync(filePath);
              const jsonData = XLSX.parse(dataBuffer);
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
        deleteFile(filePath) {
          return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
              if (err && err.code !== "ENOENT") return reject(err);
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

      config = require("./cypress/plugins/index.js")(onProxy, config);
      // cypress-live-reporter — self-disables when no CLR sink is set in cypress env.
      const result = require("cypress-live-reporter/plugin").livePlugin(
        onProxy,
        config
      );

      // The one handler Cypress actually sees: runs every collected handler in
      // registration order, each receiving the previous one's launchOptions.
      on("before:browser:launch", async (browser, launchOptions) => {
        let options = launchOptions;
        for (const handler of launchHandlers) {
          const next = await handler(browser, options);
          if (next) options = next;
        }
        return options;
      });

      return result;
    },
    env: {
      CLR_PROJECT_ID: "tooljet-database",
    },
    downloadsFolder: "cypress/downloads",
    baseUrl: "http://localhost:8082",
    specPattern: [
      // ToolJet Database multi-environment, promote and migrations are EE-licensed
      // features, so the license has to be applied before the suite runs.
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/updateLicense.cy.js",
      "cypress/e2e/happyPath/tooljetDatabase/**/*.cy.js",
    ],
    numTestsKeptInMemory: 1,
    redirectionLimit: 7,
    experimentalRunAllSpecs: true,
    experimentalModfyObstructiveThirdPartyCode: true,
    experimentalMemoryManagement: true,
    video: false,
    videoUploadOnPasses: false,
    retries: {
      runMode: 0,
      openMode: 0,
    },
  },
});
