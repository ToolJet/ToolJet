import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as workspaceConstants from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import * as groups from "Support/utils/manageGroups";
const data = {};

describe("Manage Groups", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
    });
    it("Invite end-user and verify privileges", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);
        cy.wait(1000);

        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email, "end-user");
        cy.wait(2000);

        cy.get(commonSelectors.dashboardAppCreateButton).should("be.disabled");
    });

    it("Invite builder, update role to end-user and verify privileges", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.appName = fake.companyName;
        data.folderName = fake.companyName;
        data.builderGroup = fake.firstName.replaceAll("[^A-Za-z]", "");
        data.enduserGroup = fake.firstName.replaceAll("[^A-Za-z]", "");

        //invite builder and check privileges
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);
        cy.wait(1000);

        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email, "Builder");

        cy.get(commonSelectors.dashboardAppCreateButton).should("be.enabled");
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

        common.createFolder(data.folderName);
        common.deleteFolder(data.folderName);

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        workspaceConstants.AddNewconstants(data.firstName, data.appName);

        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("not.exist");

        cy.get(commonSelectors.homePageLogo).click();
        cy.createApp(data.appName);

        cy.backToApps();

        cy.wait(1000);
        common.logout();

        //add user in builder level custom groups, user owned an app and update the user role to end-user
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.createGroupsAndAddUserInGroup(data.builderGroup, data.email);

        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).should('be.visible').check();
        cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);

        //end user group to verify user is not getting removed from it after role update
        groups.createGroupsAndAddUserInGroup(data.enduserGroup, data.email);

        groups.updateRole("Builder", "End-user", data.email);

        cy.get(groupsSelector.groupLink(data.builderGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("not.exist");

        cy.get(groupsSelector.groupLink(data.enduserGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");
    });

    it("Invite Admin and verify privileges", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");
        data.appName = fake.companyName;
        data.folderName = fake.companyName;

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email, "admin");

        cy.get(commonSelectors.dashboardAppCreateButton).should("be.enabled");
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

        common.createFolder(data.folderName);
        common.deleteFolder(data.folderName);

        cy.get(commonSelectors.workspaceConstantsIcon).click();
        workspaceConstants.AddNewconstants(data.firstName, data.appName);

        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");
    });

    it("Update last active admin role", () => {
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        cy.get(groupsSelector.groupLink('Admin')).click();
        cy.get(`[data-cy="dev@tooljet.io-user-row"] > :nth-child(3)`).click();
        cy.get(
            ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
        )
            .click()
            .type(`Builder{enter}`);
        cy.get(groupsSelector.confimButton).click();
        cy.get(groupsSelector.confimButton).click();
        cy.get(".modal-content").should('be.visible');
        cy.get(groupsSelector.modalHeader).should('have.text', groupsText.modalHeader);
        cy.get(groupsSelector.modalMessage).should('have.text', groupsText.modalMessage);
        cy.get(commonSelectors.closeButton).click();
    });

    it("Verify privileges in custom groups", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.groupName = fake.firstName.replaceAll("[^A-Za-z]", "");
        data.appName1 = fake.companyName;
        data.appName2 = fake.companyName;
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);

        //onboard new user
        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email, "end-user");
        common.logout();

        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.createGroupsAndAddUserInGroup(data.groupName, data.email);

        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).should('be.visible').check();

        //change role popup UI
        cy.get(commonSelectors.defaultModalTitle).contains(groupsText.changeUserRoleHeader);
        cy.get(groupsSelector.changeRoleModalMessage).contains(groupsText.changeUserRoleMessage);
        cy.get('.item-list').contains(data.email);
        cy.get(groupsSelector.confimButton).should('have.text', groupsText.continueButtonText);
        cy.get(commonSelectors.cancelButton).should('have.text', commonText.cancelButton).click();

        cy.get(groupsSelector.appsDeleteCheck).should('be.visible').check();
        cy.get('.modal-content').should('be.visible');
        cy.get(commonSelectors.cancelButton).click();

        cy.get(groupsSelector.foldersCreateCheck).should('be.visible').check();
        cy.get('.modal-content').should('be.visible');
        cy.get(commonSelectors.cancelButton).click();

        cy.get(groupsSelector.workspaceVarCheckbox).should('be.visible').check();
        cy.get('.modal-content').should('be.visible');
        cy.get(commonSelectors.cancelButton).click();

        //granular permission
        cy.get(groupsSelector.granularLink).click();
        cy.get(groupsSelector.addAppButton).click();
        cy.clearAndType(groupsSelector.permissionNameInput, data.firstName);
        cy.get(groupsSelector.editPermissionRadio).click();
        cy.get(groupsSelector.confimButton).click();
        cy.get('.modal-content').should('be.visible');
        cy.get(groupsSelector.modalHeader).should('have.text', groupsText.cantCreatePermissionModalHeader);
        cy.get(groupsSelector.modalMessage).should('have.text', groupsText.cantCreatePermissionModalMessage);
        cy.get('.item-list').contains(data.email);
        cy.get(commonSelectors.closeButton).click();

        //move end-user to builder role
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).should('be.visible').check();
        cy.get(groupsSelector.confimButton).click();
        cy.get(groupsSelector.foldersCreateCheck).check();
        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should('be.visible');

        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).uncheck();
        cy.get(groupsSelector.appsDeleteCheck).uncheck();
        cy.get(groupsSelector.foldersCreateCheck).uncheck();
        cy.get(groupsSelector.workspaceVarCheckbox).uncheck();

        //delete permission
        cy.get(groupsSelector.granularLink).click();
        cy.wait(1000);
        cy.get(groupsSelector.granularAccessPermission)
            .trigger('mouseenter')
            .click({ force: true });
        cy.get(groupsSelector.deletePermissionIcon).click();
        cy.get(groupsSelector.yesButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.deletePermissionToast
        );
        cy.get(commonSelectors.homePageLogo).click();
        cy.apiCreateApp(data.appName1);
        cy.apiCreateApp(data.appName2);

        common.navigateToManageGroups();

        cy.get(groupsSelector.groupLink(data.groupName)).click();
        cy.get(groupsSelector.granularLink).click();
        cy.get(groupsSelector.addAppButton).click();
        cy.clearAndType(groupsSelector.permissionNameInput, data.appName1);
        cy.get(groupsSelector.editPermissionRadio).click();
        cy.get(groupsSelector.customradio).check();
        cy.get('.css-1gfides').click({ force: true });
        cy.get('.css-1gfides').type(`${data.appName1}{enter}`);
        cy.get(groupsSelector.confimButton).click({ force: true });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.createPermissionToast
        );

        cy.get(groupsSelector.addAppButton).click();
        cy.clearAndType(groupsSelector.permissionNameInput, data.appName2);
        cy.get(groupsSelector.customradio).check();
        cy.get('.css-1gfides').click({ force: true });
        cy.get('.css-1gfides').type(`${data.appName2}{enter}`);
        cy.get(groupsSelector.confimButton).click({ force: true });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.createPermissionToast
        );
        cy.wait(1000);
        common.logout();

        cy.appUILogin(data.email);
        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should('have.lengthOf', 1);
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should('have.lengthOf', 2);
    });

    it("Invite end-user, update roles and verify all roles UI", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);
        cy.wait(1000);

        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email)
        common.logout();

        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.updateRoleUI("End-user", "Builder", data.email, groupsText.endUserToBuilderMessage);
        groups.updateRole("Builder", "Admin", data.email, groupsText.builderToAdminMessage);
        groups.updateRole("Admin", "Builder", data.email, groupsText.adminToBuilderMessage);
        groups.updateRole("Builder", "End-user", data.email, groupsText.builderToEnduserMessage);
        groups.updateRole("End-user", "Admin", data.email, groupsText.endUserToAdminMessage);
        groups.updateRole("Admin", "End-user", data.email, groupsText.adminToEnduserMessage);
    });
    it("Update role and verify privileges functionality", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        //invite admin check privileges
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(`${data.workspaceSlug}`);

        //Admin to Builder
        common.navigateToManageUsers();

        groups.inviteUserBasedOnRole(data.firstName, data.email, "admin");
        cy.wait(2000);

        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");
        cy.wait(1000);
        common.logout();

        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.updateRole("Admin", "Builder", data.email);
        cy.wait(1000);
        common.logout();

        cy.appUILogin(data.email);
        cy.get(commonSelectors.dashboardAppCreateButton).should("be.enabled");
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("not.exist");
        cy.wait(1000);
        common.logout();

        //Builder to Admin
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.updateRole("Builder", "Admin", data.email);

        cy.wait(1000);
        common.logout();

        cy.appUILogin(data.email);
        cy.get(commonSelectors.dashboardAppCreateButton).should("be.enabled");
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");
        cy.wait(1000);
        common.logout();

        //Admin to end-user
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.updateRole("Admin", "End-user", data.email);
        cy.wait(1000);
        common.logout();

        cy.appUILogin(data.email);
        cy.get(commonSelectors.dashboardAppCreateButton).should("be.disabled");
        cy.wait(1000);
        common.logout();

        //End-user to Admin
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);

        common.navigateToManageGroups();

        groups.updateRole("End-user", "Admin", data.email);
        cy.wait(1000);
        common.logout();

        cy.appUILogin(data.email);
        cy.get(commonSelectors.dashboardAppCreateButton).should("be.enabled");
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");

    });
});
