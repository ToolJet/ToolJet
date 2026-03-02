import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { addAndVerifyConstants } from "Support/utils/workspaceConstants";
import { groupsSelector } from "Constants/selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import { versionSwitcherSelectors } from "Constants/selectors/version";
import { multiEnvSelector } from "Constants/selectors/eeCommon";

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

export const verifyEnvironmentTagsInGranularUI = (groupName, environmentTags) => {
  navigateToManageGroups();
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.granularLink).click();

  cy.get(groupsSelector.granularAccessPermission).within(() => {
    cy.get(groupsSelector.environmentTags).should('be.visible');
    cy.get('.environment-tag').should('have.length', environmentTags.length);
    cy.get('.environment-tag').each(($el, index) => {
      cy.wrap($el).should('have.text', environmentTags[index]);
    });
  });
};


export const verifyEnvironmentAccess = (environments, options = {}) => {
  const defaults = {
    workspaceName: "my-workspace",
    componentName: "text1",
    canEdit: true,
    appId: Cypress.env("appId"),
    appName: undefined,
    version: "v1",
    canAllView: true,
    allowedEnvironment: "staging"
  };
  const opts = {
    ...defaults,
    ...options,
    // use nullish coalescing so false/"" are not overwritten
    workspaceName: options.workspaceName ?? defaults.workspaceName,
    componentName: options.componentName ?? defaults.componentName,
    canEdit: options.canEdit ?? defaults.canEdit,
    appId: options.appId ?? defaults.appId,
    appName: options.appName ?? defaults.appName,
    version: options.version ?? defaults.version,
    canAllView: options.canAllView ?? defaults.canAllView,
    allowedEnvironment: options.allowedEnvironment ?? defaults.allowedEnvironment
  };
  verifyAppBuilderAccess(environments, opts);
  verifyPreviewAccess(environments, opts);
  verifyPreviewURLAccess(environments, opts);
};
const assertRestrictedTooltip = (selector, env) => {
  cy.get(selector).should("be.disabled").trigger("mouseover", { force: true });
  cy.get("div.tooltip-inner")
    .should("be.visible")
    .and("contain", `Access to ${env} environment is restricted. Contact admin to know more.`);
  cy.get(selector).trigger("mouseout", { force: true });
  cy.get("div.tooltip-inner").should("not.exist");
};


export const verifyAppBuilderAccess = (envNames, { workspaceName, canEdit, appId }) => {

  if (!canEdit) {
    cy.visit(`/${workspaceName}/apps/${appId}`, { failOnStatusCode: false });
    cy.url().should("match", /\/error\/restricted(-preview)?/);
    cy.get('[data-cy="modal-header"]').should("be.visible").and("contain.text", "Restricted access");
    return;
  }
  cy.get(versionSwitcherSelectors.versionSwitcherButton).click();
  envNames.forEach((envName) => {
    const envSelector = `[data-cy="${envName.name}-environment-name"]`;
    if (envName.hasAccess) cy.get(envSelector).should("be.enabled");
    else assertRestrictedTooltip(envSelector, envName.name);
  });
}

const assertEnvRestrictedTooltip = (envButton, env) => {
  envButton.find(multiEnvSelector.envNameDropdown)
    .should("have.css", "cursor", "not-allowed")
    .trigger("mouseover", { force: true });

  cy.get("div.tooltip-inner")
    .should("be.visible")
    .and("contain", `Access to ${env} environment is restricted. Contact admin to know more.`);

  envButton.trigger("mouseout", { force: true });
  cy.get("div.tooltip-inner").should("not.exist");
};

export const verifyPreviewAccess = (
  envNames,
  { appId, componentName, canEdit, appName, version, canAllView, allowedEnvironment }
) => {
  const openPreviewSettingsIfClosed = () => {
    cy.get("body").then(($body) => {
      if ($body.find("div.preview-settings-overlay").length === 0) {
        cy.get(commonSelectors.previewSettings).should("be.visible").click();
      }
    });
  };
  const openEnvDropdown = () => {
    cy.get("body").then(($body) => {
      if (!$body.find(multiEnvSelector.selectedEnvName).length) {
        cy.get(multiEnvSelector.envContainer).should("be.visible").click();
      }
    });
  };

  if (canEdit) {
    cy.get(commonWidgetSelector.editorPreviewLink).first().should("have.attr", "href");
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
  } else {
    if (canAllView === false) return;

    // stable: go straight to preview URL, avoid hover/new-tab behavior
    const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId}/home?env=${allowedEnvironment}&version=${version}`;
    cy.visit(previewUrl, { failOnStatusCode: false });
  }

  envNames.forEach((envName) => {
    openPreviewSettingsIfClosed();
    openEnvDropdown();

    const envButton = cy.contains(
      '[data-cy="env-name-list"] button',
      new RegExp(`^${envName.name}$`, "i")
    );

    if (envName.hasAccess) {
      envButton.should("be.enabled").click();
      cy.get(commonWidgetSelector.draggableWidget(componentName)).should("contain", envName.name);
    } else {
      assertEnvRestrictedTooltip(envButton, envName.name);
    }
  });
};

export const verifyPreviewURLAccess = (envNames, { appId, componentName, version }) => {
  envNames.forEach((envName) => {
    const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId}/home?env=${envName.name}&version=${version}`;

    cy.visit(previewUrl);

    if (envName.hasAccess) {
      cy.url().should('include', `/applications/${appId}/home`);
      cy.url().should('include', `env=${envName.name}`);
      cy.get(commonWidgetSelector.draggableWidget(componentName))
        .should("contain", `${envName.name}`);
    } else {
      cy.url().should("match", /\/error\/restricted(-preview)?/);

      cy.get('[data-cy="modal-header"]')
        .should('be.visible')
        .and('contain.text', 'Restricted access');
    }
  });
};