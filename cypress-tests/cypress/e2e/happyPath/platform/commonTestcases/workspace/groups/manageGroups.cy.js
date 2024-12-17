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
    cy.get(groupsSelector.groupNameUpdateLink).should("be.visible");
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

    cy.get(groupsSelector.userEmptyPageIcon).should("be.visible");
    cy.get(groupsSelector.userEmptyPageTitle).verifyVisibleElement(
      "have.text",
      groupsText.userEmptyPageTitle
    );
    cy.get(groupsSelector.userEmptyPageHelperText).verifyVisibleElement(
      "have.text",
      groupsText.userEmptyPageHelperText
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
    cy.get(groupsSelector.appCreateHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appCreateHelperText
    );
    cy.get(groupsSelector.appsDeleteCheck).should("be.visible");
    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );
    cy.get(groupsSelector.appDeleteHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appDeleteHelperText
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
    cy.get(groupsSelector.foldersHelperText).verifyVisibleElement(
      "have.text",
      groupsText.folderHelperText
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
    cy.get(groupsSelector.workspaceHelperText).verifyVisibleElement(
      "have.text",
      groupsText.workspaceHelperText
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

    cy.get(groupsSelector.granularLink).click();
    cy.get(groupsSelector.granularEmptyPageIcon).should('be.visible');
    cy.get(groupsSelector.emptyPagePermissionTitle).verifyVisibleElement(
      "have.text",
      groupsText.emptyPagePermissionTitle
    );
    cy.get(groupsSelector.emptyPagePermissionHelperText).verifyVisibleElement(
      "have.text",
      groupsText.emptyPagePermissionHelperText
    );
    cy.get(groupsSelector.addAppButton).click();

    cy.get(`${groupsSelector.addEditPermissionModalTitle}:eq(2)`).verifyVisibleElement(
      "have.text",
      groupsText.addPermissionModalTitle
    );
    //cy.get(commonSelectors.modalCloseButton).click();
    //cy.get(groupsSelector.addAppButton).click();
    cy.get(`${groupsSelector.addEditPermissionModalTitle}:eq(2)`).verifyVisibleElement(
      "have.text",
      groupsText.addPermissionModalTitle
    );
    //modal
    cy.get(groupsSelector.permissionNameLabel).verifyVisibleElement(
      "have.text",
      groupsText.permissionNameLabel
    );
    cy.get(groupsSelector.permissionNameInput)
      .should("be.visible")
      .and("have.attr", "placeholder", "Eg. Product analytics apps");
    cy.get(groupsSelector.permissionNameHelperText).verifyVisibleElement(
      "have.text",
      groupsText.permissionNameHelperText
    );

    cy.get(groupsSelector.permissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.permissionLabel
    );
    cy.get(groupsSelector.editPermissionRadio).should("be.visible");
    cy.get(groupsSelector.editPermissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.editPermissionLabel
    );
    cy.get(groupsSelector.editPermissionHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appEditHelperText
    );

    cy.get(groupsSelector.viewPermissionRadio)
      .should("be.visible")
      .and("be.checked");
    cy.get(groupsSelector.viewPermissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.viewPermissionLabel
    );
    cy.get(groupsSelector.viewPermissionHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appViewHelperText
    );

    cy.get(groupsSelector.hidePermissionInput).should(
      "be.visible"
    );
    cy.get(
      groupsSelector.appHidePermissionModalLabel
    ).verifyVisibleElement("have.text", groupsText.appHideLabel);
    cy.get(groupsSelector.appHidePermissionModalHelperText
    ).verifyVisibleElement("have.text", groupsText.appHideHelperText);

    cy.get(groupsSelector.resourceLabel).verifyVisibleElement(
      "have.text",
      groupsText.resourcesheader
    );
    cy.get(groupsSelector.allAppsRadio).should("be.visible").and("be.checked");
    cy.get(groupsSelector.allAppsLabel).verifyVisibleElement(
      "have.text",
      groupsText.groupChipText
    );
    cy.get(groupsSelector.allAppsHelperText).verifyVisibleElement(
      "have.text",
      groupsText.allAppsHelperText
    );

    cy.get(groupsSelector.customradio).should("be.visible");
    cy.get(groupsSelector.customLabel).verifyVisibleElement(
      "have.text",
      groupsText.customLabel
    );
    cy.get(groupsSelector.customHelperText).verifyVisibleElement(
      "have.text",
      groupsText.customHelperText
    );
    cy.get(groupsSelector.resourceContainer).should("be.visible");
    cy.get(groupsSelector.confimButton).verifyVisibleElement(
      "have.text",
      groupsText.addButtonText
    );
    cy.get(groupsSelector.confimButton).should('be.disabled')
    cy.get(groupsSelector.cancelButton)
      .verifyVisibleElement("have.text", groupsText.cancelButton)
      .click();

    cy.get(groupsSelector.addAppButton).click();

    cy.clearAndType(groupsSelector.permissionNameInput, groupName)
    cy.get(groupsSelector.confimButton).click()
    cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();

    //edit modal
    cy.get(`${groupsSelector.addEditPermissionModalTitle}:eq(2)`).verifyVisibleElement(
      "have.text",
      groupsText.editPermissionModalTitle
    );
    cy.get(groupsSelector.deletePermissionIcon).should('be.visible');
    //cy.get(commonSelectors.modalCloseButton).should("be.visible").click();
    //cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();
    cy.get(`${groupsSelector.addEditPermissionModalTitle}:eq(2)`).verifyVisibleElement(
      "have.text",
      groupsText.editPermissionModalTitle
    );

    cy.get(groupsSelector.permissionNameLabel).verifyVisibleElement(
      "have.text",
      groupsText.permissionNameLabel
    );
    cy.get(groupsSelector.permissionNameInput)
      .should("be.visible")
      .and("have.value", groupName);
    cy.get(groupsSelector.permissionNameHelperText).verifyVisibleElement(
      "have.text",
      groupsText.permissionNameHelperText
    );

    cy.get(groupsSelector.permissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.permissionLabel
    );
    cy.get(groupsSelector.editPermissionRadio).should("be.visible").check();
    cy.get(groupsSelector.editPermissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.editPermissionLabel
    );
    cy.get(groupsSelector.editPermissionHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appEditHelperText
    );

    cy.get(groupsSelector.viewPermissionRadio)
      .should("be.visible")
      .and("not.be.checked");
    cy.get(groupsSelector.viewPermissionLabel).verifyVisibleElement(
      "have.text",
      groupsText.viewPermissionLabel
    );
    cy.get(groupsSelector.viewPermissionHelperText).verifyVisibleElement(
      "have.text",
      groupsText.appViewHelperText
    );

    cy.get(groupsSelector.hidePermissionInput).should(
      "be.visible"
    );
    cy.get(
      groupsSelector.appHideLabel
    ).verifyVisibleElement("have.text", groupsText.appHideLabelPermissionModal);
    cy.get(
      groupsSelector.appHideHelperText
    ).verifyVisibleElement("have.text", groupsText.appHideHelperText);

    cy.get(groupsSelector.resourceLabel).verifyVisibleElement(
      "have.text",
      groupsText.resourcesheader
    );
    cy.get(groupsSelector.allAppsRadio).should("be.visible").and("be.checked");
    cy.get(groupsSelector.allAppsLabel).verifyVisibleElement(
      "have.text",
      groupsText.allAppsLabel
    );
    cy.get(groupsSelector.allAppsHelperText).verifyVisibleElement(
      "have.text",
      groupsText.allAppsHelperText
    );

    cy.get(groupsSelector.customradio).should("be.visible");
    cy.get(groupsSelector.customLabel).verifyVisibleElement(
      "have.text",
      groupsText.customLabel
    );
    cy.get(groupsSelector.customHelperText).verifyVisibleElement(
      "have.text",
      groupsText.customHelperText
    );
    cy.get(groupsSelector.resourceContainer).should("be.visible");
    cy.get(groupsSelector.confimButton).verifyVisibleElement(
      "have.text",
      groupsText.updateButtonText
    );
    cy.get(groupsSelector.confimButton).should('be.enabled')
    cy.get(commonSelectors.cancelButton)
      .verifyVisibleElement("have.text", groupsText.cancelButton)
      .click();

    cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();
    cy.clearAndType(groupsSelector.permissionNameInput, groupName)
    cy.get(groupsSelector.editPermissionRadio).check();
    cy.get(groupsSelector.confimButton).click()

    cy.get(groupsSelector.groupNameUpdateLink).click();
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

    cy.get(groupsSelector.groupNameUpdateLink).click();

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
