import { commonSelectors } from "Selectors/common";
import { importSelectors } from "Selectors/platform/exportImport";
import { deleteDownloadsFolder } from "Support/utils/common";
import { clickOnExportButtonAndVerify } from "Support/utils/exportImport";
import { createSeedApp, signUpOnPlan } from "Support/utils/platform/workspaceLicence";
import { commonText } from "Texts/common";
import { exportAppModalText } from "Texts/platform/exportImport";

const PLANS = ["basic", "team"];
const uniqueName = (prefix) => `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
const ONE_VERSION_FIXTURE = "cypress/fixtures/templates/one_version.json";

const openCardOption = (appName, option) => {
  cy.contains(".homepage-app-card", appName, { timeout: 30000 }).trigger("mouseover");
  cy.get('[data-cy="app-card-menu-icon"]').first().click({ force: true });
  cy.get('[data-cy="card-options"]').should("be.visible");
  cy.get(commonSelectors.appCardOptions(option)).should("be.visible").click();
};

const visitHome = (workspaceId) =>
  cy.visit(`/${workspaceId}`, {
    onBeforeLoad: (win) => win.localStorage.setItem("walkthroughCompleted", "true"),
  });

describe("Cloud workspace licence scoping: app export, clone and import (UI)", { retries: 0 }, () => {
  PLANS.forEach((plan) => {
    context(`on a ${plan} workspace`, () => {
      let workspaceId;
      let appName;

      beforeEach(() => {
        deleteDownloadsFolder();
        cy.exec("mkdir -p ./cypress/downloads/");
        appName = uniqueName("wsl-ui");
        signUpOnPlan(plan, "cloud-wsl-ui").then(({ workspaceId: id }) => {
          workspaceId = id;
          return createSeedApp(id, appName);
        });
      });

      it(`WSL-UI-01 exports an app from the app card menu (${plan})`, () => {
        cy.intercept("POST", "**/api/v2/resources/export").as("exportApp");
        cy.then(() => visitHome(workspaceId));

        openCardOption(appName, commonText.exportAppOption);
        clickOnExportButtonAndVerify(exportAppModalText.exportAll, appName);

        cy.wait("@exportApp").its("response.statusCode").should("eq", 201);
      });

      it(`WSL-UI-02 clones an app from the app card menu and lands in the copy (${plan})`, () => {
        const cloneName = uniqueName("wsl-ui-copy");
        cy.intercept("POST", "**/api/v2/resources/clone").as("cloneApp");
        cy.then(() => visitHome(workspaceId));

        openCardOption(appName, commonText.cloneAppOption);
        cy.clearAndType(commonSelectors.appNameInput, cloneName);
        cy.get(commonSelectors.cloneAppButton).click();

        cy.wait("@cloneApp").its("response.statusCode").should("eq", 201);
        cy.verifyToastMessage(commonSelectors.toastMessage, "App cloned successfully!");
        cy.url({ timeout: 30000 }).should("include", "/apps/");
        cy.get('[data-cy="editor-app-name-input"]', { timeout: 30000 }).should("be.visible");
      });

      it(`WSL-UI-03 imports an app from a file and opens it in the editor (${plan})`, () => {
        const importedName = uniqueName("wsl-ui-import");
        cy.intercept("POST", "**/api/v2/resources/import").as("importApp");
        cy.then(() => visitHome(workspaceId));

        cy.get(importSelectors.dropDownMenu, { timeout: 30000 }).should("be.visible").click();
        cy.get(importSelectors.importOptionInput).eq(0).selectFile(ONE_VERSION_FIXTURE, { force: true });
        cy.clearAndType(commonSelectors.appNameInput, importedName);
        cy.get(importSelectors.importAppButton).click();

        cy.wait("@importApp").its("response.statusCode").should("eq", 201);
        cy.get('[data-cy="editor-app-name-input"]', { timeout: 30000 }).should("be.visible");
        cy.url().should("include", "/apps/");
      });
    });
  });
});
