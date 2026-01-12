import { commonSelectors } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { addAndVerifyConstants } from "Support/utils/workspaceConstants";

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
};

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
    cy.apiCreateDataSource(
      `${Cypress.env("server_host")}/api/data-sources`,
      appName,
      "restapi",
      [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
    );
    cy.apiDeleteDataSource(appName);

    cy.apiCreateWorkflow(appName);
    cy.apiDeleteWorkflow(appName);
  });

  verifySettingsAccess(isAdmin);
  cy.get(commonSelectors.workspaceSettings).click();
  cy.get(commonSelectors.manageSSOOption).should("not.exist");
  cy.get(commonSelectors.themesOption).should("exist");
};

export const verifyBasicPermissions = (canCreate = true) => {
  cy.get(commonSelectors.dashboardAppCreateButton).should(
    canCreate ? "be.enabled" : "be.disabled"
  );
  cy.get(commonSelectors.createNewFolderButton).should(
    canCreate ? "exist" : "not.exist"
  );
  cy.get('[data-cy="database-icon"]').should(canCreate ? "exist" : "not.exist");

  cy.ifEnv("Enterprise", () => {
    cy.get(commonSelectors.globalDataSourceIcon).should(
      canCreate ? "exist" : "not.exist"
    );
    cy.get(commonSelectors.workspaceConstantsIcon).should(
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
