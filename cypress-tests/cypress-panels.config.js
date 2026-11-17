// The panel audit's baselines hold laptop sub-pixel widths and some checks need EE, so CI's App
// Builder config excludes the folder and this config runs it.
const fs = require("fs");
const path = require("path");
const appBuilder = require("./cypress-appbuilder.config");

module.exports = {
  ...appBuilder,
  trashAssetsBeforeRuns: false,
  e2e: {
    ...appBuilder.e2e,
    baseUrl: `http://localhost:${process.env.FRONTEND_PORT || 8082}`,
    specPattern: "cypress/e2e/happyPath/appbuilder/panels/*.cy.js",
    excludeSpecPattern: [],
    async setupNodeEvents(on, config) {
      const resolved = await appBuilder.e2e.setupNodeEvents(on, config);
      on("after:screenshot", ({ name, path: from }) => {
        if (!name?.startsWith("evidence/")) return undefined;
        const to = path.resolve("cypress", `${name}.png`);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.renameSync(from, to);
        return { path: to };
      });
      // Set here because cypress.env.json would override the config file's env.
      resolved.env.environment = "Enterprise";
      resolved.env.server_host ??= `http://localhost:${process.env.SERVER_PORT || 3000}`;
      return resolved;
    },
  },
};
