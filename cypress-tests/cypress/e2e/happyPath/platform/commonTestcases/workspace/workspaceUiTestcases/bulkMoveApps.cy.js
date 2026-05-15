import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardText } from "Texts/dashboard";
import { viewAppCardOptions } from "Support/utils/common";
import {
  openAddToFolderModal,
  addAppsToMultiSelect,
  selectDestinationFolder,
} from "Support/utils/bulkMoveApps";

describe("Bulk Move Apps to Folder", { retries: 0 }, () => {
  const testId = Date.now();
  const appNameA = `AppA-${testId}`;
  const appNameB = `AppB-${testId}`;
  const appNameC = `AppC-${testId}`;
  const folderDestName = `folder-dest-${testId}`;

  let workspaceId, appIdA, folderDestId;

  beforeEach(() => {
    cy.apiLogin();
    cy.viewport(1440, 1200);
    const wsName = `bulk-move-${Date.now()}`;
    cy.apiCreateWorkspace(wsName, wsName).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsName);
    });
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

  it("should move apps to a folder using single-select and multi-select", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}`);

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

  it("should support All apps and All in folder bulk select options", () => {
    const folderXName = `folder-x-${testId}`;
    const folderYName = `folder-y-${testId}`;
    const APP_COUNT = 10;
    const pagedAppNames = Array.from(
      { length: APP_COUNT },
      (_, i) => `PagedApp${i}-${testId}`
    );
    let folderXId;

    cy.apiCreateFolder(folderXName, "front-end");
    cy.then(() => { folderXId = Cypress.env("createdFolderId"); });
    cy.apiCreateFolder(folderYName, "front-end");
    pagedAppNames.forEach((name) => {
      cy.apiCreateApp(name);
      cy.then(() => { cy.apiAddAppToFolder(folderXId, Cypress.env("appId")); });
    });

    // All apps (N) option — verify from main view using paged apps (visible on page 1)
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    openAddToFolderModal(pagedAppNames[APP_COUNT - 1]);
    cy.get(dashboardSelector.appsMultiSelectControl)
      .find('.react-select__value-container')
      .click();
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allAppsOption(3 + APP_COUNT))
      .should("be.visible")
      .click();
    cy.get(dashboardSelector.moveAppText)
      .contains(dashboardText.allAppsLabel)
      .should("be.visible");
    cy.get(commonSelectors.cancelButton).click();

    // All in this folder (10) option + pagination — verify from folder view
    cy.get(dashboardSelector.folderName(folderXName)).click();
    openAddToFolderModal(pagedAppNames[APP_COUNT - 1]);
    cy.get(dashboardSelector.appsMultiSelectControl)
      .find('.react-select__value-container')
      .click();
    cy.get(commonSelectors.folderList).then(($list) => {
      expect($list.find(".react-select__option").length).to.be.greaterThan(9);
    });
    cy.get(commonSelectors.folderList)
      .contains(dashboardText.allInFolderOption(APP_COUNT))
      .should("be.visible");

    cy.get(commonSelectors.folderList).contains(pagedAppNames[APP_COUNT - 2]).click();
    cy.get(commonSelectors.folderList).contains(pagedAppNames[APP_COUNT - 3]).click();
    cy.get("body").type("{esc}");

    selectDestinationFolder(folderYName);
    cy.get(dashboardSelector.addToFolderButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(folderYName),
      false
    );
  });

  it("should show success toast when a duplicate app assignment is skipped", () => {
    const appDupName = `AppDup-${testId}`;
    const folderYName = `folder-dup-y-${testId}`;
    let folderYId;

    cy.apiCreateFolder(folderYName, "front-end");
    cy.then(() => { folderYId = Cypress.env("createdFolderId"); });

    // dupApp is pre-placed in folderY — moving it to folderY again will be a duplicate
    cy.apiCreateApp(appDupName);
    cy.then(() => {
      const dupId = Cypress.env("appId");
      cy.apiAddAppToFolder(folderYId, dupId);
    });

    // From the main view, both appA and dupApp appear in the multiselect dropdown
    cy.visit(`/${Cypress.env("workspaceSlug")}`);

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
    cy.get(commonSelectors.appCard(appDupName)).should("be.visible");
  });

  it("should validate modal state and not move apps on cancel", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}`);

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

  it("should allow selecting any folder from a scrollable list when many folders exist", () => {
    const FOLDER_COUNT = 12;
    const extraFolderNames = Array.from(
      { length: FOLDER_COUNT },
      (_, i) => `scroll-folder-${i}-${testId}`
    );

    extraFolderNames.forEach((name) => {
      cy.apiCreateFolder(name, "front-end");
    });

    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    openAddToFolderModal(appNameA);

    cy.get(dashboardSelector.selectFolder).click();
    cy.get(commonSelectors.folderList).should("be.visible");

    const lastFolder = extraFolderNames[FOLDER_COUNT - 1];
    cy.get(commonSelectors.folderList).scrollTo("bottom");
    cy.get(commonSelectors.folderList).contains(lastFolder).click({ force: true });

    cy.get(dashboardSelector.addToFolderButton).should("not.be.disabled").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      dashboardText.bulkMoveSuccessToast(lastFolder),
      false
    );
  });

  it("should remove an app from a folder successfully", () => {
    cy.apiAddAppToFolder(folderDestId, appIdA);

    cy.visit(`/${Cypress.env("workspaceSlug")}`);
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
