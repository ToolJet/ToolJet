import { fake } from "Fixtures/fake";
import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import { apiDeleteGroup } from "Support/utils/manageGroups";
import {
  addGranularPermissionViaUI,
  createGroupViaUI,
  openGroupThreeDotMenu,
  verifyDuplicateModal,
} from "Support/utils/platform/customGroups";
import {
  verifyCheckPermissionStates,
  verifyGranularPermissionModalStates,
  verifyModuleGranularAccessByRole,
  verifyModuleGranularPermissionDelete,
  verifyPermissionCheckBoxLabelsAndHelperTexts,
} from "Support/utils/platform/groupsUI";

// Ref: Module Permissions UI cases for automation - PR https://github.com/ToolJet/ToolJet/pull/16918
// Mirrors the Apps/Workflows/Datasources granular-permission flow pattern used in
// customGroupUI.cy.js / userRoleUI.cy.js, scoped to Module permissions only.
describe("Module Permissions UI and Functionality verification", () => {
  const groupName = `${fake.firstName.replaceAll("[^A-Za-z]", "")}mod`;
  const modulePermissionName = "Modules";
  const data = {};

  beforeEach(() => {
    data.workspaceName = fake.firstName;
    data.workspaceSlug = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((response) => {
      Cypress.env("workspaceId", response.body.organization_id);
    });
    cy.visit(data.workspaceSlug);
    navigateToManageGroups();
    cy.viewport(2000, 1900);
  });

  it("should verify Module Create/Delete permissions, granular access modal states, permission deletion, and duplicate group checkbox", () => {
    cy.ifEnv("Enterprise", () => {
      createGroupViaUI(groupName);

      // TC-M1: Module Create/Delete permissions displayed on the Permissions tab,
      // including checked/enabled state for a freshly created custom group and
      // the label + helper-text copy (shared with Apps/Workflows/Datasources).
      cy.get(groupsSelector.permissionsLink).click();
      cy.get(groupsSelector.resourceModules)
        .should("be.visible")
        .and("have.text", "Modules");
      verifyCheckPermissionStates("custom");
      verifyPermissionCheckBoxLabelsAndHelperTexts();

      // TC-M2/TC-M3: add a module permission, then verify + toggle the Add/Edit modal -
      // same shape as verifyAppGranularModalFlow in customGroupUI.cy.js since Modules
      // share Apps' Edit + second-radio + Hide-from-dashboard shape (not the simpler
      // single-toggle shape used for Workflows/Datasources, which have no hide-checkbox).
      cy.get(groupsSelector.granularLink).click();
      addGranularPermissionViaUI(modulePermissionName, {
        resourceType: "module",
        permission: "edit",
        scope: "all",
      });

      cy.get(groupsSelector.moduleGranularAccess).realHover();
      cy.get(groupsSelector.editModuleGranularAccess).click();

      verifyGranularPermissionModalStates("module", "custom");

      // Edit + Hide-from-dashboard reuse the Apps modal's data-cy; Build with is module-specific.
      cy.get(groupsSelector.buildWithPermissionRadio).check();
      verifyGranularPermissionModalStates("module", "custom", {
        editRadio: { checked: false, enabled: true },
        buildWithRadio: { checked: true, enabled: true },
        hideCheckbox: { enabled: true },
      });

      cy.get(groupsSelector.editPermissionRadio).check();
      verifyGranularPermissionModalStates("module", "custom", {
        editRadio: { checked: true, enabled: true },
        buildWithRadio: { checked: false, enabled: true },
        hideCheckbox: { enabled: true },
      });

      cy.get(groupsSelector.cancelButton).click();

      // TC-M4: delete icon + confirmation modal on the Module permission's edit modal
      verifyModuleGranularPermissionDelete();

      // TC-M8: Modules checkbox in the Duplicate Group dialog
      openGroupThreeDotMenu(groupName);
      cy.get(groupsSelector.duplicateOption).click();
      verifyDuplicateModal(groupName);

      cy.verifyElement(groupsSelector.modulesLabel, "Modules");
      cy.get(groupsSelector.modulesCheckInput)
        .should("be.visible")
        .and("be.checked");

      cy.get(groupsSelector.cancelButton).click();

      apiDeleteGroup(groupName);
    });
  });

  it("should verify Module Permissions UI for Builder and End-user default groups", () => {
    cy.ifEnv("Enterprise", () => {
      // TC-M7: Builder - Add Module modal fields are enabled
      cy.get(groupsSelector.groupLink("Builder")).click();
      cy.get(groupsSelector.granularLink).click();
      cy.get(groupsSelector.addPermissionButton).click();
      cy.get(groupsSelector.addModuleButton).should("be.enabled").click();
      cy.get(groupsSelector.editPermissionRadio).should("be.enabled");
      cy.get(groupsSelector.buildWithPermissionRadio).should("be.enabled");
      cy.get(groupsSelector.hidePermissionInput).should("be.enabled");
      cy.get(groupsSelector.cancelButton).click();

      // TC-M5: End-user - Add Module is disabled with an explanatory tooltip
      cy.get(groupsSelector.groupLink("End-user")).click();
      cy.get(groupsSelector.granularLink).click();
      cy.get(groupsSelector.addPermissionButton).click();
      cy.get(groupsSelector.addModuleButton).should("be.disabled");
      cy.get(groupsSelector.addModuleButton).realHover();
      cy.contains("End-user implicitly gets access").should("be.visible");
    });
  });

  it("should verify the default Modules granular permission for Admin and Builder groups", () => {
    cy.ifEnv("Enterprise", () => {
      // TC-M6: Admin gets a non-editable "Modules" row, auto-seeded on workspace
      // creation (isAll: true - server/src/modules/group-permissions/util.service.ts).
      cy.get(groupsSelector.groupLink("Admin")).click();
      verifyModuleGranularAccessByRole("admin");

      // Builder gets the same row, but editable.
      cy.get(groupsSelector.groupLink("Builder")).click();
      verifyModuleGranularAccessByRole("builder");
    });
  });
});
