import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as workspaceConstants from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { fetchAndVisitInviteLink, roleBasedOnboarding } from "Support/utils/onboarding";
import { usersSelector } from "Selectors/manageUsers";
import { fillUserInviteForm } from "Support/utils/manageUsers";
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
        roleBasedOnboarding(data.firstName, data.email, "end-user");
        cy.get(commonSelectors.dashboardAppCreateButton).should("be.disabled");
    });

    it("Invite builder and verify privileges", () => {
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

        roleBasedOnboarding(data.firstName, data.email, "builder");
        cy.wait(2000);
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
        roleBasedOnboarding(data.firstName, data.email, "admin");
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
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.wait(2000);
        fetchAndVisitInviteLink(data.email);
        cy.wait(2000);
        cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(commonSelectors.continueButton).click();
        cy.wait(2000);
        cy.get(commonSelectors.acceptInviteButton).click();
        common.logout();
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);
        common.navigateToManageGroups();
        cy.get(groupsSelector.createNewGroupButton).click();
        cy.clearAndType(groupsSelector.groupNameInput, data.groupName);
        cy.get(groupsSelector.createGroupButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.groupCreatedToast
        );
        cy.get(groupsSelector.groupLink(data.groupName)).click();
        cy.clearAndType(groupsSelector.multiSelectSearchInput, data.email);
        cy.wait(2000);
        cy.get('.select-search__row .item-renderer [type="checkbox"]').eq(0).check();
        cy.get(groupsSelector.addUserButton).should('be.enabled').click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.userAddedToast
        );
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).should('be.visible').check();
        changeInRolePopup(data.email);
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
        cy.reload();
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
        common.logout();
        cy.appUILogin(data.email);
        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should('have.lengthOf', 1);
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should('have.lengthOf', 2);
    });
    const changeInRolePopup = (email) => {
        cy.get('.modal-content').should('be.visible');
        cy.get(commonSelectors.defaultModalTitle).contains(groupsText.changeUserRoleHeader);
        cy.get(groupsSelector.changeRoleModalMessage).contains(groupsText.changeUserRoleMessage);
        cy.get('.item-list').contains(email);
        cy.get(groupsSelector.confimButton).should('have.text', groupsText.continueButtonText);
        cy.get(commonSelectors.cancelButton).should('have.text', commonText.cancelButton).click();
    };

    it("Invite end-user and update role", () => {
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
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.wait(2000);
        fetchAndVisitInviteLink(data.email);
        cy.wait(2000);
        cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(commonSelectors.continueButton).click();
        cy.wait(2000);
        cy.get(commonSelectors.acceptInviteButton).click();
        common.logout();
        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);
        // cy.userInviteApi(data.firstName, data.email);
        updateRole("End-user", "Builder", groupsText.endUserToBuilderMessage, data.email);
        updateRole("Builder", "Admin", groupsText.builderToAdminMessage, data.email);
        updateRole("Admin", "Builder", groupsText.adminToBuilderMessage, data.email);
        updateRole("Builder", "End-user", groupsText.builderToEnduserMessage, data.email);
        updateRole("End-user", "Admin", groupsText.endUserToAdminMessage, data.email);
        updateRole("Admin", "End-user", groupsText.adminToEnduserMessage, data.email);
    });
});
export const updateRole = (user, role, message, email) => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink(user)).click();
    cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).click();
    cy.get('[data-cy="modal-title"] > .tj-text-md').should(
        "have.text",
        "Edit user role"
    );
    cy.get('[data-cy="user-email"]').should("have.text", email);
    cy.get(groupsSelector.userRoleLabel).should("have.text", groupsText.userRole);
    cy.get(groupsSelector.warningText).should(
        "have.text",
        groupsText.warningText
    );
    cy.get(groupsSelector.cancelButton)
        .should("have.text", groupsText.cancelButton)
        .and("be.enabled");
    cy.get(groupsSelector.confimButton).should("be.disabled");
    cy.get(
        ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
    )
        .click()
        .type(`${role}{enter}`);
    cy.get(groupsSelector.confimButton)
        .should("be.enabled")
        .and("have.text", groupsText.continueButtonText)
        .click();
    cy.get('[data-cy="modal-body"]').should("have.text", message);
    cy.get(groupsSelector.cancelButton).click();
    cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).click();
    cy.get(
        ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
    )
        .click()
        .type(`${role}{enter}`);
    cy.get(groupsSelector.confimButton)
        .should("be.enabled")
        .and("have.text", groupsText.continueButtonText)
        .click();
    cy.get(groupsSelector.confimButton).click();
    if (user != "Admin") {
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.roleUpdateToastMessage
        );
    }
    cy.get(groupsSelector.groupLink(role)).click();
    cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).should("be.visible");
};
