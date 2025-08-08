import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";
import {
  navigateToManageGroups,
  viewAppCardOptions,
} from "Support/utils/common";
import {
  OpenGroupCardOption,
  verifyGroupCardOptions,
  duplicateMultipleGroups,
  createGroupAddAppAndUserToGroup,
  groupPermission,
} from "Support/utils/manageGroups";
import { cyParamName } from "Selectors/common";
import { roleBasedOnboarding } from "Support/utils/onboarding";

const data = {};
data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;
const workspaceName = fake.firstName;
const workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");

describe("Groups duplication", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.apiCreateWorkspace(workspaceName, workspaceSlug);
    cy.visit(`${workspaceSlug}`);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${workspaceSlug}`);
    groupPermission(
      [
        "appsCreateCheck",
        "appsDeleteCheck",
        "workspaceVarCheckbox",
        "foldersCreateCheck",
      ],
      "Admin"
    );
    cy.apiCreateApp(data.appName);

  });

  it("Should verify the group duplication feature", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    cy.visit(`${workspaceSlug}`);
    roleBasedOnboarding(data.firstName, data.email, "builder");
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`${workspaceSlug}`);
    navigateToManageGroups();
    verifyGroupCardOptions("Admin");
    cy.wait(3000);
    cy.get('[datacy="groups-list-option-button"]').click();
    cy.get('[data-cy="delete-group-card-option"] > .col').should(
      "have.class",
      "disable"
    );
    duplicateMultipleGroups(["Admin", "Builder", "End-user"]);
    createGroupAddAppAndUserToGroup(data.groupName, data.email);
    groupPermission(
      [
        "appsCreateCheck",
        "appsDeleteCheck",
        "workspaceVarCheckbox",
        "foldersCreateCheck",
      ],
      data.groupName,
      true
    );
    cy.wait(1000);
    verifyGroupCardOptions(data.groupName);
    cy.get(groupsSelector.duplicateOption).click();

    cy.get(commonSelectors.defaultModalTitle).verifyVisibleElement(
      "have.text",
      "Duplicate group"
    );
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      "Duplicate the following parts of the group"
    );
    cy.get(groupsSelector.usersCheckInput).should("be.visible");
    cy.verifyLabel("Users");
    cy.get(groupsSelector.permissionCheckInput).should("be.visible");
    cy.verifyLabel("Permissions");
    cy.get(groupsSelector.appsCheckInput).should("be.visible");
    cy.verifyLabel("Apps");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(groupsSelector.confimButton).verifyVisibleElement(
      "have.text",
      "Duplicate"
    );

    cy.get(groupsSelector.confimButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Group duplicated successfully!"
    );

    cy.wait(500);
    cy.get(
      groupsSelector.duplicatedGroupLink(data.groupName)
    ).verifyVisibleElement("have.text", `${data.groupName}_copy`);

    OpenGroupCardOption(data.groupName);
    cy.get(groupsSelector.deleteGroupOption).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
    cy.apiLogout();

    cy.apiLogin(data.email, "password");
    cy.visit(`${workspaceSlug}`);
    cy.wait(2000);
    cy.get(commonSelectors.appCreateButton).should("be.visible");
    cy.get(commonSelectors.createNewFolderButton).should("be.visible");
    cy.wait(2000);
    cy.reload();
    viewAppCardOptions(data.appName);
    cy.contains("Delete app").should("exist");
    cy.get(commonSelectors.workspaceConstantsIcon).should("be.visible");
    cy.apiLogout();

    cy.apiLogin();
    cy.visit(`${workspaceSlug}`);
    navigateToManageGroups();
    OpenGroupCardOption(`${data.groupName}_copy`);
    cy.get(groupsSelector.deleteGroupOption).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
    cy.apiLogout();

    cy.apiLogin(data.email, "password");
    cy.visit(`${workspaceSlug}`);
    cy.get(commonSelectors.appCreateButton).should("not.exist");
    cy.get(commonSelectors.createNewFolderButton).should("not.exist");
    cy.get(commonSelectors.workspaceConstantsIcon).should("not.exist");
  });
});
