import { commonSelectors } from "Selectors/common";
import { importSelectors } from "Selectors/exportImport";
import { importAndVerifyApp } from "Support/utils/exportImport";
import { openModulesList } from "Support/utils/platform/modules";
import { importText } from "Texts/exportImport";



describe("Module Import", () => {
  const testId = Date.now();
  const wsName = `modules-import-${testId}`;
  const wsSlug = wsName;

  const TEST_DATA = {
    toolJetImage: "cypress/fixtures/Image/tooljet.png",
    invalidApp: "cypress/fixtures/templates/invalid_app.json",
    moduleFile: "cypress/fixtures/templates/modules/one version module.json",
    appFile: "cypress/fixtures/templates/one_version.json",
  };


  const moduleFileName = "one version module";
  const appFileName = "one_version";

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
    cy.apiLogin();
  });

  it("should verify invalid import files", () => {
    openModulesList();
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
      "have.text",
      importText.importOption
    );

    importAndVerifyApp(
      TEST_DATA.toolJetImage,
      importText.couldNotImportAppToastMessage
    );

    // Reopen fresh rather than assuming the dropdown stayed open after the
    // previous selectFile/toast — modules has no equivalent of appImport.cy.js's
    // "click dashboardSelector.importAppButton again" re-trigger button.
    openModulesList();
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    importAndVerifyApp(
      TEST_DATA.invalidApp,
      "Could not import: SyntaxError: Expected ',' or '}' after property value in JSON at position 246 (line 11 column 13)"
    );
  });

  it("should verify a module imports successfully with valid file", () => {
    openModulesList();
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(TEST_DATA.moduleFile, { force: true });
    cy.wait(2000);

    cy.get('[data-cy="import-module-title"]').verifyVisibleElement(
      "have.text",
      "Import module"
    );
    cy.get('[data-cy="module-name-label"]').verifyVisibleElement(
      "have.text",
      "Module name"
    );
    cy.get('[data-cy="module-name-input"]')
      .should("be.visible")
      .and("have.value", moduleFileName);
    cy.get('[data-cy="module-name-info-label"]').verifyVisibleElement(
      "have.text",
      "Module name must be unique and max 100 characters"
    );
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", "Cancel");
    cy.get('[data-cy="import-module"]').verifyVisibleElement(
      "have.text",
      "Import module"
    );

    cy.get('[data-cy="import-module"]').click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Module imported successfully.");

    cy.url({ timeout: 15000 }).should("include", "/apps/");
    cy.get('[data-cy="editor-app-name-input"]')
      .should("be.visible")
      .verifyVisibleElement("have.text", moduleFileName);
  });

  it("should reject cross-type import — an app file imported into the modules section", () => {
    openModulesList();
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(TEST_DATA.appFile, { force: true });
    cy.wait(2000);

    // The type check (frontend/src/HomePage/HomePage.jsx:importFile) only runs on
    // submit, not on file-select — the modal opens first, always titled for the
    // current section ("Import module"), regardless of the imported file's own type.
    cy.get('[data-cy="import-module-title"]').verifyVisibleElement(
      "have.text",
      "Import module"
    );
    cy.get('[data-cy="module-name-input"]')
      .should("be.visible")
      .and("have.value", appFileName);

    cy.get('[data-cy="import-module"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "App could not be imported in modules section. Switch to apps section and try again."
    );
  });
});
