import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as groups from "Support/utils/manageGroups";
import * as permissions from "Support/utils/userPermissions";

const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

describe("Manage Groups", () => {
  before(() => {
    cy.appUILogin();
    permissions.reset();
  });
  it("Should verify the elements and functionalities on manage groups page", () => {
    common.navigateToManageGroups();
    groups.manageGroupsElements();
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupsText.admin);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupNameExistToast
    );
    cy.get(groupsSelector.cancelButton).click();
    cy.get(groupsSelector.tableHeader).verifyVisibleElement(
      "have.text",
      groupsText.tableHeader
    );
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
    cy.get(groupsSelector.appsLink).click();
    cy.get(groupsSelector.searchBox).should("be.visible");
    cy.get(groupsSelector.selectAddButton(groupName)).verifyVisibleElement(
      "have.text",
      groupsText.addButton
    );
    cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
      "have.text",
      groupsText.nameTableHeader
    );
    cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
      "have.text",
      groupsText.permissionstableHedaer
    );

    cy.get(groupsSelector.usersLink).click();
    cy.get(groupsSelector.multiSelectSearch).should("be.visible");
    cy.get(groupsSelector.mutiSelectAddButton(groupName)).verifyVisibleElement(
      "have.text",
      groupsText.addButton
    );
    cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
      "have.text",
      groupsText.nameTableHeader
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
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.createLabel
    );
    cy.get(groupsSelector.appsCreateCheck).uncheck();

    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.appsDeleteCheck).should("be.visible").check();

    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );
    cy.get(groupsSelector.permissionsLink).click();
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

    cy.contains("td", groupName)
      .parent()
      .within(() => {
        cy.get("td a").contains("Delete").click();
      });
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

    cy.contains("td", groupName)
      .parent()
      .within(() => {
        cy.get("td a").contains("Delete").click();
      });
    cy.get(commonSelectors.buttonSelector("Yes")).click();
  });
});
