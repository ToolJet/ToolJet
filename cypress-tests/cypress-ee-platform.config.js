const { defineConfig } = require("cypress");

const environments = {
    'run-cypress-platform': {
        baseUrl: "http://localhost:3000",
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

const githubLabel = process.env.GITHUB_LABEL || 'run-cypress-platform';
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

    e2e: {
        setupNodeEvents(on, config) {
            config.baseUrl = environment.baseUrl;

            require("./cypress/config/tasks")(on);
            require("./cypress/config/browserConfig")(on);

            return require("./cypress/plugins/index.js")(on, config);
        },

        baseUrl: environment.baseUrl,
        configFile: environment.configFile,
        specPattern: [
            "cypress/e2e/happyPath/platform/firstUser/firstUserOnboarding.cy.js",
            "cypress/e2e/happyPath/platform/eeTestcases/license/**/*.cy.js",
            "cypress/e2e/happyPath/platform/eeTestcases/groups/**/*.cy.js",
            "cypress/e2e/happyPath/platform/commonTestcases/**/*.cy.js",
            "cypress/e2e/happyPath/platform/ceTestcases/**/*.cy.js",
            "cypress/e2e/happyPath/platform/eeTestcases/!(license|groups)/**/*.cy.js",
        ],

        testIsolation: true,
        retries: {
            runMode: 2,
            openMode: 0,
        },
        redirectionLimit: 7,

        numTestsKeptInMemory: 1,
        experimentalMemoryManagement: true,

        experimentalRunAllSpecs: true,
        experimentalModifyObstructiveThirdPartyCode: true,
        experimentalOriginDependencies: true,

        downloadsFolder: "cypress/downloads",
        trashAssetsBeforeRuns: true,
        video: false,
        videoUploadOnPasses: false,
        screenshotOnRunFailure: true,
        screenshotsFolder: 'cypress/screenshots',

        coverage: false,
        codeCoverageTasksRegistered: false,
    },
});