import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workflowsText } from "Texts/platform/workflows";
import { dashboardSelector } from "Selectors/platform/dashboard";
import {
  createFolder,
  deleteFolder,
  viewFolderCardOptions,
  verifyModal,
  cancelModal,
  closeModal,
} from "Support/utils/common";
import {
  openWorkflowsDashboard,
  moveWorkflowToFolder,
  removeWorkflowFromFolder,
} from "Support/utils/workFlows";

// Workflow folders are the apps folder feature scoped to workflows: the same
// folder API, the same folder UI, discriminated by type. These cases mirror
// dashboard.cy.js "Should verify the folder CRUD operation" plus its
// add/remove-to-folder blocks, and reuse the same helpers.
//
// See the workflow-cypress-tdd skill for the surface map and known issues.
const data = {};

describe("Workflows - folders and folder movement", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.folderName = `${data.workflowName}folder`;
    data.updatedFolderName = `${data.workflowName}renamedfolder`;
    data.appName = `${data.workflowName}app`;
    cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
  });

  it("A workflow folder can be created and is listed on the workflows dashboard", () => {
    openWorkflowsDashboard();
    createFolder(data.folderName);

    cy.get(dashboardSelector.folderName(data.folderName)).should("be.visible");

    cy.reload();
    cy.wait(3000);
    cy.get(dashboardSelector.folderName(data.folderName)).should("exist");

    deleteFolder(data.folderName);
  });

  it("Closing or cancelling the create-folder modal creates nothing", () => {
    openWorkflowsDashboard();

    // Close path.
    cy.get(commonSelectors.createNewFolderButton).click();
    verifyModal(
      commonText.createFolder,
      commonText.createFolderButton,
      commonSelectors.folderNameInput
    );
    closeModal(commonText.closeButton);
    cy.contains(data.folderName).should("not.exist");

    // Cancel path, with a name typed in.
    cy.get(commonSelectors.createNewFolderButton).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.folderName);
    cancelModal(commonText.cancelButton);
    cy.contains(data.folderName).should("not.exist");
  });

  it("A workflow folder can be renamed and the new name persists", () => {
    openWorkflowsDashboard();
    createFolder(data.folderName);

    // Cancelling the edit must not rename.
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption(data.folderName)).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    cancelModal(commonText.cancelButton);
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "not.exist"
    );

    // Submitting renames and persists.
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.editFolderOption(data.folderName)).click();
    cy.clearAndType(commonSelectors.folderNameInput, data.updatedFolderName);
    cy.get(
      commonSelectors.buttonSelector(commonText.updateFolderButton)
    ).click();
    cy.get(commonSelectors.modalComponent).should("not.exist");
    cy.get(dashboardSelector.folderName(data.updatedFolderName)).should(
      "be.visible"
    );

    deleteFolder(data.updatedFolderName);
  });

  it("Deleting a workflow folder asks for confirmation and removes it on confirm", () => {
    openWorkflowsDashboard();
    createFolder(data.folderName);

    // Assert only the stable prefix: the trailing sentence of this confirmation
    // says "Apps" even on the workflows dashboard, which is a copy defect raised
    // separately — not something to encode in an assertion.
    viewFolderCardOptions(data.folderName);
    cy.get(commonSelectors.deleteFolderOption(data.folderName)).click();
    cy.get(commonSelectors.modalComponent)
      .should("be.visible")
      .and("contain.text", workflowsText.folderDeletePrefix(data.folderName));

    // Cancelling keeps the folder.
    cancelModal(commonText.cancelButton);
    cy.get(dashboardSelector.folderName(data.folderName)).should("be.visible");

    // Confirming removes it.
    deleteFolder(data.folderName);
    cy.get(dashboardSelector.folderName(data.folderName)).should("not.exist");
  });

  it("Deleting a folder does not delete the workflows inside it", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();
    createFolder(data.folderName);
    moveWorkflowToFolder(data.workflowName, data.folderName);

    deleteFolder(data.folderName);

    // The workflow must survive its folder.
    cy.get(commonSelectors.allApplicationsLink).click();
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");

    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("A workflow can be moved into a folder and appears inside it", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();
    createFolder(data.folderName);

    moveWorkflowToFolder(data.workflowName, data.folderName);

    // The folder count reflects the single member.
    cy.get(dashboardSelector.folderName(data.folderName)).should(
      "contain.text",
      `${data.folderName} (1)`
    );

    // Opening the folder lists the workflow.
    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");

    deleteFolder(data.folderName);
    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("A workflow can be removed from a folder and returns to the unfiled list", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();
    createFolder(data.folderName);
    moveWorkflowToFolder(data.workflowName, data.folderName);

    // Remove from folder only renders while a folder is open, so open it first.
    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.wait(2000);
    removeWorkflowFromFolder(data.workflowName);

    cy.get(commonSelectors.empytyFolderImage).should("be.visible");

    cy.get(commonSelectors.allApplicationsLink).click();
    cy.wait(2000);
    cy.get(commonSelectors.appCard(data.workflowName)).should("exist");

    deleteFolder(data.folderName);
    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("Folder counts reflect membership and the empty state shows for an empty folder", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();
    createFolder(data.folderName);

    // Empty folder: count absent from the label, empty state shown.
    cy.get(dashboardSelector.folderName(data.folderName)).should(
      "not.contain.text",
      "(1)"
    );

    moveWorkflowToFolder(data.workflowName, data.folderName);
    cy.get(dashboardSelector.folderName(data.folderName)).should(
      "contain.text",
      `${data.folderName} (1)`
    );

    deleteFolder(data.folderName);
    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("Deleting a workflow inside a folder decrements the folder count", () => {
    cy.apiCreateWorkflow(data.workflowName);
    openWorkflowsDashboard();
    createFolder(data.folderName);
    moveWorkflowToFolder(data.workflowName, data.folderName);
    cy.get(dashboardSelector.folderName(data.folderName)).should(
      "contain.text",
      `${data.folderName} (1)`
    );

    // Delete the workflow itself, not just its membership.
    cy.apiDeleteWorkflow(data.workflowName);
    cy.reload();
    cy.wait(3000);

    cy.get(dashboardSelector.folderName(data.folderName)).should(
      "not.contain.text",
      "(1)"
    );

    deleteFolder(data.folderName);
  });

  it("An empty workflow folder shows the empty-folder message", () => {
    openWorkflowsDashboard();
    createFolder(data.folderName);

    cy.get(dashboardSelector.folderName(data.folderName)).click();
    cy.wait(2000);
    cy.get(commonSelectors.empytyFolderImage).should("be.visible");
    cy.get(commonSelectors.emptyFolderText).verifyVisibleElement(
      "have.text",
      commonText.emptyFolderText
    );

    cy.get(commonSelectors.allApplicationsLink).click();
    deleteFolder(data.folderName);
  });

  it("Workflow folders and app folders do not appear in each other's dashboards", () => {
    // Folder listing is scoped by type, so a scoping regression would cross-list
    // folders between the two dashboards.
    openWorkflowsDashboard();
    createFolder(data.folderName);

    cy.visit("/my-workspace");
    cy.wait(3000);
    cy.get(dashboardSelector.folderName(data.folderName)).should("not.exist");

    openWorkflowsDashboard();
    cy.get(dashboardSelector.folderName(data.folderName)).should("exist");

    deleteFolder(data.folderName);
  });

  it("An app folder and a workflow folder may share the same name", () => {
    // Folder-name uniqueness is scoped per type, so the same name is legal
    // across apps and workflows and must not be rejected.
    cy.visit("/my-workspace");
    cy.wait(3000);
    createFolder(data.folderName);

    openWorkflowsDashboard();
    createFolder(data.folderName);
    cy.get(dashboardSelector.folderName(data.folderName)).should("be.visible");

    deleteFolder(data.folderName);
    cy.visit("/my-workspace");
    cy.wait(3000);
    deleteFolder(data.folderName);
  });
});
