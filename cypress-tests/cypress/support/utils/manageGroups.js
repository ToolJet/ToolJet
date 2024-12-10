import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  navigateToAllUserGroup,
  createGroup,
  navigateToManageGroups,
} from "Support/utils/common";
import { cyParamName } from "Selectors/common";

export const manageGroupsElements = () => {
  cy.get('[data-cy="page-title"]').should(($el) => {
    expect($el.contents().last().text().trim()).to.eq("Groups");
  });

  cy.get('[data-cy="user-role-title"]').verifyVisibleElement(
    "have.text",
    "USER ROLE"
  );
  /*
  cy.get('[data-cy="admin-list-item"]').verifyVisibleElement(
    "have.text",
    "Admin"
  );
  cy.get('[data-cy="admin-title"]').verifyVisibleElement(
    "have.text",
    "Admin (1)"
  );
  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );
  cy.get(groupsSelector.granularLink).verifyVisibleElement(
    "have.text",
    "Granular access"
  );

  // cy.get(groupsSelector.appsLink).click();

  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.userNameTableHeader
  );
  cy.get(groupsSelector.emailTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.emailTableHeader
  );

  cy.get(groupsSelector.permissionsLink).click();
  cy.get('[data-cy="helper-text-admin-app-access"]')
    .eq(0)
    .verifyVisibleElement(
      "have.text",
      " Admin has edit access to all apps. These are not editableread documentation to know more !"
    );
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );

  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
    "have.text",
    "Create apps in this workspace"
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );

  cy.get('[data-cy="granular-access-link"]').click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-edit-radio"]').should("be.checked");
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );
  cy.get(groupsSelector.appHideLabel).verifyVisibleElement(
    "have.text",
    "Hide from dashbaord" //need to fix spell
  )
  cy.get('[data-cy="app-hide-from-dashboard-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );
  //My
  cy.get('[data-cy="add-apps-buton"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="add-apps-buton"]').verifyVisibleElement(
    "have.text",
    "Add apps"
  );
  //My
  cy.get(groupsSelector.granularAccessPermission)
    .trigger('mouseover');
  cy.get(groupsSelector.editGranularPermissionIcon)
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(groupsSelector.groupLink("Builder")).click();
  cy.get(groupsSelector.groupLink("Builder")).verifyVisibleElement(
    "have.text",
    "Builder"
  );

  cy.get('[data-cy="builder-title"]').verifyVisibleElement(
    "have.text",
    "Builder (1)"
  );

  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );
  cy.get(groupsSelector.granularLink).verifyVisibleElement(
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

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").and("be.checked");
  cy.get(groupsSelector.appsCreateCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsCreateCheck).check();
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
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").and("be.checked");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.appsDeleteCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsDeleteCheck).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("be.checked");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );
  cy.get(groupsSelector.foldersCreateCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.foldersCreateCheck).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("be.checked");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );
  cy.get(groupsSelector.workspaceVarCheckbox).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.workspaceVarCheckbox).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.granularLink).click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]').should("be.visible")//.and("be.checked"); due to db seed data updated
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]').should("be.visible");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );

  // cy.get(groupsSelector.appViewRadio).should("be.visible").check();
  // cy.verifyToastMessage(
  //   commonSelectors.toastMessage,
  //   groupsText.permissionUpdatedToast
  // );
  cy.get(groupsSelector.appViewRadio).should('be.checked');

  cy.get(groupsSelector.appHideCheckbox).should("be.visible");
  cy.get(groupsSelector.appHideLabel).verifyVisibleElement(
    "have.text",
    "Hide from dashbaord"
  )
  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get(groupsSelector.appHideCheckbox).should('be.enabled').check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appHideCheckbox).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get('[data-cy="app-edit-radio"]').check();

  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );

  cy.get(groupsSelector.granularAccessPermission)
    .trigger('mouseover');
  cy.get(groupsSelector.editGranularPermissionIcon)
    .should("be.visible")
    .and("be.enabled");
  cy.get(groupsSelector.editGranularPermissionIcon).click();

  //Edit modal
  cy.get(groupsSelector.addEditPermissionModal).should('be.visible');
  cy.get(groupsSelector.addEditPermissionModalTitle).should('have.text', groupsText.editPermissionModalTitle);
  cy.get(groupsSelector.deletePermissionIcon).should('be.visible').and('be.enabled');
  cy.get(groupsSelector.deletePermissionIcon).click();
  cy.get(".confirm-dialogue-modal").should('be.visible');
  cy.get('[data-cy="modal-message"]').should('have.text', "This permission will be permanently deleted. Do you want to continue?");
  cy.get('[data-cy="yes-button"]').should('be.visible').and('be.enabled');
  cy.get('[data-cy="cancel-button"]').should('be.visible').and('be.enabled');
  cy.get('[data-cy="cancel-button"]').click();
  cy.get('[data-cy="edit-permission-radio"]').should("be.visible").and('be.checked');
  addEditPermissionModal();
  cy.get('[data-cy="resources-container"]').should("be.visible");
  cy.get('[data-cy="confim-button"]').verifyVisibleElement(
    "have.text",
    "Update"
  );

  cy.get(groupsSelector.addAppButton).should('be.visible').and('be.enabled');
  cy.get(groupsSelector.addAppButton).verifyVisibleElement(
    "have.text",
    "Add apps"
  );
  //Add Modal
  cy.get(groupsSelector.addAppButton).click();
  cy.get(groupsSelector.addEditPermissionModalTitle).should('have.text', groupsText.addPermissionModalTitle);
  cy.get('[data-cy="view-permission-radio"]').should("be.visible").and('be.checked');
  addEditPermissionModal();
  cy.get('[data-cy="confim-button"]').should('be.enabled')
  cy.get('[data-cy="cancel-button"]')
    .verifyVisibleElement("have.text", "Cancel")
    .click();

  //End User
  cy.get(groupsSelector.groupLink("End-user")).click();
  cy.get(groupsSelector.groupLink("End-user")).verifyVisibleElement(
    "have.text",
    "End-user"
  );

  cy.get('[data-cy="end-user-title"]').verifyVisibleElement(
    "have.text",
    "End-user (0)"
  );

  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
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

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
    "have.text",
    "Create apps in this workspace"
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );

  cy.get('[data-cy="granular-access-link"]').click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  //cy.get('[data-cy="app-view-radio"]').should("be.checked");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );
  cy.get('[data-cy="app-hide-from-dashboard-radio"]').should("be.visible");

  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );
  cy.get('[data-cy="add-apps-buton"]').verifyVisibleElement(
    "have.text",
    "Add apps"
  );
};

export const permissionModal = () => {

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

  cy.get('[data-cy="view-permission-radio"]').should("be.visible");
  cy.get('[data-cy="view-permission-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="view-permission-info-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );

  cy.get('[data-cy="hide-from-dashboard-permission-input"]').should(
    "be.visible")
    .and('be.disabled');
  cy.get(
    '[data-cy="hide-from-dashboard-permission-label"]'
  ).verifyVisibleElement("have.text", "Hide from dashbaord");
  cy.get(
    '[data-cy="hide-from-dashboard-permission-info-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  //hide checkbox
  cy.get('[data-cy="view-permission-radio"]').then(($radio) => {
    if (!$radio.is(':checked')) {
      cy.wrap($radio).click();
    }
  });
  cy.get('[data-cy="hide-from-dashboard-permission-input"]').should('be.enabled');
  cy.get('[data-cy="hide-from-dashboard-permission-input"]').check();
  cy.get('[data-cy="hide-from-dashboard-permission-input"]').should('be.checked');
  cy.get('[data-cy="edit-permission-radio"]').check();
  cy.get('[data-cy="hide-from-dashboard-permission-input"]').should('be.disabled');

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

  cy.get('[ data-cy="custom-radio"]').should("be.visible").and('be.disabled');
  cy.get('[data-cy="custom-label"]').verifyVisibleElement(
    "have.text",
    "Custom"
  );
  cy.get('[data-cy="custom-info-text"]').verifyVisibleElement(
    "have.text",
    "Select specific applications you want to add to the group"
  );
  */
};

//Chat gpt code from here
// Utility function to verify element visibility and text
const verifyElement = (selector, text) => {
  cy.get(selector).verifyVisibleElement('have.text', text);
};

// Utility function to verify visibility and attributes
// const verifyAttribute = (selector, attribute, value) => {
//   cy.get(selector).should('be.visible').and('have.attr', attribute, value);
// };

// Utility function to handle checkbox state and toast message verification
const toggleCheckbox = (selector, toastSelector, toastMessage) => {
  cy.get(selector).should('be.visible').check();
  cy.verifyToastMessage(toastSelector, toastMessage);
  cy.get(selector).uncheck();
  cy.verifyToastMessage(toastSelector, toastMessage);
};

// Main test function
export const groupPermissionTests = () => {
  // Admin Permissions
  // Admin List Item Verification
  verifyElement(groupsSelector.adminListItem, 'Admin');
  verifyElement(groupsSelector.adminTitle, 'Admin (1)');

  // Group Permission Elements Verification
  verifyElement(groupsSelector.createNewGroupButton, groupsText.createNewGroupButton);
  verifyElement(groupsSelector.usersLink, groupsText.usersLink);
  verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
  verifyElement(groupsSelector.granularLink, 'Granular access');

  // Resource Verification
  verifyElement(groupsSelector.textDefaultGroup, groupsText.textDefaultGroup);
  verifyElement(groupsSelector.nameTableHeader, groupsText.userNameTableHeader);
  verifyElement(groupsSelector.emailTableHeader, groupsText.emailTableHeader);

  // Permissions Page Navigation and Verifications
  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.adminAccessHelperText)
    .eq(0)
    .verifyVisibleElement(
      "have.text",
      groupsText.adminAccessHelperText
    );

  // Granular Access Verifications
  verifyElement(groupsSelector.resourcesApps, groupsText.resourcesApps);
  verifyElement(groupsSelector.permissionstableHedaer, groupsText.permissionstableHedaer);

  cy.get(groupsSelector.appsCreateCheck).should('be.visible').and('be.checked').and('be.disabled');

  verifyElement(groupsSelector.appsCreateLabel, groupsText.createLabel);
  verifyElement(groupsSelector.appCreateHelperText, groupsText.appCreateHelperText);

  cy.get(groupsSelector.appsDeleteCheck).should('be.visible').and('be.checked').and('be.disabled');
  verifyElement(groupsSelector.appsDeleteLabel, groupsText.deleteLabel);
  verifyElement(groupsSelector.appDeleteHelperText, groupsText.appDeleteHelperText);



  // Folder Permissions
  verifyElement(groupsSelector.resourcesFolders, groupsText.resourcesFolders);
  verifyElement(groupsSelector.foldersCreateLabel, groupsText.folderCreateLabel);
  verifyElement(groupsSelector.foldersHelperText, groupsText.folderHelperText);
  //toggleCheckbox(groupsSelector.foldersCreateCheck, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
  cy.get(groupsSelector.foldersCreateCheck).should('be.visible').and('be.checked').and('be.disabled');

  // Workspace Variable Permissions
  verifyElement(groupsSelector.resourcesWorkspaceVar, groupsText.resourcesWorkspaceVar);
  verifyElement(groupsSelector.workspaceCreateLabel, groupsText.workspaceCreateLabel);
  verifyElement(groupsSelector.workspaceHelperText, groupsText.workspaceHelperText);
  //toggleCheckbox(groupsSelector.workspaceVarCheckbox, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
  cy.get(groupsSelector.workspaceVarCheckbox).should('be.visible').and('be.checked').and('be.disabled');
  // Granular Permissions
  cy.get(groupsSelector.granularLink).click();
  verifyElement(groupsSelector.nameTableHeader, groupsText.nameTableHeader);
  verifyElement(groupsSelector.permissionstableHedaer, groupsText.permissionTableHeader);
  verifyElement(groupsSelector.resourceHeader, groupsText.resourcesTableHeader);
  verifyElement(groupsSelector.appsText, groupsText.appsLink);
  cy.get(groupsSelector.appEditRadio)
    .should("be.visible")
    .and('be.checked')
    .and("have.attr", "disabled");
  verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
  verifyElement(groupsSelector.appEditHelperText, groupsText.appEditHelperText);
  cy.get(groupsSelector.appViewRadio)
    .should("be.visible")
    .and("have.attr", "disabled");
  verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
  verifyElement(groupsSelector.appViewHelperText, groupsText.appViewHelperText);
  cy.get(groupsSelector.appHideCheckbox).should("be.visible");

  verifyElement(groupsSelector.appHideHelperText, groupsText.appHideHelperText);
  verifyElement(groupsSelector.groupChip, groupsText.groupChipText);
  cy.get(groupsSelector.granularAccessPermission)
    .trigger('mouseover');
  cy.get(groupsSelector.editGranularPermissionIcon).should('be.visible').and('be.disabled');

  //Builder 
  verifyElement(groupsSelector.adminListItem, 'Builder');
  verifyElement(groupsSelector.adminTitle, 'Builder (1)');

  // Group Permission Elements Verification
  verifyElement(groupsSelector.createNewGroupButton, groupsText.createNewGroupButton);
  verifyElement(groupsSelector.usersLink, groupsText.usersLink);
  verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
  verifyElement(groupsSelector.granularLink, 'Granular access');

  // Resource Verification
  verifyElement(groupsSelector.textDefaultGroup, groupsText.textDefaultGroup);
  verifyElement(groupsSelector.nameTableHeader, groupsText.userNameTableHeader);
  verifyElement(groupsSelector.emailTableHeader, groupsText.emailTableHeader);

  // Granular Access Verifications
  verifyElement(groupsSelector.resourcesApps, groupsText.resourcesApps);
  verifyElement(groupsSelector.permissionstableHedaer, groupsText.permissionstableHedaer);

  cy.get(groupsSelector.appsCreateCheck).should('be.visible').and('be.checked');
  verifyElement(groupsSelector.appsCreateLabel, groupsText.createLabel);
  verifyElement(groupsSelector.appCreateHelperText, groupsText.appCreateHelperText);
  toggleCheckbox(groupsSelector.appsCreateCheck, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

  cy.get(groupsSelector.appsDeleteCheck).should('be.visible').and('be.checked');
  verifyElement(groupsSelector.appsDeleteLabel, groupsText.deleteLabel);
  verifyElement(groupsSelector.appDeleteHelperText, groupsText.appDeleteHelperText);
  toggleCheckbox(groupsSelector.appsDeleteCheck, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

  // Folder Permissions
  verifyElement(groupsSelector.resourcesFolders, groupsText.resourcesFolders);
  cy.get(groupsSelector.foldersCreateCheck).should('be.visible').and('be.checked');
  verifyElement(groupsSelector.foldersCreateLabel, groupsText.folderCreateLabel);
  verifyElement(groupsSelector.foldersHelperText, groupsText.folderHelperText);
  toggleCheckbox(groupsSelector.foldersCreateCheck, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);


  // Workspace Variable Permissions
  verifyElement(groupsSelector.resourcesWorkspaceVar, groupsText.resourcesWorkspaceVar);
  cy.get(groupsSelector.workspaceVarCheckbox).should('be.visible').and('be.checked');
  verifyElement(groupsSelector.workspaceCreateLabel, groupsText.workspaceCreateLabel);
  verifyElement(groupsSelector.workspaceHelperText, groupsText.workspaceHelperText);
  toggleCheckbox(groupsSelector.workspaceVarCheckbox, commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

  // Granular Permissions
  cy.get(groupsSelector.granularLink).click();
  verifyElement(groupsSelector.nameTableHeader, groupsText.nameTableHeader);
  cy.get(groupsSelector.deletePermissionIcon).should('be.visible').and('be.enabled');
  cy.get(groupsSelector.deletePermissionIcon).click();
  cy.get(".confirm-dialogue-modal").should('be.visible');
  verifyElement(groupsSelector.deleteMessage, groupsText.deleteMessage);
  cy.get(groupsSelector.yesButton).should('be.visible').and('be.enabled');
  cy.get(groupsSelector.cancelButton).should('be.visible').and('be.enabled');
  cy.get(groupsSelector.cancelButton).click();
  verifyElement(groupsSelector.permissionstableHedaer, groupsText.permissionTableHeader);
  verifyElement(groupsSelector.resourceHeader, groupsText.resourcesTableHeader);
  verifyElement(groupsSelector.appsText, groupsText.appsLink);
  cy.get(groupsSelector.appEditRadio)
    .should("be.visible")
    .and('be.checked')
    .and("have.attr", "enabled");
  verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
  verifyElement(groupsSelector.appEditHelperText, groupsText.appEditHelperText);
  cy.get(groupsSelector.appViewRadio)
    .should("be.visible")
    .and("have.attr", "enabled");
  verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
  verifyElement(groupsSelector.appViewHelperText, groupsText.appViewHelperText);
  cy.get(groupsSelector.appHideCheckbox).should("be.visible").and('have.attr', 'disabled');
  verifyElement(groupsSelector.appHideLabel, groupsText.appHideLabel);
  verifyElement(groupsSelector.appHideHelperText, groupsText.appHideHelperText);

  verifyElement(groupsSelector.groupChip, groupsText.groupChipText);
  cy.get(groupsSelector.granularAccessPermission)
    .trigger('mouseover');
  cy.get(groupsSelector.editGranularPermissionIcon).should('be.visible').and('be.enabled').click();
  permissionModal();

  verifyElement(groupsSelector.resourceLabel, groupsText.resourcesheader);
  cy.get('[data-cy="resources-container"]').should("be.visible");
  cy.get(groupsSelector.allAppsRadio).should("be.visible").and("be.checked");
  verifyElement(groupsSelector.allAppsLabel, groupsText.allAppsLabel);
  verifyElement(groupsSelector.allAppsHelperText, groupsText.allAppsHelperText);

  cy.get(groupsSelector.customradio).should("be.visible").should('be.disabled');
  verifyElement(groupsSelector.customLabel, groupsText.customLabel);
  verifyElement(groupsSelector.customHelperText, groupsText.customHelperText);

  verifyElement(groupsSelector.confimButton, groupsText.updateButtonText);
  cy.get(groupsSelector.confimButton).should('be.enabled')
  verifyElement(groupsSelector.cancelButton, groupsText.cancelButton).click();

};

// Permission Modal Verification
export const permissionModal = () => {
  verifyElement(groupsSelector.permissionNameLabel, groupsText.permissionNameLabel);
  verifyElement(groupsSelector.permissionNameInput, 'Apps');
  verifyElement(groupsSelector.permissionNameHelperText, groupsText.permissionNameHelperText);

  verifyElement(groupsSelector.permissionLabel, groupsText.permissionLabel);
  verifyElement(groupsSelector.editPermissionLabel, groupsText.editPermissionLabel);
  verifyElement(groupsSelector.editPermissionHelperText, groupsText.editPermissionHelperText);

  verifyElement(groupsSelector.viewPermissionLabel, groupsText.viewPermissionLabel);
  verifyElement(groupsSelector.viewPermissionHelperText, groupsText.viewPermissionHelperText);

  verifyAttribute(groupsSelector.hidePermissionInput, 'disabled', '');
};

export const addAppToGroup = (appName) => {
  cy.get(groupsSelector.appsLink).click();
  cy.wait(500);
  cy.get(groupsSelector.appSearchBox).realClick();
  cy.wait(500);
  cy.get(groupsSelector.searchBoxOptions).contains(appName).click();
  cy.get(groupsSelector.selectAddButton).click();
  cy.contains("tr", appName)
    .parent()
    .within(() => {
      cy.get("td input").eq(1).check();
    });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "App permissions updated"
  );
};

export const addUserToGroup = (groupName, email) => {
  cy.get(groupsSelector.usersLink).click();
  cy.get(".select-search__input").type(email);
  cy.get(".item-renderer").within(() => {
    cy.get("input").check();
  });
  cy.get(`[data-cy="${groupName}-group-add-button"]`).click();
};

export const createGroupAddAppAndUserToGroup = (groupName, email) => {
  cy.intercept("GET", "http://localhost:3000/api/group_permissions").as(
    `${groupName}`
  );
  createGroup(groupName);

  cy.wait(`@${groupName}`).then((groupResponse) => {
    const groupId = groupResponse.response.body.group_permissions.find(
      (group) => group.group === groupName
    ).id;

    cy.getCookie("tj_auth_token").then((cookie) => {
      const headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token=${cookie.value}`,
      };

      cy.request({
        method: "PUT",
        url: `http://localhost:3000/api/group_permissions/${groupId}`,
        headers: headers,
        body: { add_apps: [Cypress.env("appId")] },
      }).then((patchResponse) => {
        expect(patchResponse.status).to.equal(200);
      });

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        const userId = resp.rows[0].id;

        cy.request({
          method: "PUT",
          url: `http://localhost:3000/api/group_permissions/${groupId}`,
          headers: headers,
          body: { add_users: [userId] },
        }).then((patchResponse) => {
          expect(patchResponse.status).to.equal(200);
        });

        cy.get('[data-cy="all-users-list-item"] > span').click();
        cy.get(`[data-cy="${cyParamName(groupName)}-list-item"]`).click();
        cy.wait(1000);
        cy.get(groupsSelector.appsLink).click();
        cy.wait(1000);
        cy.get('[data-cy="checkbox-app-edit"]').check();
      });
    });
  });
};

export const OpenGroupCardOption = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName))
    .trigger("mouseenter")
    .trigger("mouseover")
    .then(() => {
      cy.wait(2000).then(() => {
        cy.get(
          `[data-cy="${cyParamName(
            groupName
          )}-list-item"] > :nth-child(2) > .tj-base-btn`
        ).click({ force: true });
      });
    });
};
export const verifyGroupCardOptions = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  OpenGroupCardOption(groupName);
  cy.get(groupsSelector.duplicateOption).verifyVisibleElement(
    "have.text",
    "Duplicate group"
  );
  cy.get(groupsSelector.deleteGroupOption).verifyVisibleElement(
    "have.text",
    groupsText.deleteGroupButton
  );
};

export const groupPermission = (
  fieldsToCheckOrUncheck,
  groupName = "All users",
  shouldCheck = false
) => {
  navigateToManageGroups();
  cy.get(groupsSelector.groupLink(groupName));
  cy.get(groupsSelector.permissionsLink).click();

  fieldsToCheckOrUncheck.forEach((field) => {
    const selector = groupsSelector[field];
    cy.get(selector).then(($el) => {
      if ($el.is(":checked") !== shouldCheck) {
        if (shouldCheck) {
          cy.get(selector).check();
        } else {
          cy.get(selector).uncheck();
        }
      }
    });
  });
};

export const duplicateGroup = () => {
  OpenGroupCardOption(groupName);
  cy.get(groupsSelector.duplicateOption).click();

};
