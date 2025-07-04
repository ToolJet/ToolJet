import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as groups from "Support/utils/manageGroups";

const verifyModalFields = (isEdit = false, groupName = '') => {
  // Modal header verification
  cy.get(groupsSelector.permissionNameLabel).verifyVisibleElement(
    "have.text",
    groupsText.permissionNameLabel
  );
  cy.get(groupsSelector.permissionNameInput)
    .should("be.visible")
    .and(isEdit ? "have.value" : "have.attr",
      isEdit ? groupName : "placeholder",
      isEdit ? groupName : "Eg. Product analytics apps");
  cy.get(groupsSelector.permissionNameHelperText).verifyVisibleElement(
    "have.text",
    groupsText.permissionNameHelperText
  );

  // Permission section verification
  const permissionChecks = [
    { selector: groupsSelector.permissionLabel, text: groupsText.permissionLabel },
    { selector: groupsSelector.editPermissionLabel, text: groupsText.editPermissionLabel },
    { selector: groupsSelector.editPermissionHelperText, text: groupsText.appEditHelperText },
    { selector: groupsSelector.viewPermissionLabel, text: groupsText.viewPermissionLabel },
    { selector: groupsSelector.viewPermissionHelperText, text: groupsText.appViewHelperText }
  ];

  permissionChecks.forEach(({ selector, text }) => {
    cy.get(selector).verifyVisibleElement("have.text", text);
  });

  // Hide permission verification
  cy.get(groupsSelector.hidePermissionInput).should("be.visible");
  cy.get(groupsSelector.appHidePermissionModalLabel).verifyVisibleElement(
    "have.text",
    groupsText.appHideLabel
  );
  cy.get(groupsSelector.appHidePermissionModalHelperText).verifyVisibleElement(
    "have.text",
    groupsText.appHideHelperText
  );

  // Resource section verification
  const resourceChecks = [
    { selector: groupsSelector.resourceLabel, text: groupsText.resourcesheader },
    { selector: groupsSelector.allAppsLabel, text: isEdit ? groupsText.allAppsLabel : groupsText.groupChipText },
    { selector: groupsSelector.allAppsHelperText, text: groupsText.allAppsHelperText }
  ];

  resourceChecks.forEach(({ selector, text }) => {
    cy.get(selector).verifyVisibleElement("have.text", text);
  });

  // Button states
  cy.get(groupsSelector.confimButton).verifyVisibleElement(
    "have.text",
    isEdit ? groupsText.updateButtonText : groupsText.addButtonText
  );
  cy.get(groupsSelector.confimButton).should(isEdit ? "be.enabled" : "be.disabled");
  cy.get(groupsSelector.cancelButton).verifyVisibleElement("have.text", groupsText.cancelButton);

  if (isEdit) {
    cy.get(groupsSelector.deletePermissionIcon).should("be.visible");
  }
};

const verifyPermissionSection = () => {
  const permissionElements = [
    {
      resource: groupsSelector.resourcesApps,
      resourceText: groupsText.resourcesApps,
      check: groupsSelector.appsCreateCheck,
      label: groupsSelector.appsCreateLabel,
      labelText: groupsText.createLabel,
      helperText: groupsSelector.appCreateHelperText,
      helperContent: groupsText.appCreateHelperText
    },
    {
      resource: groupsSelector.resourcesFolders,
      resourceText: groupsText.resourcesFolders,
      check: groupsSelector.foldersCreateCheck,
      label: groupsSelector.foldersCreateLabel,
      labelText: groupsText.folderCreateLabel,
      helperText: groupsSelector.foldersHelperText,
      helperContent: groupsText.folderHelperText
    }
  ];

  permissionElements.forEach(({ resource, resourceText, check, label, labelText, helperText, helperContent }) => {
    cy.get(resource).verifyVisibleElement("have.text", resourceText);
    cy.get(check).should("be.visible");
    cy.get(check).check();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
    cy.get(check).uncheck();
    cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
    cy.get(label).verifyVisibleElement("have.text", labelText);
    cy.get(helperText).verifyVisibleElement("have.text", helperContent);
  });
};

const verifyEmptyStates = () => {
  // Users empty state
  cy.get(groupsSelector.userEmptyPageIcon).should("be.visible");
  cy.get(groupsSelector.userEmptyPageTitle).verifyVisibleElement("have.text", groupsText.userEmptyPageTitle);
  cy.get(groupsSelector.userEmptyPageHelperText).verifyVisibleElement("have.text", groupsText.userEmptyPageHelperText);

  // Granular permissions empty state
  cy.get(groupsSelector.granularLink).click();
  cy.get(groupsSelector.granularEmptyPageIcon).should("be.visible");
  cy.get(groupsSelector.emptyPagePermissionTitle).verifyVisibleElement("have.text", groupsText.emptyPagePermissionTitle);
  cy.get(groupsSelector.emptyPagePermissionHelperText).verifyVisibleElement("have.text", groupsText.emptyPagePermissionHelperText);
};

const verifyGroupLinks = () => {
  const links = [
    { selector: groupsSelector.usersLink, text: groupsText.usersLink },
    { selector: groupsSelector.permissionsLink, text: groupsText.permissionsLink },
    { selector: groupsSelector.granularLink, text: "Granular access" }
  ];

  links.forEach(({ selector, text }) => {
    cy.get(selector).verifyVisibleElement("have.text", text);
  });
};

describe("Manage Groups", () => {
  const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
  const newGroupname = `New ${groupName}`;
  const data = {
    firstName: fake.firstName,
    email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
    workspaceName: fake.firstName,
    workspaceSlug: fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "")
  };

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });

  it("Should verify the elements and functionalities on manage groups page", () => {
    // Setup workspace
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(`${data.workspaceSlug}`);
    common.navigateToManageGroups();

    // Verify page headers
    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Workspace settings");
    });
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", " Groups");

    // Verify base group elements
    groups.manageGroupsElements();

    // Test group creation flow
    const verifyGroupCreation = () => {
      cy.get(groupsSelector.createNewGroupButton).should("be.visible").click();
      cy.get(groupsSelector.addNewGroupModalTitle).verifyVisibleElement("have.text", groupsText.cardTitle);
      cy.get(groupsSelector.groupNameInput).should("be.visible");
      cy.get(groupsSelector.cancelButton).verifyVisibleElement("have.text", groupsText.cancelButton);
      cy.get(groupsSelector.createGroupButton).verifyVisibleElement("have.text", groupsText.createGroupButton);
      cy.get(groupsSelector.cancelButton).click();
    };

    // Test duplicate group name
    const testDuplicateGroup = () => {
      cy.get(groupsSelector.createNewGroupButton).click();
      cy.clearAndType(groupsSelector.groupNameInput, groupsText.admin);
      cy.get(groupsSelector.createGroupButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.groupNameExistToast);
      cy.get(groupsSelector.cancelButton).click();
      cy.get(groupsSelector.groupNameInput).should("not.exist");
    };

    // Create and verify new group
    const createNewGroup = () => {
      cy.get(groupsSelector.createNewGroupButton).click();
      cy.clearAndType(groupsSelector.groupNameInput, groupName);
      cy.get(groupsSelector.createGroupButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.groupCreatedToast);

      // Verify group creation
      cy.get(groupsSelector.groupLink(groupName)).verifyVisibleElement("have.text", groupName);
      cy.get(groupsSelector.groupLink(groupName)).click();
      cy.get(groupsSelector.groupPageTitle(groupName)).verifyVisibleElement("have.text", `${groupName} (0)`);
      cy.get(groupsSelector.groupNameUpdateLink).should("be.visible");

      // Verify group links and tables
      verifyGroupLinks();
      cy.get(groupsSelector.usersLink).click();
      cy.get(groupsSelector.nameTableHeader).verifyVisibleElement("have.text", groupsText.userNameTableHeader);
      cy.get(groupsSelector.emailTableHeader).verifyVisibleElement("have.text", groupsText.emailTableHeader);
      verifyEmptyStates();
    };

    verifyGroupCreation();
    testDuplicateGroup();
    createNewGroup();

    cy.get(groupsSelector.permissionsLink).click();
    verifyPermissionSection();

    // Test granular access section
    const verifyGranularAccess = () => {
      cy.get(groupsSelector.granularLink).click();
      cy.get(groupsSelector.addAppButton).click();
      verifyModalFields();

      // Add permission
      cy.clearAndType(groupsSelector.permissionNameInput, groupName);
      cy.get(groupsSelector.confimButton).click();

      // Verify edit mode
      cy.get(`[data-cy="${groupName.toLowerCase()}-text"]`).click();
      cy.get(`${groupsSelector.addEditPermissionModalTitle}:eq(2)`)
        .verifyVisibleElement("have.text", groupsText.editPermissionModalTitle);
      cy.get(groupsSelector.editPermissionRadio).check();
      verifyModalFields(true, groupName);
      cy.get(groupsSelector.confimButton).click();
    };

    verifyGranularAccess();

    // Test group rename and delete
    const verifyGroupRename = () => {
      cy.get(groupsSelector.groupNameUpdateLink).click();
      cy.get(groupsSelector.updateGroupNameModalTitle)
        .verifyVisibleElement("have.text", groupsText.updateGroupNameModalTitle);
      cy.clearAndType(groupsSelector.groupNameInput, newGroupname);
      cy.get(groupsSelector.createGroupButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.groupNameUpdateSucessToast);
      cy.get(groupsSelector.groupLink(newGroupname))
        .verifyVisibleElement("have.text", newGroupname);
    };

    const verifyGroupDelete = () => {
      cy.get(groupsSelector.groupLink(newGroupname)).click();
      groups.OpenGroupCardOption(newGroupname);
      cy.get(groupsSelector.deleteGroupOption).click();

      // Verify delete confirmation
      cy.get(groupsSelector.confirmText)
        .verifyVisibleElement("have.text", groupsText.confirmText);
      cy.get(commonSelectors.buttonSelector("Cancel"))
        .verifyVisibleElement("have.text", groupsText.confirmCancelButton);
      cy.get(commonSelectors.buttonSelector("Yes"))
        .verifyVisibleElement("have.text", groupsText.confirmYesButton);
      cy.get(commonSelectors.buttonSelector("Cancel")).click();

      // Actual delete
      groups.OpenGroupCardOption(newGroupname);
      cy.get(groupsSelector.deleteGroupOption).click();
      cy.get(commonSelectors.buttonSelector("Yes")).click();
    };

    verifyGroupRename();
    verifyGroupDelete();
  });
});