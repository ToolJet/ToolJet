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

describe("Bulk Move Min", { retries: 0 }, () => {
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

  it("test 2 - simple visit only", () => {
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
    cy.get('[data-cy="home-page-content"]').should("exist");
  });
});
