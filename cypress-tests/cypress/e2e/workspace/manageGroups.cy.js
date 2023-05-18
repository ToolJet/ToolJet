import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as groups from "Support/utils/manageGroups";
import * as permissions from "Support/utils/userPermissions";

const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
const newGroupname = `New ${groupName}`;

describe("Manage Groups", () => {
  before(() => {
    cy.appUILogin();
    permissions.reset();
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
      groupName
    );

    cy.get(groupsSelector.updateGroupNameLink(groupName)).verifyVisibleElement(
      "have.text",
      groupsText.editGroupNameButton
    );

    cy.get(groupsSelector.deleteGroupLink(groupName)).verifyVisibleElement(
      "have.text",
      groupsText.deleteGroupButton
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

    cy.get(groupsSelector.searchBox).should("be.visible");

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

    cy.get(groupsSelector.updateGroupNameLink(groupName)).click();
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

    cy.get(groupsSelector.updateGroupNameLink(groupName)).click();

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

    cy.get(groupsSelector.deleteGroupLink(newGroupname)).click();
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

    cy.get(groupsSelector.deleteGroupLink(newGroupname)).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
  });
});
