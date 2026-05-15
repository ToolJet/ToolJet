import { commonSelectors, commonText } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { viewAppCardOptions } from "Support/utils/common";
import {
  openAddToFolderModal,
  addAppsToMultiSelect,
  selectDestinationFolder,
} from "Support/utils/bulkMoveApps";

// ──────────────────────────────────────────────────────────────────────────────
// Part 1 — Common Cases (Git Sync enabled workspace)
// Verifies bulk move works normally even when git sync is configured.
// Each test gets a fresh workspace with git sync enabled.
// ──────────────────────────────────────────────────────────────────────────────
describe("Git Sync — Bulk Move Apps: Common Cases", { retries: 0 }, () => {
  const testId = Date.now();
  const appNameA = `GS-AppA-${testId}`;
  const appNameB = `GS-AppB-${testId}`;
  const appNameC = `GS-AppC-${testId}`;
  const folderDestName = `gs-folder-dest-${testId}`;

  let workspaceId, appIdA, folderDestId;

  beforeEach(() => {
    cy.apiLogin();
    cy.viewport(1440, 1200);
    const wsName = `gs-bulk-${Date.now()}`;
    cy.apiCreateWorkspace(wsName, wsName).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsName);
    });
    cy.gitSyncCheckAndConfigure();
    cy.apiCreateApp(appNameA);
    cy.then(() => { appIdA = Cypress.env("appId"); });
    cy.apiCreateApp(appNameB);
    cy.apiCreateApp(appNameC);
    cy.apiCreateFolder(folderDestName, "front-end");
    cy.then(() => { folderDestId = Cypress.env("createdFolderId"); });
  });

  afterEach(() => {
    cy.apiLogin();
    cy.apiArchiveWorkspace(workspaceId);
  });

  it("should move apps to a folder using single-select and multi-select when git sync is enabled", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);

    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.updateFolderTitle).verifyVisibleElement(
      "have.text",
      dashboardText.updateFolderTitle
    );
    cy.get(dashboardSelector.moveAppText).should("be.visible");

    addAppsToMultiSelect(appNameB, appNameC);
    cy.get(dashboardSelector.moveAppText)
      .contains(dashboardText.nAppsSelected(3))
      .should("be.visible");

    selectDestinationFolder(folderDestName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderDestName),
      false
    );

    cy.get(dashboardSelector.folderName(folderDestName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
    cy.get(commonSelectors.appCard(appNameB)).should("be.visible");
    cy.get(commonSelectors.appCard(appNameC)).should("be.visible");
  });

  it("should support All apps and All in folder bulk select options when git sync is enabled", () => {
    const folderXName = `gs-folder-x-${testId}`;
    const folderYName = `gs-folder-y-${testId}`;
    const APP_COUNT = 10;
    const pagedAppNames = Array.from(
      { length: APP_COUNT },
      (_, i) => `GS-PagedApp${i}-${testId}`
    );
    let folderXId;

    cy.apiCreateFolder(folderXName, "front-end");
    cy.then(() => { folderXId = Cypress.env("createdFolderId"); });
    cy.apiCreateFolder(folderYName, "front-end");
    pagedAppNames.forEach((name) => {
      cy.apiCreateApp(name);
      cy.then(() => { cy.apiAddAppToFolder(folderXId, Cypress.env("appId")); });
    });

    // All apps (N) option — verify from main view using base apps
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.appsMultiSelectControl).click();
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allAppsOption(3))
      .should("be.visible")
      .click();
    cy.get(dashboardSelector.moveAppText)
      .contains(dashboardText.allAppsLabel)
      .should("be.visible");
    cy.get(commonSelectors.cancelButton).click();

    // All in this folder (10) option + pagination — verify from folder view
    cy.get(dashboardSelector.folderName(folderXName)).click();
    openAddToFolderModal(pagedAppNames[0]);
    cy.get(dashboardSelector.appsMultiSelectControl).click();
    cy.get(commonSelectors.folderList).then(($list) => {
      expect($list.find(".react-select__option").length).to.be.greaterThan(9);
    });
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allInFolderOption(APP_COUNT))
      .should("be.visible");

    cy.get(commonSelectors.folderList).contains(pagedAppNames[1]).click();
    cy.get(commonSelectors.folderList).contains(pagedAppNames[2]).click();
    cy.get("body").type("{esc}");

    selectDestinationFolder(folderYName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderYName),
      false
    );
  });

  it("should show success toast when a duplicate app assignment is skipped and git sync is enabled", () => {
    const appDupName = `GS-AppDup-${testId}`;
    const folderXName = `gs-folder-dup-x-${testId}`;
    const folderYName = `gs-folder-dup-y-${testId}`;
    let folderXId, folderYId;

    cy.apiCreateFolder(folderXName, "front-end");
    cy.then(() => { folderXId = Cypress.env("createdFolderId"); });
    cy.apiCreateFolder(folderYName, "front-end");
    cy.then(() => { folderYId = Cypress.env("createdFolderId"); });

    cy.apiAddAppToFolder(folderXId, appIdA);
    cy.apiCreateApp(appDupName);
    cy.then(() => {
      const dupId = Cypress.env("appId");
      cy.apiAddAppToFolder(folderXId, dupId);
      cy.apiAddAppToFolder(folderYId, dupId);
    });

    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(dashboardSelector.folderName(folderXName)).click();

    openAddToFolderModal(appNameA);
    addAppsToMultiSelect(appDupName);
    cy.get("body").type("{esc}");

    selectDestinationFolder(folderYName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderYName),
      false
    );

    cy.get(dashboardSelector.folderName(folderYName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
  });

  it("should validate modal state and not move apps on cancel when git sync is enabled", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);

    // Button stays disabled until a folder is chosen
    openAddToFolderModal(appNameA);
    cy.get(dashboardSelector.addToFolderButton).should("be.disabled");
    selectDestinationFolder(folderDestName);
    cy.get(dashboardSelector.addToFolderButton).should("not.be.disabled");

    // Removing the only selected app shows an error on submit
    cy.get(dashboardSelector.appsMultiSelectValueRemove).first().click({ force: true });
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.selectFolderError,
      false
    );

    // Cancel closes the modal without moving anything
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");

    openAddToFolderModal(appNameA);
    addAppsToMultiSelect(appNameB);
    selectDestinationFolder(folderDestName);
    cy.get(commonSelectors.cancelButton).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(commonSelectors.toastMessage).should("not.exist");

    cy.get(dashboardSelector.folderName(folderDestName)).click();
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );
  });

  it("should allow selecting any folder from a scrollable list when many folders exist and git sync is enabled", () => {
    const FOLDER_COUNT = 12;
    const extraFolderNames = Array.from(
      { length: FOLDER_COUNT },
      (_, i) => `gs-scroll-folder-${i}-${testId}`
    );

    extraFolderNames.forEach((name) => {
      cy.apiCreateFolder(name, "front-end");
    });

    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    openAddToFolderModal(appNameA);

    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).should("be.visible");

    const lastFolder = extraFolderNames[FOLDER_COUNT - 1];
    cy.get(commonSelectors.folderList).scrollTo("bottom");
    cy.get(commonSelectors.folderList).contains(lastFolder).should("be.visible").click();

    cy.get(dashboardSelector.addToFolderButton).should("not.be.disabled").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(lastFolder),
      false
    );
  });

  it("should remove an app from a folder successfully when git sync is enabled", () => {
    cy.apiAddAppToFolder(folderDestId, appIdA);

    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(dashboardSelector.folderName(folderDestName)).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");

    viewAppCardOptions(appNameA);
    cy.get(commonSelectors.appCardOptions(commonText.removeFromFolderOption)).click();
    cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appRemovedFromFolderTaost,
      false
    );

    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );

    cy.get(commonSelectors.allApplicationsLink).click();
    cy.get(commonSelectors.appCard(appNameA)).should("be.visible");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Part 2 — Git Sync Folder Guards
// Each test gets its own isolated workspace with git sync enabled.
// ──────────────────────────────────────────────────────────────────────────────
describe("Git Sync — Bulk Move Apps: Folder Guard Cases", { retries: 0 }, () => {
  const testId = Date.now() + 1;
  let workspaceId;

  beforeEach(() => {
    cy.apiLogin();
    cy.viewport(1440, 1200);
    const wsName = `gs-guards-${Date.now()}`;
    cy.apiCreateWorkspace(wsName, wsName).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsName);
    });
    cy.gitSyncCheckAndConfigure();
  });

  afterEach(() => {
    cy.apiLogin();
    cy.apiArchiveWorkspace(workspaceId);
  });

  it("should hide folder rename and delete options for front-end folders when git sync is enabled", () => {
    const folderName = `gs01-fe-folder-${testId}`;

    cy.apiCreateFolder(folderName, "front-end");

    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(dashboardSelector.folderName(folderName)).should("be.visible");

    cy.get(commonSelectors.folderListcard(folderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(folderName)).should("not.exist");
      });
  });

  it("should hide folder rename and delete options for module folders when git sync is enabled", () => {
    const folderName = `gs02-mod-folder-${testId}`;

    cy.apiCreateFolder(folderName, "module");

    cy.visit(`/${Cypress.env("workspaceSlug")}/modules`);
    cy.get(dashboardSelector.folderName(folderName)).should("be.visible");

    cy.get(commonSelectors.folderListcard(folderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(folderName)).should("not.exist");
      });
  });

  it("should show folder rename and delete options for workflow folders when git sync is enabled", () => {
    const folderName = `gs04-wf-folder-${testId}`;

    cy.apiCreateFolder(folderName, "workflow");

    cy.visit(`/${Cypress.env("workspaceSlug")}/workflows`);
    cy.get(dashboardSelector.folderName(folderName)).should("be.visible");

    cy.get(commonSelectors.folderListcard(folderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(folderName))
          .should("exist")
          .invoke("click");
      });

    cy.get(commonSelectors.editFolderOption(folderName)).should("be.visible");
    cy.get(commonSelectors.deleteFolderOption(folderName)).should("be.visible");

    cy.get("body").type("{esc}");
  });

  it("should restore folder rename and delete options after git sync is disabled", () => {
    const folderName = `gs03-no-gs-folder-${testId}`;

    cy.apiCreateFolder(folderName, "front-end");

    cy.apiDeleteGitSync(workspaceId);

    cy.visit(`/${Cypress.env("workspaceSlug")}/my-workspace`);
    cy.get(dashboardSelector.folderName(folderName)).should("be.visible");

    cy.get(commonSelectors.folderListcard(folderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(folderName))
          .should("exist")
          .invoke("click");
      });

    cy.get(commonSelectors.editFolderOption(folderName))
      .should("be.visible")
      .and("have.text", commonText.editFolderOption);
    cy.get(commonSelectors.deleteFolderOption(folderName))
      .should("be.visible")
      .and("have.text", commonText.deleteFolderOption);

    cy.get(commonSelectors.editFolderOption(folderName)).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(commonSelectors.folderListcard(folderName))
      .parent()
      .within(() => {
        cy.get(commonSelectors.folderCardOptions(folderName)).invoke("click");
      });
    cy.get(commonSelectors.deleteFolderOption(folderName)).click();
    cy.get(commonSelectors.modalComponent).should("be.visible");
    cy.get(commonSelectors.cancelButton).click();
  });
});
