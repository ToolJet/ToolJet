import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { createFolder, deleteFolder } from "Support/utils/common";
import { addNewconstants } from "Support/utils/workspaceConstants";

const appOperations = {
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

const folderOperations = {
  createFolder: (folderName) => {
    createFolder(folderName);
  },

  deleteFolder: (folderName) => {
    deleteFolder(folderName);
  },
};

const constantsOperations = {
  createConstant: (name, value) => {
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addNewconstants(name, value);
  },

  deleteConstant: (name) => {
    cy.get(workspaceConstantsSelectors.constDeleteButton(name)).click();
    cy.get(commonSelectors.yesButton).click();
  },
};

// Permission verification helpers
const verifyPermissions = {
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
const verifyAllPermissions = (shouldHaveAccess = true) => {
  verifyPermissions.checkAppPermissions(shouldHaveAccess);
  verifyPermissions.checkFolderPermissions(shouldHaveAccess);
  verifyPermissions.checkConstantsPermissions(shouldHaveAccess);
  verifyPermissions.checkSettingsAccess(shouldHaveAccess);
};

// Role-based permission sets
const rolePermissions = {
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

export {
  appOperations,
  folderOperations,
  constantsOperations,
  verifyPermissions,
  verifyAllPermissions,
  rolePermissions,
};
