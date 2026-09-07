// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// uiPermissions.js
//   uiCreateApp                      app.createUi         → access
//   uiVerifyAppCreated               app.verifyCreated    → access
//   uiDeleteApp                      app.deleteUi         → access
//   uiVerifyAppDeleted               app.verifyDeleted    → access
//   uiVerifyAppCreatePrivilege       app.verifyCreatePrivilege → access
//   uiCreateFolder                   folder.createUi      → access
//   uiVerifyFolderCreated            folder.verifyCreated → access
//   uiVerifyFolderDeleted            folder.verifyDeleted → access
//   uiVerifyFolderCreatePrivilege    folder.verifyCreatePrivilege → access
//   uiVerifyWorkspaceConstantCreatePrivilege workspaceConstant.verifyCreatePrivilege → access
//   uiCreateDataSource               datasource.createUi  → access
//   uiVerifyDataSourceCreated        datasource.verifyCreated → access
//   uiDeleteDataSource               datasource.deleteUi  → access
//   uiVerifyDataSourceDeleted        datasource.verifyDeleted → access
//   uiVerifyDataSourceCreatePrivilege datasource.verifyCreatePrivilege → access
//   uiCreateWorkflow                 workflow.createUi    → access
//   uiVerifyWorkflowCreated          workflow.verifyCreated → access
//   uiDeleteWorkflow                 workflow.deleteUi    → access
//   uiVerifyWorkflowDeleted          workflow.verifyDeleted → access
//   uiVerifyWorkflowCreatePrivilege  workflow.verifyCreatePrivilege → access
//   uiVerifyAllCreatePrivileges      role.verifyAllCreatePrivileges → access
//   uiVerifyBuilderPrivileges        role.verifyBuilder   → access
//   uiVerifyAdminPrivileges          role.verifyAdmin     → access
//   uiAppCRUDWorkflow                app.crudFlow         → access
//   uiFolderCRUDWorkflow             folder.crudFlow      → access
//   uiWorkspaceConstantCRUDWorkflow  workspaceConstant.crudFlow → access
//   uiDataSourceCRUDWorkflow         datasource.crudFlow  → access
//   uiWorkflowCRUDWorkflow           workflow.crudFlow    → access
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import { workflowSelector } from "Selectors/platform/workflows";
import { deleteFolder } from "Support/utils/common";
import {
  addAndVerifyConstants,
  deleteConstant,
} from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";

/**
* @tjType   app.createUi
* @tjBlock  access
* @tjUsage  uiCreateApp(name)
* @tjDom    dashboard -> create app via UI
*/
export const uiCreateApp = (appName) => {
  cy.createApp(appName);
  cy.wait(2000);
  cy.backToApps();
};

/**
* @tjType   app.verifyCreated
* @tjBlock  access
* @tjUsage  uiVerifyAppCreated(name, true)
* @tjDom    asserts the app exists
*/
export const uiVerifyAppCreated = (appName, shouldExist = true) => {
  const assertion = shouldExist ? "exist" : "not.exist";
  cy.get(commonSelectors.appCard(appName)).should(assertion);
};

/**
* @tjType   app.deleteUi
* @tjBlock  access
* @tjUsage  uiDeleteApp(name)
* @tjDom    deletes the app via UI
*/
export const uiDeleteApp = (appName) => {
  cy.deleteApp(appName);
};

/**
* @tjType   app.verifyDeleted
* @tjBlock  access
* @tjUsage  uiVerifyAppDeleted(name)
* @tjDom    asserts the app is gone
*/
export const uiVerifyAppDeleted = (appName) => {
  cy.get(commonSelectors.appCard(appName)).should("not.exist");
};

/**
* @tjType   app.verifyCreatePrivilege
* @tjBlock  access
* @tjUsage  uiVerifyAppCreatePrivilege(true)
* @tjDom    create control enabled/disabled for the role
*/
export const uiVerifyAppCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "be.enabled" : "be.disabled";
  cy.get(commonSelectors.dashboardAppCreateButton).should(assertion);
};

/**
* @tjType   folder.createUi
* @tjBlock  access
* @tjUsage  uiCreateFolder(name)
* @tjDom    dashboard -> create folder via UI
*/
export const uiCreateFolder = (folderName) => {
  cy.get(commonSelectors.createNewFolderButton).click();
  cy.clearAndType(commonSelectors.folderNameInput, folderName);
  cy.get(commonSelectors.createFolderButton).click();
};

/**
* @tjType   folder.verifyCreated
* @tjBlock  access
* @tjUsage  uiVerifyFolderCreated(name, true)
* @tjDom    asserts the folder exists
*/
export const uiVerifyFolderCreated = (folderName) => {
  cy.get(commonSelectors.folderListcard(folderName)).should("exist");
};

/**
* @tjType   folder.verifyDeleted
* @tjBlock  access
* @tjUsage  uiVerifyFolderDeleted(name)
* @tjDom    asserts the folder is gone
*/
export const uiVerifyFolderDeleted = (folderName) => {
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.folderDeletedToast
  );
  cy.get(commonSelectors.folderListcard(folderName)).should("not.exist");
};

/**
* @tjType   folder.verifyCreatePrivilege
* @tjBlock  access
* @tjUsage  uiVerifyFolderCreatePrivilege(true)
* @tjDom    create control enabled/disabled for the role
*/
export const uiVerifyFolderCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.createNewFolderButton).should(assertion);
};

/**
* @tjType   workspaceConstant.verifyCreatePrivilege
* @tjBlock  access
* @tjUsage  uiVerifyWorkspaceConstantCreatePrivilege(true)
* @tjDom    constants create control per role
*/
export const uiVerifyWorkspaceConstantCreatePrivilege = (
  hasPrivilege = true
) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.workspaceConstantsIcon).should(assertion);
};

/**
* @tjType   datasource.createUi
* @tjBlock  access
* @tjUsage  uiCreateDataSource(name)
* @tjDom    dashboard -> create datasource via UI
*/
export const uiCreateDataSource = (
  datasourceName,
  datasourceType = "restapi"
) => {
  cy.get(commonSelectors.globalDataSourceIcon).click();
  // cy.get(commonSelectors.addNewDataSourceButton).click();
  cy.get('[data-cy="rest-api-add-button"]').eq(0).click({ force: true });
};

/**
* @tjType   datasource.verifyCreated
* @tjBlock  access
* @tjUsage  uiVerifyDataSourceCreated(name, true)
* @tjDom    asserts the datasource exists
*/
export const uiVerifyDataSourceCreated = (datasourceName) => {
  cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Added");
  cy.get('[data-cy="restapi-button"]').should("exist");
};

/**
* @tjType   datasource.deleteUi
* @tjBlock  access
* @tjUsage  uiDeleteDataSource(name)
* @tjDom    deletes the datasource via UI
*/
export const uiDeleteDataSource = (datasourceName) => {
  cy.get('[data-cy="restapi-delete-button"]').click({ force: true });
  cy.get(commonSelectors.yesButton).click();
};

/**
* @tjType   datasource.verifyDeleted
* @tjBlock  access
* @tjUsage  uiVerifyDataSourceDeleted(name)
* @tjDom    asserts the datasource is gone
*/
export const uiVerifyDataSourceDeleted = (datasourceName) => {
  cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Deleted");
  cy.get('[data-cy="restapi-button"]').should("not.exist");
};

/**
* @tjType   datasource.verifyCreatePrivilege
* @tjBlock  access
* @tjUsage  uiVerifyDataSourceCreatePrivilege(true)
* @tjDom    create control enabled/disabled for the role
*/
export const uiVerifyDataSourceCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.globalDataSourceIcon).should(assertion);
};

/**
* @tjType   workflow.createUi
* @tjBlock  access
* @tjUsage  uiCreateWorkflow(name)
* @tjDom    dashboard -> create workflow via UI
*/
export const uiCreateWorkflow = (workflowName) => {
  cy.get(workflowSelector.globalWorkFlowsIcon).click();

  cy.get('[data-cy="button-new-workflow-from-scratch"]').click();
  cy.get(workflowSelector.workFlowNameInputField).type(workflowName);
  cy.get(workflowSelector.createWorkFlowsButton).click();
  cy.wait(3000);
  cy.go("back");
  cy.waitForElement('[data-cy="home-page-logo"]');
};

/**
* @tjType   workflow.verifyCreated
* @tjBlock  access
* @tjUsage  uiVerifyWorkflowCreated(name, true)
* @tjDom    asserts the workflow exists
*/
export const uiVerifyWorkflowCreated = (workflowName) => {
  cy.get(commonSelectors.globalWorkFlowsIcon).click();
  cy.get(`[data-cy="${workflowName.toLowerCase()}-card"]`)
    .contains(workflowName)
    .should("exist");
};

/**
* @tjType   workflow.deleteUi
* @tjBlock  access
* @tjUsage  uiDeleteWorkflow(name)
* @tjDom    deletes the workflow via UI
*/
export const uiDeleteWorkflow = () => {
  cy.get(".homepage-app-card .home-app-card-header .menu-ico").then(($el) => {
    $el[0].style.setProperty("visibility", "visible", "important");
  });
  cy.get(".homepage-app-card").realHover();
  cy.get('[data-cy="app-card-menu-icon"]').click();
  cy.get(workflowSelector.deleteWorkFlowOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
};

/**
* @tjType   workflow.verifyDeleted
* @tjBlock  access
* @tjUsage  uiVerifyWorkflowDeleted(name)
* @tjDom    asserts the workflow is gone
*/
export const uiVerifyWorkflowDeleted = (workflowName) => {
  cy.get(`[data-cy="${workflowName.toLowerCase()}-card"]`).should("not.exist");
};

/**
* @tjType   workflow.verifyCreatePrivilege
* @tjBlock  access
* @tjUsage  uiVerifyWorkflowCreatePrivilege(true)
* @tjDom    create control enabled/disabled for the role
*/
export const uiVerifyWorkflowCreatePrivilege = (hasPrivilege = true) => {
  const assertion = hasPrivilege ? "exist" : "not.exist";
  cy.get(commonSelectors.globalWorkFlowsIcon).should(assertion);
};

/**
* @tjType   role.verifyAllCreatePrivileges
* @tjBlock  access
* @tjUsage  uiVerifyAllCreatePrivileges(...)
* @tjDom    every create control for one role
*/
export const uiVerifyAllCreatePrivileges = (
  hasAppCreate = true,
  hasFolderCreate = true,
  hasConstantCreate = true,
  hasDataSourceCreate = true,
  hasWorkflowCreate = true
) => {
  uiVerifyAppCreatePrivilege(hasAppCreate);
  uiVerifyFolderCreatePrivilege(hasFolderCreate);
  uiVerifyWorkspaceConstantCreatePrivilege(hasConstantCreate);

  cy.ifEnv("Enterprise", () => {
    uiVerifyDataSourceCreatePrivilege(hasDataSourceCreate);
    uiVerifyWorkflowCreatePrivilege(hasWorkflowCreate);
  });
};

/**
* @tjType   role.verifyBuilder
* @tjBlock  access
* @tjUsage  uiVerifyBuilderPrivileges()
* @tjDom    builder-role privilege matrix
*/
export const uiVerifyBuilderPrivileges = () => {
  uiVerifyAllCreatePrivileges(true, true, true, true, true);
};

/**
* @tjType   role.verifyAdmin
* @tjBlock  access
* @tjUsage  uiVerifyAdminPrivileges()
* @tjDom    admin-role privilege matrix
*/
export const uiVerifyAdminPrivileges = () => {
  uiVerifyAllCreatePrivileges(true, true, true, true, true);
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).should("exist");
  cy.get(commonSelectors.dashboardIcon).click();
};

/**
* @tjType   app.crudFlow
* @tjBlock  access
* @tjUsage  uiAppCRUDWorkflow('MyApp')
* @tjDom    create -> verify -> delete -> verify
*/
export const uiAppCRUDWorkflow = (appName) => {
  uiCreateApp(appName);
  uiVerifyAppCreated(appName, true);

  uiDeleteApp(appName);
  uiVerifyAppDeleted(appName);
};

/**
* @tjType   folder.crudFlow
* @tjBlock  access
* @tjUsage  uiFolderCRUDWorkflow('QA folder')
* @tjDom    create -> verify -> delete -> verify
*/
export const uiFolderCRUDWorkflow = (folderName) => {
  uiCreateFolder(folderName);
  uiVerifyFolderCreated(folderName);

  deleteFolder(folderName);
  uiVerifyFolderDeleted(folderName);
};

/**
* @tjType   workspaceConstant.crudFlow
* @tjBlock  access
* @tjUsage  uiWorkspaceConstantCRUDWorkflow(...)
* @tjDom    create -> verify -> delete -> verify
*/
export const uiWorkspaceConstantCRUDWorkflow = (
  constantName,
  constantValue
) => {
  cy.get(commonSelectors.workspaceConstantsIcon).click();

  addAndVerifyConstants(constantName, constantValue);
  deleteConstant(constantName);
  cy.get(commonSelectors.dashboardIcon).click();
};

/**
* @tjType   datasource.crudFlow
* @tjBlock  access
* @tjUsage  uiDataSourceCRUDWorkflow(...)
* @tjDom    create -> verify -> delete -> verify
*/
export const uiDataSourceCRUDWorkflow = (
  datasourceName,
  datasourceType = "restapi"
) => {
  cy.ifEnv("Enterprise", () => {
    uiCreateDataSource(datasourceName, datasourceType);
    uiVerifyDataSourceCreated(datasourceName);

    uiDeleteDataSource(datasourceName);
    uiVerifyDataSourceDeleted(datasourceName);
    cy.get(commonSelectors.dashboardIcon).click();
  });
};

/**
* @tjType   workflow.crudFlow
* @tjBlock  access
* @tjUsage  uiWorkflowCRUDWorkflow('QA flow')
* @tjDom    create -> verify -> delete -> verify
*/
export const uiWorkflowCRUDWorkflow = (workflowName) => {
  cy.ifEnv("Enterprise", () => {
    uiCreateWorkflow(workflowName);
    uiVerifyWorkflowCreated(workflowName);

    uiDeleteWorkflow();
    uiVerifyWorkflowDeleted(workflowName);
  });
};
