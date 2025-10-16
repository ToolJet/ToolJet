import { commonSelectors } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { createFolder, deleteFolder } from "Support/utils/common";
import { addAndVerifyConstants } from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";

export const appOperations = {
  createApp: (appName) => {
    cy.createApp(appName);
    cy.backToApps();
  },

  deleteApp: (appName) => {
    cy.deleteApp(appName);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.appDeletedToast
    );
  },

  cloneApp: (appName) => {
    cy.get(commonSelectors.appCard(appName))
      .trigger("mouseover")
      .find(commonSelectors.cloneButton)
      .click();
  },
};

export const folderOperations = {
  createFolder: (folderName) => {
    createFolder(folderName);
  },

  deleteFolder: (folderName) => {
    deleteFolder(folderName);
  },
};

export const constantsOperations = {
  createConstant: (name, value) => {
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addAndVerifyConstants(name, value);
  },

  deleteConstant: (name) => {
    cy.get(workspaceConstantsSelectors.constDeleteButton(name)).click();
    cy.get(commonSelectors.yesButton).click();
  },
};

// Permission verification helpers
export const verifyPermissions = {
  checkAppPermissions: (shouldExist = true) => {
    const assertion = shouldExist ? "exist" : "not.exist";
    cy.get(commonSelectors.appCreateButton).should(assertion);
  },

  checkFolderPermissions: (shouldExist = true) => {
    const assertion = shouldExist ? "exist" : "not.exist";
    cy.get(commonSelectors.createNewFolderButton).should(assertion);
  },

  checkConstantsPermissions: (shouldExist = true) => {
    const assertion = shouldExist ? "exist" : "not.exist";
    cy.get(commonSelectors.workspaceConstantsIcon).should(assertion);
  },

  checkSettingsAccess: (shouldExist = true) => {
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonSelectors.workspaceSettings).should(
      shouldExist ? "exist" : "not.exist"
    );
  },
};

// Helper function to perform all verifications
export const verifyAllPermissions = (shouldHaveAccess = true) => {
  verifyPermissions.checkAppPermissions(shouldHaveAccess);
  verifyPermissions.checkFolderPermissions(shouldHaveAccess);
  verifyPermissions.checkConstantsPermissions(shouldHaveAccess);
  verifyPermissions.checkSettingsAccess(shouldHaveAccess);
};

// Role-based permission sets
export const rolePermissions = {
  admin: {
    name: "Admin",
    hasFullAccess: true,
    canManageWorkspace: true,
    canManageUsers: true,
  },
  builder: {
    name: "Builder",
    hasFullAccess: true,
    canManageWorkspace: false,
    canManageUsers: false,
  },
  endUser: {
    name: "End User",
    hasFullAccess: false,
    canManageWorkspace: false,
    canManageUsers: false,
  },
};


export const getGroupPermissionInput = (isEnterprise, flag) => {
  return isEnterprise
    ? {
      appCreate: flag,
      appDelete: flag,
      appPromote: flag,
      appRelease: flag,
      workflowCreate: flag,
      workflowDelete: flag,
      dataSourceCreate: flag,
      dataSourceDelete: flag,
      folderCRUD: flag,
      orgConstantCRUD: flag,
    }
    : {
      appCreate: flag,
      appDelete: flag,
      folderCRUD: flag,
      orgConstantCRUD: flag,
    };
}


export const verifyBuilderPermissions = (
  appName,
  folderName,
  constName,
  constValue,
  isAdmin = false
) => {
  verifyBasicPermissions(true);

  // App operations
  cy.apiCreateApp(appName);
  cy.apiDeleteApp();

  // Folder operations
  cy.apiCreateFolder(folderName);
  cy.apiDeleteFolder();

  // Constants management
  cy.get(commonSelectors.workspaceConstantsIcon).click();
  addAndVerifyConstants(constName, constValue);
  cy.get(workspaceConstantsSelectors.constDeleteButton(constName)).click();
  cy.get(commonSelectors.yesButton).click();

  cy.ifEnv("Enterprise", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      appName,
      "restapi",
      [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
    );
    cy.apiDeleteGDS(appName);

    cy.apiCreateWorkflow(appName);
    cy.apiDeleteWorkflow(appName);

  })

  verifySettingsAccess(isAdmin);
};


export const verifyBasicPermissions = (canCreate = true) => {
  cy.get(commonSelectors.dashboardAppCreateButton).should(
    canCreate ? "be.enabled" : "be.disabled"
  );
  cy.get(commonSelectors.createNewFolderButton).should(
    canCreate ? "exist" : "not.exist"
  );
  cy.get('[data-cy="database-icon"]').should(canCreate ? "exist" : "not.exist");
  cy.get(commonSelectors.workspaceConstantsIcon).should(
    canCreate ? "exist" : "not.exist"
  );

  cy.ifEnv("Enterprise", () => {
    cy.get(commonSelectors.globalDataSourceIcon).should(
      canCreate ? "exist" : "not.exist"
    );
  });
};

export const verifySettingsAccess = (shouldExist = true) => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).should(
    shouldExist ? "exist" : "not.exist"
  );
};