import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as groups from "Support/utils/manageGroups";

const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
const newGroupname = `New ${groupName}`;

describe("Manage Groups", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });
  it("Should verify the elements and functionalities on manage groups page", () => {
    common.navigateToManageGroups();
    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Workspace settings");
    });
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      " Groups"
    );

    groups.manageGroupsElements();
    //Custom groups test cases
    cy.get(groupsSelector.createNewGroupButton).should("be.visible").click();
    cy.get(groupsSelector.addNewGroupModalTitle).verifyVisibleElement(
      "have.text",
      groupsText.cardTitle
    );
    cy.get(groupsSelector.groupNameInput).should("be.visible");
    cy.get(groupsSelector.cancelButton).verifyVisibleElement(
      "have.text",
      groupsText.cancelButton
    );
    cy.get(groupsSelector.createGroupButton).verifyVisibleElement(
      "have.text",
      groupsText.createGroupButton
    );
    cy.get(groupsSelector.cancelButton).click();

    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupsText.admin);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupNameExistToast
    );
    cy.get(groupsSelector.cancelButton).click();
    cy.get(groupsSelector.groupNameInput).should("not.exist");

    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupCreatedToast
    );

    cy.get(groupsSelector.groupLink(groupName)).verifyVisibleElement(
      "have.text",
      groupName
    );
    cy.get(groupsSelector.groupLink(groupName)).click();

    cy.get(groupsSelector.groupPageTitle(groupName)).verifyVisibleElement(
      "have.text",
      `${groupName} (0)`
    );
    cy.get('[data-cy="group-name-update-link"]').should("be.visible");
    groups.OpenGroupCardOption(groupName);
    cy.get(groupsSelector.deleteGroupOption).verifyVisibleElement(
      "have.text",
      groupsText.deleteGroupButton
    );

    cy.get(groupsSelector.usersLink).verifyVisibleElement(
      "have.text",
      groupsText.usersLink
    );
    cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
      "have.text",
      groupsText.permissionsLink
    );
    cy.get('[data-cy="granular-access-link"]').verifyVisibleElement(
      "have.text",
      "Granular access"
    );
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
      "have.text",
      groupsText.userNameTableHeader
    );
    cy.get(groupsSelector.emailTableHeader).verifyVisibleElement(
      "have.text",
      groupsText.emailTableHeader
    );

    cy.get('[data-cy="user-empty-page-icon"]').should("be.visible");
    cy.get('[data-cy="user-empty-page"]').verifyVisibleElement(
      "have.text",
      "No users added yet"
    );
    cy.get('[data-cy="user-empty-page-info-text"]').verifyVisibleElement(
      "have.text",
      "Add users to this group to configure permissions for them!"
    );

    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
      "have.text",
      groupsText.resourcesApps
    );
    cy.get(groupsSelector.permissionsTableHeader).verifyVisibleElement(
      "have.text",
      groupsText.permissionsTableHeader
    );

    cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
      "have.text",
      groupsText.resourcesApps
    );
    cy.get(groupsSelector.appsCreateCheck).should("be.visible");
    cy.get(groupsSelector.appsCreateCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(groupsSelector.appsCreateCheck).uncheck();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.createLabel
    );
    cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
      "have.text",
      "Create apps in this workspace"
    );
    cy.get(groupsSelector.appsDeleteCheck).should("be.visible");
    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );
    cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
      "have.text",
      "Delete any app in this workspace"
    );

    cy.get(groupsSelector.appsDeleteCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(groupsSelector.appsDeleteCheck).uncheck();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );

    cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
      "have.text",
      groupsText.resourcesFolders
    );
    cy.get(groupsSelector.foldersCreateCheck).should("be.visible");

    cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.folderCreateLabel
    );
    cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
      "have.text",
      "All operations on folders"
    );
    cy.get(groupsSelector.foldersCreateCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(groupsSelector.foldersCreateCheck).uncheck();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );

    cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
      "have.text",
      groupsText.resourcesWorkspaceVar
    );
    cy.get(groupsSelector.workspaceVarCheckbox).should("be.visible");
    cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
      "have.text",
      "All operations on workspace constants"
    );
    cy.get(groupsSelector.workspaceVarCheckbox).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(groupsSelector.workspaceVarCheckbox).uncheck();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );

    cy.get('[data-cy="granular-access-link"]').click();

    cy.get('[data-cy="add-apps-buton"]').click();

    cy.get('[data-cy="modal-title"]:eq(2)').verifyVisibleElement(
      "have.text",
      "Add app permissions"
    );
    cy.get('[data-cy="modal-close-button"]').should("be.visible").click();
    cy.get('[data-cy="add-apps-buton"]').click();
    cy.get('[data-cy="modal-title"]:eq(2)').verifyVisibleElement(
      "have.text",
      "Add app permissions"
    );
    //modal
    cy.get('[data-cy="permission-name-label"]').verifyVisibleElement(
      "have.text",
      "Permission name"
    );
    cy.get('[data-cy="permission-name-input"]')
      .should("be.visible")
      .and("have.attr", "placeholder", "Eg. Product analytics apps");
    cy.get('[data-cy="permission-name-help-text"]').verifyVisibleElement(
      "have.text",
      "Permission name must be unique and max 50 characters"
    );

    cy.get('[data-cy="permission-label"]').verifyVisibleElement(
      "have.text",
      "Permission"
    );
    cy.get('[data-cy="edit-permission-radio"]').should("be.visible");
    cy.get('[data-cy="edit-permission-label"]').verifyVisibleElement(
      "have.text",
      "Edit"
    );
    cy.get('[data-cy="edit-permission-info-text"]').verifyVisibleElement(
      "have.text",
      "Access to app builder"
    );

    cy.get('[data-cy="view-permission-radio"]')
      .should("be.visible")
      .and("be.checked");
    cy.get('[data-cy="view-permission-label"]').verifyVisibleElement(
      "have.text",
      "View"
    );
    cy.get('[data-cy="view-permission-info-text"]').verifyVisibleElement(
      "have.text",
      "Only access released version of apps"
    );

    cy.get('[data-cy="hide-from-dashboard-permission-input"]').should(
      "be.visible"
    );
    cy.get(
      '[data-cy="hide-from-dashboard-permission-label"]'
    ).verifyVisibleElement("have.text", "Hide from dashboard");
    cy.get(
      '[data-cy="hide-from-dashboard-permission-info-text"]'
    ).verifyVisibleElement("have.text", "App will be accessible by URL only");

    cy.get('[data-cy="resource-label"]').verifyVisibleElement(
      "have.text",
      "Resources"
    );
    cy.get('[data-cy="all-apps-radio"]').should("be.visible").and("be.checked");
    cy.get('[data-cy="all-apps-label"]').verifyVisibleElement(
      "have.text",
      "All apps"
    );
    cy.get('[data-cy="all-apps-info-text"]').verifyVisibleElement(
      "have.text",
      "This will select all apps in the workspace including any new apps created"
    );

    cy.get('[ data-cy="custom-radio"]').should("be.visible");
    cy.get('[data-cy="custom-label"]').verifyVisibleElement(
      "have.text",
      "Custom"
    );
    cy.get('[data-cy="custom-info-text"]').verifyVisibleElement(
      "have.text",
      "Select specific applications you want to add to the group"
    );
    cy.get('[data-cy="resources-container"]').should("be.visible");
    cy.get('[data-cy="confim-button"]').verifyVisibleElement(
      "have.text",
      "Add"
    );
    cy.get('[data-cy="confim-button"]').should('be.disabled')
    cy.get('[data-cy="cancel-button"]')
      .verifyVisibleElement("have.text", "Cancel")
      .click();

    cy.get('[data-cy="add-apps-buton"]').click();

    cy.clearAndType('[data-cy="permission-name-input"]', groupName)
    cy.get('[data-cy="confim-button"]').click()
    cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();

    //edit modal
    cy.get('[data-cy="modal-title"]:eq(2)').verifyVisibleElement(
      "have.text",
      "Edit app permissions"
    );
    cy.get('[data-cy="delete-button"]').should('be.visible');
    cy.get('[data-cy="modal-close-button"]').should("be.visible").click();
    cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();
    cy.get('[data-cy="modal-title"]:eq(2)').verifyVisibleElement(
      "have.text",
      "Edit app permissions"
    );

    cy.get('[data-cy="permission-name-label"]').verifyVisibleElement(
      "have.text",
      "Permission name"
    );
    cy.get('[data-cy="permission-name-input"]')
      .should("be.visible")
      .and("have.value", groupName);
    cy.get('[data-cy="permission-name-help-text"]').verifyVisibleElement(
      "have.text",
      "Permission name must be unique and max 50 characters"
    );

    cy.get('[data-cy="permission-label"]').verifyVisibleElement(
      "have.text",
      "Permission"
    );
    cy.get('[data-cy="edit-permission-radio"]').should("be.visible").check();
    cy.get('[data-cy="edit-permission-label"]').verifyVisibleElement(
      "have.text",
      "Edit"
    );
    cy.get('[data-cy="edit-permission-info-text"]').verifyVisibleElement(
      "have.text",
      "Access to app builder"
    );

    cy.get('[data-cy="view-permission-radio"]')
      .should("be.visible")
      .and("not.be.checked");
    cy.get('[data-cy="view-permission-label"]').verifyVisibleElement(
      "have.text",
      "View"
    );
    cy.get('[data-cy="view-permission-info-text"]').verifyVisibleElement(
      "have.text",
      "Only access released version of apps"
    );

    cy.get('[data-cy="hide-from-dashboard-permission-input"]').should(
      "be.visible"
    );
    cy.get(
      '[data-cy="hide-from-dashboard-permission-label"]'
    ).verifyVisibleElement("have.text", "Hide from dashboard");
    cy.get(
      '[data-cy="hide-from-dashboard-permission-info-text"]'
    ).verifyVisibleElement("have.text", "App will be accessible by URL only");

    cy.get('[data-cy="resource-label"]').verifyVisibleElement(
      "have.text",
      "Resources"
    );
    cy.get('[data-cy="all-apps-radio"]').should("be.visible").and("be.checked");
    cy.get('[data-cy="all-apps-label"]').verifyVisibleElement(
      "have.text",
      "All apps"
    );
    cy.get('[data-cy="all-apps-info-text"]').verifyVisibleElement(
      "have.text",
      "This will select all apps in the workspace including any new apps created"
    );

    cy.get('[ data-cy="custom-radio"]').should("be.visible");
    cy.get('[data-cy="custom-label"]').verifyVisibleElement(
      "have.text",
      "Custom"
    );
    cy.get('[data-cy="custom-info-text"]').verifyVisibleElement(
      "have.text",
      "Select specific applications you want to add to the group"
    );
    cy.get('[data-cy="resources-container"]').should("be.visible");
    cy.get('[data-cy="confim-button"]').verifyVisibleElement(
      "have.text",
      "Update"
    );
    cy.get('[data-cy="confim-button"]').should('be.enabled')
    cy.get('[data-cy="cancel-button"]')
      .verifyVisibleElement("have.text", "Cancel")
      .click();

    cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();
    cy.clearAndType('[data-cy="permission-name-input"]', groupName)
    cy.get('[data-cy="edit-permission-radio"]').check();
    cy.get('[data-cy="confim-button"]').click()

    cy.get('[data-cy="group-name-update-link"]').click();
    cy.get(groupsSelector.updateGroupNameModalTitle).verifyVisibleElement(
      "have.text",
      groupsText.updateGroupNameModalTitle
    );
    cy.get(groupsSelector.groupNameInput).should("be.visible");
    cy.get(groupsSelector.cancelButton).verifyVisibleElement(
      "have.text",
      groupsText.cancelButton
    );
    cy.get(groupsSelector.createGroupButton).verifyVisibleElement(
      "have.text",
      groupsText.saveButton
    );
    cy.get(groupsSelector.cancelButton).click();

    cy.get('[data-cy="group-name-update-link"]').click();

    cy.clearAndType(groupsSelector.groupNameInput, newGroupname);

    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupNameUpdateSucessToast
    );

    cy.get(groupsSelector.groupLink(newGroupname)).verifyVisibleElement(
      "have.text",
      newGroupname
    );
    cy.get(groupsSelector.groupLink(newGroupname)).click();
    groups.OpenGroupCardOption(newGroupname);

    cy.get(groupsSelector.deleteGroupOption).click();
    cy.get(groupsSelector.confirmText).verifyVisibleElement(
      "have.text",
      groupsText.confirmText
    );
    cy.get(commonSelectors.buttonSelector("Cancel")).verifyVisibleElement(
      "have.text",
      groupsText.confirmCancelButton
    );
    cy.get(commonSelectors.buttonSelector("Yes")).verifyVisibleElement(
      "have.text",
      groupsText.confirmYesButton
    );
    cy.get(commonSelectors.buttonSelector("Cancel")).click();

    cy.get(groupsSelector.groupLink(newGroupname)).click();
    groups.OpenGroupCardOption(newGroupname);
    cy.get(groupsSelector.deleteGroupOption).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
  });
});
