import { fake } from "Fixtures/fake";

import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { groupsSelector } from "Selectors/manageGroups";
import {
  apiAddUserToGroup,
  apiCreateGroup,
  apiDeleteGroup,
} from "Support/utils/manageGroups";
import {
  addGranularPermissionViaUI,
  createGroupViaUI,
  deleteGroupViaUI,
  openGroupThreeDotMenu,
  renameGroupViaUI,
  switchBetweenAllAndCustom,
  verifyDuplicateModal,
  verifyGroupCreatedInSidebar,
  verifyGroupRemovedFromSidebar,
} from "Support/utils/platform/customGroups";

import {
  granularPermissionEmptyState,
  verifyCheckPermissionStates,
  verifyEmptyStates,
  verifyGranularAccessByRole,
  verifyGranularEditModal,
  verifyGranularPermissionModalStates,
  verifyGroupLinks,
  verifyPermissionCheckBoxLabelsAndHelperTexts,
  verifyUserRow,
} from "Support/utils/platform/groupsUI";

import { getGroupPermissionInput } from "Support/utils/userPermissions";

describe("Custom groups UI and Functionality verification", () => {
  const isEnterprise = Cypress.env("environment") === "Enterprise";

  const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
  const newGroupname = `New ${groupName}`;
  const groupName2 = `${fake.firstName.replaceAll("[^A-Za-z]", "")}2`;
  const groupName3 = `${fake.firstName.replaceAll("[^A-Za-z]", "")}3`;
  const duplicatedGroupName = `${groupName3}_copy`;
  const appPermissionName = "Apps";
  const workflowPermissionName = "Workflows";
  const datasourcePermissionName = "  Data sources";
  const permissionName2 = "Permission2";
  const data = {
    firstName: fake.firstName,
    email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
  };

  const visitGroupsSettingsPage = () => {
    cy.visit(`${data.workspaceSlug}/workspace-settings/groups`);
    cy.wait(2000);
  };

  const seedResourcesForGroup = (resourceName) => {
    cy.apiCreateApp(resourceName);
    cy.ifEnv("Enterprise", () => {
      cy.apiCreateWorkflow(resourceName);
      cy.apiCreateDataSource(
        `${Cypress.env("server_host")}/api/data-sources`,
        resourceName,
        "restapi",
        [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
      );
    });
  };

  const openGroupAndValidateEmptyStates = (groupName) => {
    cy.get(groupsSelector.groupLink(groupName)).click();

    verifyGroupLinks();
    verifyEmptyStates();

    cy.get(groupsSelector.groupLink(groupName)).click();
    granularPermissionEmptyState();

    cy.get(groupsSelector.permissionsLink).click();
    verifyCheckPermissionStates("custom");
    verifyPermissionCheckBoxLabelsAndHelperTexts();

    cy.get(groupsSelector.granularLink).click();
  };

  const configureInitialGranularPermissions = () => {
    addGranularPermissionViaUI(appPermissionName, {
      resourceType: "app",
      permission: "edit",
      scope: "all",
    });

    cy.ifEnv("Enterprise", () => {
      addGranularPermissionViaUI(workflowPermissionName, {
        resourceType: "workflow",
        permission: "build",
        scope: "all",
      });

      addGranularPermissionViaUI(datasourcePermissionName, {
        resourceType: "datasource",
        permission: "configure",
        scope: "all",
      });
    });

    verifyGranularAccessByRole("builder");
    verifyGranularEditModal("custom");
  };

  const verifyAppGranularModalFlow = (groupName) => {
    cy.wait(500);
    cy.get(groupsSelector.groupLink("builder")).click();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.granularLink).click();
    cy.wait(2000);
    cy.get(groupsSelector.granularAccessPermission).realHover();
    cy.get('[data-cy="edit-apps-granular-access"]').click();

    verifyGranularPermissionModalStates("app", "custom");

    cy.get(groupsSelector.viewPermissionRadio).check();
    switchBetweenAllAndCustom("custom");

    verifyGranularPermissionModalStates("app", "custom", {
      editRadio: { checked: false, enabled: true },
      viewRadio: { checked: true, enabled: true },
      hideCheckbox: { enabled: true },
      allAppsRadio: { checked: false, enabled: true },
      customRadio: { checked: true, enabled: true },
    });

    switchBetweenAllAndCustom("all");
    verifyGranularPermissionModalStates("app", "custom", {
      editRadio: { checked: false, enabled: true },
      viewRadio: { checked: true, enabled: true },
      hideCheckbox: { enabled: true },
      allAppsRadio: { checked: true, enabled: true },
      customRadio: { checked: false, enabled: true },
    });

    cy.get(groupsSelector.editPermissionRadio).check();
    verifyGranularPermissionModalStates("app", "custom", {
      editRadio: { checked: true, enabled: true },
      viewRadio: { checked: false, enabled: true },
      hideCheckbox: { enabled: false },
      allAppsRadio: { checked: true, enabled: true },
      customRadio: { checked: false, enabled: true },
    });

    cy.get(groupsSelector.cancelButton).click();
  };

  const verifyWorkflowGranularModalFlow = () => {
    cy.get('[data-cy="workflow-granular-access"]').realHover();
    cy.get('[data-cy="edit-workflow-granular-access"]').click();

    verifyGranularPermissionModalStates("workflow", "custom");

    cy.get(groupsSelector.executeWorkflowradio).check();
    verifyGranularPermissionModalStates("workflow", "custom", {
      buildRadio: { checked: false, enabled: true },
      executeRadio: { checked: true, enabled: true },
    });
    cy.get(groupsSelector.cancelButton).click();
  };

  const verifyDatasourceGranularModalFlow = () => {
    cy.get('[data-cy="datasource-granular-access"]').realHover();
    cy.get('[data-cy="edit-datasource-granular-access"]').click();
    verifyGranularPermissionModalStates("datasource", "custom");

    cy.get(groupsSelector.buildWithDatasourceRadio).check();
    verifyGranularPermissionModalStates("datasource", "custom", {
      configureRadio: { checked: false, enabled: true },
      buildWithRadio: { checked: true, enabled: true },
    });
    cy.get(groupsSelector.cancelButton).click();
  };

  const verifyEnterpriseGranularModalFlows = () => {
    cy.ifEnv("Enterprise", () => {
      verifyWorkflowGranularModalFlow();
      verifyDatasourceGranularModalFlow();
    });
  };

  const duplicateGroupAndValidate = (groupName, duplicatedGroupName, user) => {
    openGroupThreeDotMenu(groupName);
    cy.get(groupsSelector.duplicateOption).click();
    verifyDuplicateModal(groupName);

    cy.get(groupsSelector.cancelButton).click();

    openGroupThreeDotMenu(groupName);
    cy.get(groupsSelector.duplicateOption).click();
    cy.get(commonEeSelectors.confirmButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Group duplicated successfully"
    );

    cy.wait(1000);
    verifyUserRow(user.firstName, ` ${user.email}`);
    cy.get(groupsSelector.groupLink(duplicatedGroupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    verifyCheckPermissionStates("builder");

    cy.get(groupsSelector.granularLink).click();
    verifyGranularAccessByRole("builder");
  };

  let groupId3;

  beforeEach(() => {
    data.workspaceName = fake.firstName;
    data.workspaceSlug = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((response) => {
      Cypress.env("workspaceId", response.body.organization_id);
    })
    cy.viewport(2000, 1900);
  });


  it("should create, rename, and delete a custom group", () => {
    visitGroupsSettingsPage();

    createGroupViaUI(groupName);

    verifyGroupCreatedInSidebar(groupName);

    renameGroupViaUI(groupName, newGroupname);

    verifyGroupCreatedInSidebar(newGroupname);

    deleteGroupViaUI(newGroupname);

    verifyGroupRemovedFromSidebar(newGroupname);
  });

  it("should create custom group, verify empty states, add permissions, and manage granular access", () => {
    apiCreateGroup(groupName2);

    seedResourcesForGroup(groupName);

    visitGroupsSettingsPage();

    openGroupAndValidateEmptyStates(groupName2);
    configureInitialGranularPermissions();
    cy.wait(1000) // need to add alias to avoid flakiness
    verifyAppGranularModalFlow(groupName2);
    verifyEnterpriseGranularModalFlows();

    apiDeleteGroup(groupName2);
  });

  it("should create group via API, add permissions, duplicate group and verify all permissions are copied", () => {
    cy.apiFullUserOnboarding(data.firstName, data.email, "builder");
    cy.apiLogout();

    cy.apiLogin();
    seedResourcesForGroup(groupName3);

    apiCreateGroup(groupName3).then((groupId) => {
      groupId3 = groupId;
      apiAddUserToGroup(groupId3, data.email);
      cy.apiCreateGranularPermission(
        groupName3,
        "Apps",
        "app",
        { canEdit: true, canView: false, hideFromDashboard: false },
        []
      );

      cy.ifEnv("Enterprise", () => {
        cy.apiCreateGranularPermission(
          groupName3,
          "Workflows",
          "workflow",
          { canEdit: true, canView: false, hideFromDashboard: false },
          []
        );
        cy.apiCreateGranularPermission(
          groupName3,
          "Data sources",
          "datasource",
          { canUse: false, canConfigure: true },
          []
        );
      });
    });

    cy.apiUpdateGroupPermission(
      groupName3,
      getGroupPermissionInput(isEnterprise, true)
    );

    visitGroupsSettingsPage();
    duplicateGroupAndValidate(groupName3, duplicatedGroupName, data);

    apiDeleteGroup(duplicatedGroupName);
    apiDeleteGroup(groupName3);
  });
});
