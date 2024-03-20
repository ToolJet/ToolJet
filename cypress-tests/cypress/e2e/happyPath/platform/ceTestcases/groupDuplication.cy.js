import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { fake } from "Fixtures/fake";
import {
    navigateToManageGroups,
    verifyTooltipDisabled,
    viewAppCardOptions,
} from "Support/utils/common";
import {
    OpenGroupCardOption,
    verifyGroupCardOptions,
    createGroupAddAppAndUserToGroup,
    groupPermission,
} from "Support/utils/manageGroups";
import { cyParamName } from "Selectors/common";
import { addNewUser } from "Support/utils/onboarding";

const data = {};

data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;

describe("Groups duplication", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        groupPermission(
            [
                "appsCreateCheck",
                "appsDeleteCheck",
                "workspaceVarCheckbox",
                "foldersCreateCheck",
            ],
            "All users"
        );
        cy.apiCreateApp(data.appName);
    });
    it("Should verify the group duplication feature", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");

        addNewUser(data.firstName, data.email);
        cy.logoutApi();

        cy.defaultWorkspaceLogin();
        navigateToManageGroups();

        verifyGroupCardOptions("All users");
        cy.get('[data-cy="delete-group-card-option"] > .col').should(
            "have.class",
            "disable"
        );

        verifyGroupCardOptions("Admin");
        cy.get('[data-cy="delete-group-card-option"] > .col').should(
            "have.class",
            "disable"
        );

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
        cy.get(groupsSelector.duplicatedGroupLink(data.groupName)).verifyVisibleElement(
            "have.text",
            `${data.groupName}_copy`
        );

        OpenGroupCardOption(data.groupName);
        cy.get(groupsSelector.deleteGroupOption).click();
        cy.get(commonSelectors.buttonSelector("Yes")).click();
        cy.logoutApi();

        cy.apiLogin(data.email, "password");
        cy.visit("/my-workspace");
        cy.get(commonSelectors.appCreateButton).should("be.visible");
        cy.get(commonSelectors.createNewFolderButton).should("be.visible");
        viewAppCardOptions(data.appName);
        cy.contains("Delete app").should("exist");
        cy.get(commonSelectors.workspaceConstantsIcon).should("be.visible");
        cy.logoutApi();

        cy.defaultWorkspaceLogin();
        navigateToManageGroups();
        OpenGroupCardOption(`${data.groupName}_copy`);
        cy.get(groupsSelector.deleteGroupOption).click();
        cy.get(commonSelectors.buttonSelector("Yes")).click();
        cy.logoutApi();

        cy.apiLogin(data.email, "password");
        cy.visit("/my-workspace");
        cy.get(commonSelectors.appCreateButton).should("not.exist");
        cy.get(commonSelectors.createNewFolderButton).should("not.exist");
        cy.get(commonSelectors.workspaceConstantsIcon).should("not.exist");
    });
});
