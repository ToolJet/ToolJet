import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import { addNewconstants } from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import {
    setupWorkspaceAndInviteUser,
    verifyBasicPermissions,
    createGroupsAndAddUserInGroup,
    updateRole,
    verifySettingsAccess,
} from "Support/utils/manageGroups";

import {
    createFolder,
    deleteFolder,
    logout,
    navigateToManageGroups,
    selectAppCardOption,
} from "Support/utils/common";
import {
    exportAppModalSelectors,
    importSelectors,
} from "Selectors/exportImport";
import { dashboardText } from "../../../../../../constants/texts/dashboard";

describe("Manage Groups", () => {
    let data = {};

    before(() => {
        cy.exec("mkdir -p ./cypress/downloads/");
        cy.wait(3000);
    });

    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            appName: fake.companyName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            workspaceSlug: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            folderName: fake.companyName,
        };

        cy.defaultWorkspaceLogin();
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
    });

    it("should verify end-user privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email
        );
        verifyBasicPermissions(false);
    });

    it("should verify builder privileges and role updates in custom groups", () => {
        const builderGroup = fake.firstName.replace(/[^A-Za-z]/g, "");
        const endUserGroup = fake.firstName.replace(/[^A-Za-z]/g, "");

        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "Builder"
        );

        // Verify builder permissions
        verifyBasicPermissions(true);

        // App operations
        cy.createApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appCreatedToast
        );
        cy.backToApps();

        cy.deleteApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appDeletedToast
        );

        // Folder operations
        createFolder(data.folderName);
        deleteFolder(data.folderName);

        // Constants management
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        addNewconstants(data.firstName, data.appName);
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.firstName)
        ).click();
        cy.get(commonSelectors.yesButton).click();

        verifySettingsAccess(false);

        cy.get(commonSelectors.homePageLogo).click();
        cy.createApp(data.appName);
        cy.backToApps();
        cy.wait(1000);

        //verify clone access
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.cloneAppOption)
        );
        cy.get(commonSelectors.cloneAppButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dashboardText.appClonedToast
        );
        // cy.get(commonSelectors.cancelButton).click();
        cy.apiLogout();

        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        navigateToManageGroups();

        [builderGroup, endUserGroup].forEach((group) => {
            createGroupsAndAddUserInGroup(group, data.email);
        });

        cy.get(groupsSelector.groupLink(builderGroup)).click();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).check();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.permissionUpdatedToast
        );

        // Role update and verification
        updateRole("Builder", "End-user", data.email);

        // Verify group memberships
        cy.get(groupsSelector.groupLink("builder")).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("not.exist");

        cy.get(groupsSelector.groupLink(builderGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("not.exist");

        cy.get(groupsSelector.groupLink(endUserGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");

        cy.apiLogout();
        cy.apiLogin(data.email, "password");
        cy.visit(data.workspaceSlug);
        cy.get(commonSelectors.appCard(data.appName))
            .trigger("mouseover")
            .trigger("mouseenter")
            .find(commonSelectors.editButton)
            .should("not.exist");
    });

    it("should verify admin privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "admin"
        );

        verifyBasicPermissions(true);

        // App operations
        cy.createApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appCreatedToast
        );
        cy.backToApps();

        cy.deleteApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appDeletedToast
        );

        // Folder operations
        createFolder(data.folderName);
        deleteFolder(data.folderName);

        // Constants management
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        addNewconstants(data.firstName, data.appName);
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.firstName)
        ).click();
        cy.get(commonSelectors.yesButton).click();

        // Settings access check - explicitly verify workspace settings
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");
        cy.wait(1000);
    });
})