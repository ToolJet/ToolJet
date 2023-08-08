import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { navigateToAllUserGroup } from "../utils/common";

export const manageGroupsElements = () => {
  cy.get(groupsSelector.groupLink("All users")).verifyVisibleElement(
    "have.text",
    groupsText.allUsers
  );
  cy.get(groupsSelector.groupLink("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.admin
  );

  navigateToAllUserGroup();

  cy.get(groupsSelector.groupPageTitle("All Users")).verifyVisibleElement(
    "have.text",
    groupsText.allUsers
  );
  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );

  cy.get(groupsSelector.appsLink).verifyVisibleElement(
    "have.text",
    groupsText.appsLink
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );

  cy.get(groupsSelector.appsLink).click();

  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.selectAddButton).verifyVisibleElement(
    "have.text",
    groupsText.addButton
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.textAppName
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get("body").then(($title) => {
    if ($title.text().includes(groupsText.helperTextNoAppsAdded)) {
      cy.get(groupsSelector.helperTextNoAppsAdded).verifyVisibleElement(
        "have.text",
        groupsText.helperTextNoAppsAdded
      );
      cy.get(groupsSelector.helperTextPermissions).verifyVisibleElement(
        "have.text",
        groupsText.helperTextPermissions
      );
    }
  });

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
  cy.get(groupsSelector.searchBox).should("be.visible");

  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.helperTextAllUsersIncluded).verifyVisibleElement(
    "have.text",
    groupsText.helperTextAllUsersIncluded
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
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get(groupsSelector.appsCreateCheck).uncheck();
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").check();
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get(groupsSelector.appsDeleteCheck).uncheck();

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck).should("be.visible").check();
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get(groupsSelector.foldersCreateCheck).uncheck();

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.workspaceVarCheckbox).uncheck();

  navigateToAllUserGroup();
  cy.get(groupsSelector.groupLink("Admin")).click();
  cy.get(groupsSelector.groupLink("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.admin
  );

  cy.get(groupsSelector.appsLink).click();
  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.textAppName
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get("body").then(($title) => {
    if ($title.text().includes(groupsText.helperTextNoAppsAdded)) {
      cy.get(groupsSelector.helperTextNoAppsAdded).verifyVisibleElement(
        "have.text",
        groupsText.helperTextNoAppsAdded
      );
      cy.get(groupsSelector.helperTextPermissions).verifyVisibleElement(
        "have.text",
        groupsText.helperTextPermissions
      );
    }
  });

  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.multiSelectSearch).should("be.visible");
  cy.get(groupsSelector.mutiSelectAddButton("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.addUsersButton
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
  cy.get(groupsSelector.appsCreateCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.appsDeleteCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get(groupsSelector.foldersCreateCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.workspaceVarCheckbox).verifyVisibleElement(
    "be.disabled"
  );
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
