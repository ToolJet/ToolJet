// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// userPermissions.js
//   constantsOperations              -                    → access
//   verifyPermissions                role.verifyPermissions → access
//   getGroupPermissionInput          groupPermission.getInput → access
//   verifyBuilderPermissions         role.verifyBuilderPermissions → access
//   verifyBasicPermissions           role.verifyBasicPermissions → access
//   verifySettingsAccess             role.verifySettingsAccess → access
//   verifyEnvironmentTagsInGranularUI granularPermission.verifyEnvTagsUi → access
//   verifyEnvironmentAccess          granularPermission.verifyEnvAccess → access
//   verifyAppBuilderAccess           role.verifyAppBuilderAccess → access
//   verifyPreviewAccess              role.verifyPreviewAccess → access
//   verifyPreviewURLAccess           role.verifyPreviewUrlAccess → access
//   signup                           signup.viaPermissions → onboarding
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/platform/workspaceConstants";
import { addAndVerifyConstants } from "Support/utils/platform/workspaceConstants";
import { groupsSelector } from "Constants/selectors/platform/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import { versionSwitcherSelectors } from "Constants/selectors/platform/version";
import { multiEnvSelector } from "Constants/selectors/platform/eeCommon";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { commonText } from "Texts/common";

/**
 * @tjType   -
 * @tjBlock  access
 * @tjUsage  constantsOperations   // permission fixture data
 * @tjDom    none - data table. [UNREFERENCED 2026-09-06]
 */
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
/**
 * @tjType   role.verifyPermissions
 * @tjBlock  access
 * @tjUsage  verifyPermissions   // permission fixture data
 * @tjDom    none - data table. [UNREFERENCED 2026-09-06]
 */
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

/**
 * @tjType   groupPermission.getInput
 * @tjBlock  access
 * @tjUsage  getGroupPermissionInput(true, flag)
 * @tjDom    none - builds a permission payload
 */
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
      folderCreate: flag,
      folderDelete: flag,
      orgConstantCRUD: flag,
    }
    : {
      appCreate: flag,
      appDelete: flag,
      folderCreate: flag,
      folderDelete: flag,
      orgConstantCRUD: flag,
    };
};

/**
 * @tjType   role.verifyBuilderPermissions
 * @tjBlock  access
 * @tjUsage  verifyBuilderPermissions(...)
 * @tjDom    builder capability assertions
 */
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

/**
 * @tjType   role.verifyBasicPermissions
 * @tjBlock  access
 * @tjUsage  verifyBasicPermissions(true)
 * @tjDom    baseline capability assertions
 */
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

/**
 * @tjType   role.verifySettingsAccess
 * @tjBlock  access
 * @tjUsage  verifySettingsAccess(true)
 * @tjDom    workspace settings visibility per role
 */
export const verifySettingsAccess = (shouldExist = true) => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).should(
    shouldExist ? "exist" : "not.exist"
  );
};

/**
 * @tjType   granularPermission.verifyEnvTagsUi
 * @tjBlock  access
 * @tjUsage  verifyEnvironmentTagsInGranularUI('QA Team', tags)
 * @tjDom    env tags on a granular permission row
 */
export const verifyEnvironmentTagsInGranularUI = (groupName, environmentTags) => {
  navigateToManageGroups();
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.granularLink).click();

  cy.get(groupsSelector.granularAccessPermission).within(() => {
    cy.get(groupsSelector.environmentTagsContainer).should('be.visible');
    cy.get('.environment-tag').should('have.length', environmentTags.length);
    cy.get('.environment-tag').each(($el, index) => {
      cy.wrap($el).should('have.text', environmentTags[index]);
    });
  });
};


/**
 * @tjType   granularPermission.verifyEnvAccess
 * @tjBlock  access
 * @tjUsage  verifyEnvironmentAccess(environments, options)
 * @tjDom    per-environment access for a role
 */
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


/**
 * @tjType   role.verifyAppBuilderAccess
 * @tjBlock  access
 * @tjUsage  verifyAppBuilderAccess(envNames, opts)
 * @tjDom    editor reachable/blocked per environment
 */
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

/**
 * @tjType   role.verifyPreviewAccess
 * @tjBlock  access
 * @tjUsage  verifyPreviewAccess(...)
 * @tjDom    preview reachable/blocked per environment
 */
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

/**
 * @tjType   role.verifyPreviewUrlAccess
 * @tjBlock  access
 * @tjUsage  verifyPreviewURLAccess(envNames, opts)
 * @tjDom    direct preview URL per environment
 */
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

/**
 * @tjType   signup.viaPermissions
 * @tjBlock  onboarding
 * @tjUsage  signup('QA User', userEmail)
 * @tjDom    signup used as permission-test setup
 */
export const signup = (name, email) => {
  cy.get(commonSelectors.createAnAccountLink, { timout: 10000 }).click();
  cy.wait(2000);
  cy.get(onboardingSelectors.nameInput, { timeout: 1000 }).should(
    "not.be.disabled",
  );
  cy.get(onboardingSelectors.nameInput).clear();
  cy.get(onboardingSelectors.nameInput).type(name);

  cy.clearAndType(onboardingSelectors.loginEmailInput, email);
  cy.clearAndType(
    onboardingSelectors.loginPasswordInput,
    commonText.password,
    { timeout: 10000 },
  );
  cy.get(commonSelectors.signUpButton).click();
};
