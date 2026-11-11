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
      // Card menus only open when an IntersectionObserver (threshold 1.0)
      // reports the card as fully visible. If the runner window is smaller
      // than the viewport, Cypress scales the page and the ratio lands a hair
      // under 1.0, so the menu never opens. Forcing a window big enough for
      // the viewport keeps the scale at 1.
      //
      // Cypress keeps only the LAST before:browser:launch handler registered,
      // and cypress-real-dnd (loaded via cypress/plugins/index.js) registers
      // its own after this file. onProxy collects every handler into an array
      // so the composite handler below can run them all in sequence.
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
      CLR_PROJECT_ID: "workflows",
    },
    downloadsFolder: "cypress/downloads",
    baseUrl: "http://localhost:8082",
    specPattern: [
      // Workflows are an EE-licensed feature, so the license has to be applied
      // before the suite runs — same ordering the App Builder config uses.
      "cypress/e2e/happyPath/platform/eeTestcases/licensing/updateLicense.cy.js",
      "cypress/e2e/happyPath/workflows/**/*.cy.js",
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
