import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dashboardUiSelector } from "Selectors/dashboardUi";
import { workflowSelector } from "Selectors/workflows";
import {
  closeFolderDropdown,
  createFolder,
  deleteFolder,
  openFolderDropdown,
  viewAppCardOptions,
} from "Support/utils/common";
import {
  addAndVerifyConstants,
  deleteConstant,
} from "Support/utils/workspaceConstants";

export const uiCreateApp = (appName) => {
  cy.createApp(appName);
  cy.wait(2000);
  cy.backToApps();
};

export const uiVerifyAppCreated = (appName, shouldExist = true) => {
  const assertion = shouldExist ? "exist" : "not.exist";
  cy.get(commonSelectors.appCard(appName)).should(assertion);
};

export const uiDeleteApp = (appName) => {
  cy.deleteApp(appName);
};

export const uiVerifyAppDeleted = (appName) => {
  cy.get(commonSelectors.appCard(appName)).should("not.exist");
};

export const uiVerifyAppCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "be.enabled" : "be.disabled";
  cy.get(commonSelectors.dashboardAppCreateButton).should(assertion);
};

export const uiCreateFolder = (folderName) => {
  createFolder(folderName);
};

export const uiVerifyFolderCreated = (folderName) => {
  openFolderDropdown();
  cy.get(dashboardSelector.folderName(folderName)).should("exist");
};

export const uiVerifyFolderDeleted = (folderName) => {
  openFolderDropdown();
  cy.get(dashboardSelector.folderName(folderName)).should("not.exist");
  closeFolderDropdown();
};

export const uiVerifyFolderCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";

  openFolderDropdown();
  cy.get(commonSelectors.createNewFolderButton).should(assertion);
  closeFolderDropdown();
};

export const uiVerifyWorkspaceConstantCreatePrivilege = (
  hasPrivilege = true,
) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.workspaceConstantsIcon).should(assertion);
};

export const uiCreateDataSource = (
  datasourceName,
  datasourceType = "restapi",
) => {
  cy.get(commonSelectors.globalDataSourceIcon).click();
  // cy.get(commonSelectors.addNewDataSourceButton).click();
  cy.get('[data-cy="rest-api-add-button"]').eq(0).click({ force: true });
};

export const uiVerifyDataSourceCreated = (datasourceName) => {
  cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Added");
  cy.get('[data-cy="restapi-button"]').should("exist");
};

export const uiDeleteDataSource = (datasourceName) => {
  cy.get('[data-cy="restapi-delete-button"]').click({ force: true });
  cy.get(commonSelectors.yesButton).click();
};

export const uiVerifyDataSourceDeleted = (datasourceName) => {
  cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Deleted");
  cy.get('[data-cy="restapi-button"]').should("not.exist");
};

export const uiVerifyDataSourceCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.globalDataSourceIcon).should(assertion);
};

export const uiCreateWorkflow = (workflowName) => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();

  cy.get('[data-cy="create-new-workflow-button"]').click();
  cy.get(workflowSelector.workFlowNameInputField).type(workflowName);
  cy.get(workflowSelector.createWorkFlowsButton).click();
  cy.wait(3000);
  cy.go("back");
  cy.waitForElement('[data-cy="home-page-logo"]')
};

export const uiVerifyWorkflowCreated = (workflowName) => {
  cy.reload();
  cy.wait(2000);
  cy.get(commonSelectors.globalWorkFlowsIcon).click();
  cy.wait(500);
  cy.get(`[data-cy="${workflowName.toLowerCase()}-card"]`)
    .contains(workflowName)
    .should("exist");
};

export const uiDeleteWorkflow = (workflowName) => {
  viewAppCardOptions(workflowName);
  cy.get(dashboardUiSelector.deleteWorkflowCardOption).click();
  cy.get(dashboardUiSelector.deleteWorkflowButton).click();
};

export const uiVerifyWorkflowDeleted = (workflowName) => {
  cy.get(`[data-cy="${workflowName.toLowerCase()}-card"]`).should("not.exist");
};

export const uiVerifyWorkflowCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.globalWorkFlowsIcon).should(assertion);
};

export const uiVerifyAllCreatePrivileges = (
  hasAppCreate = true,
  hasFolderCreate = true,
  hasConstantCreate = true,
  hasDataSourceCreate = true,
  hasWorkflowCreate = true,
) => {
  uiVerifyAppCreatePrivilege(hasAppCreate);
  uiVerifyFolderCreatePrivilege(hasFolderCreate);
  uiVerifyWorkspaceConstantCreatePrivilege(hasConstantCreate);

  cy.ifEnv("Enterprise", () => {
    uiVerifyDataSourceCreatePrivilege(hasDataSourceCreate);
    uiVerifyWorkflowCreatePrivilege(hasWorkflowCreate);
  });
};

export const uiVerifyBuilderPrivileges = () => {
  uiVerifyAllCreatePrivileges(true, true, true, true, true);
};

export const uiVerifyAdminPrivileges = () => {
  uiVerifyAllCreatePrivileges(true, true, true, true, true);
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).should("exist");
  cy.get(commonSelectors.dashboardIcon).click();
};

export const uiAppCRUDWorkflow = (appName) => {
  uiCreateApp(appName);
  uiVerifyAppCreated(appName, true);

  uiDeleteApp(appName);
  uiVerifyAppDeleted(appName);
};

export const uiFolderCRUDWorkflow = (folderName) => {
  uiCreateFolder(folderName);
  uiVerifyFolderCreated(folderName);

  deleteFolder(folderName);
  uiVerifyFolderDeleted(folderName);
};

export const uiWorkspaceConstantCRUDWorkflow = (
  constantName,
  constantValue,
) => {
  cy.get(commonSelectors.workspaceConstantsIcon).click();

  addAndVerifyConstants(constantName, constantValue);
  deleteConstant(constantName);
  cy.get(commonSelectors.dashboardIcon).click();
};

export const uiDataSourceCRUDWorkflow = (
  datasourceName,
  datasourceType = "restapi",
) => {
  cy.ifEnv("Enterprise", () => {
    uiCreateDataSource(datasourceName, datasourceType);
    uiVerifyDataSourceCreated(datasourceName);

    uiDeleteDataSource(datasourceName);
    uiVerifyDataSourceDeleted(datasourceName);
    cy.get(commonSelectors.dashboardIcon).click();
  });
};

export const uiWorkflowCRUDWorkflow = (workflowName) => {
  cy.ifEnv("Enterprise", () => {
    uiCreateWorkflow(workflowName);
    uiVerifyWorkflowCreated(workflowName);

    uiDeleteWorkflow(workflowName);
    uiVerifyWorkflowDeleted(workflowName);
  });
};
