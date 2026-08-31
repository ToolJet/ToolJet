import { Environments } from "Constants/constants/multiEnv";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { versionModalSelector } from "Selectors/eeCommon";
import { moduleSelectors } from "Selectors/platform/modules";
import {
  createModuleDraftVersion,
  createModuleViaAPI,
  dropModuleComponent,
  publishModuleVersion,
  switchModuleEditorVersion,
} from "Support/utils/platform/modules";
import { appPromote } from "Support/utils/platform/multiEnv";

describe("Modules — Versions", () => {
  const testId = Date.now();
  const wsName = `modules-versions-${testId}`;
  const wsSlug = wsName;
  const moduleName = `QA Module ${testId}`;
  const branchModuleName = `QA Branch ${testId}`;

  let workspaceId;

  before(() => {
    cy.apiLogin();
    cy.apiUpdateLicense("valid");
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

  it("creates a draft version, publishes it, and switches between versions", () => {
    createModuleViaAPI(moduleName);

    // Empty version name is rejected on save.
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(versionModalSelector.saveVersionButton("v1")).click();
    cy.get(versionModalSelector.versionNameInput).clear();
    cy.get(versionModalSelector.createVersionModal.saveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Version name should not be empty",
    );
    cy.get('[data-cy="save-version-title"]').should("be.visible");
    cy.get(commonWidgetSelector.modalCloseButton).click();

    // Publish v1 for real
    publishModuleVersion("v1", "v1");

    // Duplicate version name is rejected when creating a draft.
    cy.get(moduleSelectors.versionSwitcherButton).click();
    cy.get(commonSelectors.buttonSelector("create draft version")).click();
    cy.get(versionModalSelector.versionNameInput).clear().type("v1");
    cy.get(
      versionModalSelector.createDraftVersionModal.createDraftVersionFromInput,
    ).click();
    cy.contains(`[id*="react-select-"]`, "v1").click();
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Version name already exists.",
    );
    cy.get('[data-cy="create-draft-version-title"]').should("be.visible");
    cy.get(commonWidgetSelector.modalCloseButton).click();

    // v1 is already saved/locked.
    createModuleDraftVersion("v2-draft");
    cy.get(moduleSelectors.versionSwitcherButton).should(
      "contain.text",
      "v2-draft",
    );

    // Edit made in the new draft:
    cy.get(moduleSelectors.moduleContainerWidget).click();
    cy.wait(500);
    dropModuleComponent("Text"); // -> text1
    cy.wait(500);

    cy.get(moduleSelectors.moduleContainerWidget).click();
    cy.wait(500);
    cy.get(commonWidgetSelector.widgetConfigHandle("modulecontainer")).click();
    cy.get('[data-cy="draggable-widget-text1"]').should("exist");

    publishModuleVersion("v2-draft", "v2-published");

    // Switching back to v1 shouldn't show the edit made in v2-draft.
    switchModuleEditorVersion("v1");

    cy.get(moduleSelectors.moduleContainerWidget).click();
    cy.wait(500);
    cy.get(commonWidgetSelector.widgetConfigHandle("modulecontainer")).click();
    cy.get('[data-cy="draggable-widget-text1"]').should("not.exist"); // v1 predates this edit

    // Switching to v2-published should show it.
    switchModuleEditorVersion("v2-published");

    cy.get(moduleSelectors.moduleContainerWidget).click();
    cy.wait(500);
    cy.get(commonWidgetSelector.widgetConfigHandle("modulecontainer")).click();
    cy.get('[data-cy="draggable-widget-text1"]').should("exist");
  });

  it("keeps draft branches isolated — a new draft inherits from the version you pick, not whatever's latest", () => {
    createModuleViaAPI(branchModuleName);

    // v1: drop one component, then save/lock it.
    dropModuleComponent("Text",500, 100); // -> text1
    publishModuleVersion("v1", "v1");

    // Promote through environments and release.
    appPromote(Environments.development, Environments.staging);
    appPromote(Environments.staging, "production");

    // v2, branched from v1 (the only saved version at this point) — add a
    // second component, so v2 has both text1 (inherited) and text2 (new).
    createModuleDraftVersion("v2-draft");
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("exist");
    // Container already has text1, so drop directly rather than reusing
    // dropModuleComponent (which requires the blank-container placeholder).
    cy.dragAndDropWidget("Text", 500, 200); // -> text2
    cy.get(commonWidgetSelector.draggableWidget("text2")).should("exist");
    publishModuleVersion("v2-draft", "v2-published");

    // Switching back to v1 (the older version) should show ONLY its own
    // component, not the one added in v2.
    switchModuleEditorVersion("v1");
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("exist");
    cy.get(commonWidgetSelector.draggableWidget("text2")).should("not.exist");

    // A new draft explicitly branched from v1

    createModuleDraftVersion("v3-draft", "v1");
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("exist");
    cy.get(commonWidgetSelector.draggableWidget("text2")).should("not.exist");
  });
});
