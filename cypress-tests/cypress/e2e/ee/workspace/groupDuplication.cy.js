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
import { eeGroupsSelector } from "Selectors/eeCommon";
import { eeGroupsText } from "Texts/eeCommon";
import { resetDsPermissions } from 'Support/utils/eeCommon'
import { deleteDatasource } from "Support/utils/dataSource";

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
        resetDsPermissions()

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

        cy.apiCreateApp(data.appName);
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
        cy.get(eeGroupsSelector.dsCreateCheck).check();
        cy.get(eeGroupsSelector.dsDeleteCheck).check();

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
        cy.get(groupsSelector.usersCheckInput).should("be.visible").and("be.checked");
        cy.verifyLabel("Users");
        cy.get(groupsSelector.permissionCheckInput).should("be.visible").and("be.checked");
        cy.verifyLabel("Permissions");
        cy.get(groupsSelector.appsCheckInput).should("be.visible").and("be.checked");
        cy.verifyLabel("Apps");
        cy.get('[data-cy="datasources-check-input"]').should("be.visible").and("be.checked");
        cy.verifyLabel("Datasources");

        cy.get(commonSelectors.cancelButton).verifyVisibleElement(
            "have.text",
            "Cancel"
        );
        cy.get(groupsSelector.confirmButton).verifyVisibleElement(
            "have.text",
            "Duplicate"
        );

        cy.get(groupsSelector.confirmButton).click();
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
        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            `cypress-${data.firstName}-postgresql`,
            "postgresql",
            [
                { key: "host", value: "localhost" },
                { key: "port", value: 5432 },
                { key: "database", value: "" },
                { key: "username", value: "dev@tooljet.io" },
                { key: "password", value: "password", encrypted: true },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );
        cy.visit("/my-workspace");
        cy.visit("/my-workspace");
        cy.get(commonSelectors.appCreateButton).should("be.visible");
        cy.get(commonSelectors.createNewFolderButton).should("be.visible");
        viewAppCardOptions(data.appName);
        cy.contains("Delete app").should("exist");
        cy.get(commonSelectors.workspaceConstantsIcon).should("be.visible");
        cy.get(commonSelectors.globalDataSourceIcon).should("exist");
        deleteDatasource(`cypress-${data.firstName}-postgresql`);
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
        cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

    });
});
