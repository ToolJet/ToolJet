import { commonSelectors } from "Selectors/common";
import { moduleSelectors } from "Selectors/platform/modules";
import { deleteDownloadsFolder } from "Support/utils/common";
import { createModuleViaAPI, openModulesList } from "Support/utils/platform/modules";


describe("Module Export", () => {
  const testId = Date.now();
  const wsName = `modules-export-${testId}`;
  const wsSlug = wsName;
  const moduleName = `QA Module ${testId}`;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });
  });

  after(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  beforeEach(() => {
    deleteDownloadsFolder();
    cy.exec("mkdir -p ./cypress/downloads/");

    cy.apiLogin();
  });

  it("should export a module and verify the downloaded file", () => {
    createModuleViaAPI(moduleName);

    openModulesList();

    // Same card-menu convention already used for "rename module"/"delete module"
    // in Support/utils/platform/modules.js (renameModuleFromList /
    // attemptDeleteModuleFromList) — hover the card, open its menu, pick the option.
    cy.get(commonSelectors.appCard(moduleName))
      .trigger("mousehover")
      .trigger("mouseenter")
      .find(moduleSelectors.appCardMenuIcon)
      .click({ force: true });
    cy.get(commonSelectors.appCardOptions("export module")).click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Module has been exported successfully!"
    );

    // The exported filename replaces spaces in the module name with hyphens:

    const hyphenatedModuleName = moduleName.replace(/\s+/g, "-");

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedModuleExportFileName = result.stdout.split("\n")[0];
      const filePath = `./cypress/downloads/${downloadedModuleExportFileName}`;

      expect(downloadedModuleExportFileName).to.contain(hyphenatedModuleName);

      cy.readFile(filePath).then((moduleData) => {
        expect(moduleData.app[0].definition.appV2.type).to.equal("module");
        expect(moduleData.app[0].definition.appV2.name).to.equal(moduleName);
      });
    });
  });
});
