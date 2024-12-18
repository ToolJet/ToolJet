const { defineConfig } = require("cypress");
const { rmdir } = require("fs");
const fs = require("fs");
const XLSX = require("node-xlsx");
const pg = require("pg");
const path = require("path");
const pdf = require("pdf-parse");

// Define base URLs and config files for different environments/labels
const environments = {
    'run-cypress-platform': {
        baseUrl: "http://localhost:8082",
        configFile: "cypress-platform.config.js"
    },
    'run-cypress-platform-subpath': {
        baseUrl: "http://localhost:3000/apps",
        configFile: "cypress-platform.config.js"
    },
    'run-cypress-platform-proxy': {
        baseUrl: "http://localhost:4001",
        configFile: "cypress-platform.config.js"
    },
    'run-cypress-platform-proxy-subpath': {
        baseUrl: "http://localhost:4001/apps",
        configFile: "cypress-platform.config.js"
    }
};

// Get environment from GitHub Actions label or default to 'run-cypress-platform'
const githubLabel = process.env.GITHUB_LABEL || 'run-cypress-platform';
const environment = environments[githubLabel];

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
        setupNodeEvents (on, config) {
            // Set baseUrl based on environment
            config.baseUrl = environment.baseUrl;

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
                updateId ({ dbconfig, sql }) {
                    const client = new pg.Pool(dbconfig);
                    return client.query(sql);
                },
            });

            return require("./cypress/plugins/index.js")(on, config);
        },
        downloadsFolder: "cypress/downloads",
        experimentalRunAllSpecs: true,
        experimentalModfyObstructiveThirdPartyCode: true,
        baseUrl: environment.baseUrl, // Default baseUrl from environment
        configFile: environment.configFile, // Config file based on environment
        specPattern: [
            "cypress/e2e/happyPath/platform/ceTestcases/userFlow/firstUserOnboarding.cy.js",
            "cypress/e2e/happyPath/platform/ceTestcases/!(userFlow)/**/*.cy.js",
            "cypress/e2e/happyPath/platform/commonTestcases/**/*.cy.js",
        ],
        numTestsKeptInMemory: 1,
        redirectionLimit: 15,
        experimentalMemoryManagement: true,
        video: false,
        videoUploadOnPasses: false,
        retries: {
            runMode: 2,
            openMode: 0,
        },
    },
});