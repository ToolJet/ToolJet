import { commonSelectors, instanceAllUsersSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { resetUserpasswordFromInstanceSettings, openInstanceSettings, openUserActionMenu, resetUserpasswordAutomaticallyFromInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeText, instanceSettingsText, instanceAllUsersText } from "Texts/eeCommon";
import { commonEeSelectors, instanceSettingsSelector } from "Selectors/eeCommon";
import { assertAllUsersHeader, assertTableControls, assertUserRow, testArchiveUnarchiveFlow, toggleSuperAdminRole } from "Support/utils/platform/superAdmin";

describe("Instance settings - User management by super admin", () => {
    let defaultUser, newWorkspaceUser, resetPasswordUser, uiVerificationUser, promoteUser;
    const DEFAULT_WORKSPACE = "My workspace";

    beforeEach(() => {
        defaultUser = {
            name: fake.firstName,
            email: fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, ""),
            workspace: DEFAULT_WORKSPACE
        };

        newWorkspaceUser = {
            name: fake.firstName,
            email: fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, ""),
            workspace: fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "")
        };

        resetPasswordUser = {
            name: fake.firstName,
            email: fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, ""),
            newPassword: fake.firstName
        };

        uiVerificationUser = {
            name: fake.firstName,
            email: fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "")
        };

        promoteUser = {
            name: fake.firstName,
            email: fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "")
        };
        cy.defaultWorkspaceLogin();
        cy.ifEnv("Enterprise", () => {
            // enableInstanceSignup()
        });
    });

    it("should allow admin to archive and unarchive user in default workspace", () => {
        cy.visitTheWorkspace(defaultUser.workspace);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(defaultUser.name, defaultUser.email, "end-user", "password", defaultUser.workspace, {});
        testArchiveUnarchiveFlow(defaultUser.name, defaultUser.email, defaultUser.workspace);
    });

    it("should allow admin to archive and unarchive user in non-default workspace", () => {
        cy.apiCreateWorkspace(newWorkspaceUser.workspace, newWorkspaceUser.workspace);
        cy.visitTheWorkspace(newWorkspaceUser.workspace);
        cy.apiLogin();
        cy.reload();
        cy.apiFullUserOnboarding(newWorkspaceUser.name, newWorkspaceUser.email, "end-user", "password", newWorkspaceUser.workspace, {});
        testArchiveUnarchiveFlow(newWorkspaceUser.name, newWorkspaceUser.email, newWorkspaceUser.workspace);
    });

    it("should allow admin to reset invited user password and login with new password", () => {
        let generatedPassword;
        cy.apiFullUserOnboarding(resetPasswordUser.name, resetPasswordUser.email);
        cy.apiLogin();
        resetUserpasswordFromInstanceSettings(resetPasswordUser.email, resetPasswordUser.newPassword);
        cy.apiLogout();
        cy.reload();
        cy.appUILogin(resetPasswordUser.email, resetPasswordUser.newPassword);
        cy.apiLogout();

        cy.apiLogin();
        cy.reload();
        resetUserpasswordAutomaticallyFromInstanceSettings(resetPasswordUser.name);
        cy.get('@generatedPassword').then((generatedPassword) => {
            cy.apiLogout();
            cy.reload();
            cy.appUILogin(resetPasswordUser.email, generatedPassword);
        })
    });

    it("should verify all users page UI elements including header, table, action menu, edit modal and workspaces view", () => {
        cy.apiFullUserOnboarding(uiVerificationUser.name, uiVerificationUser.email);
        cy.apiLogin();
        openInstanceSettings();

        // Verify header and table
        assertAllUsersHeader();
        assertTableControls();
        cy.get(commonSelectors.avatarImage).should("be.visible");

        // Verify user row
        cy.clearAndType(commonEeSelectors.userSearchBar, uiVerificationUser.email);
        assertUserRow(uiVerificationUser.name, uiVerificationUser.email, "workspace", "active");

        // Verify action menu
        openUserActionMenu(uiVerificationUser.email);
        cy.get(instanceAllUsersSelectors.editUserDetailsButton).verifyVisibleElement("have.text", instanceAllUsersText.editUserDetails);
        cy.get(instanceAllUsersSelectors.resetPasswordButton).should("be.visible");
        cy.get(instanceAllUsersSelectors.archiveUserButton).verifyVisibleElement("have.text", instanceAllUsersText.archiveUser);

        // Verify edit modal
        cy.get(instanceAllUsersSelectors.editUserDetailsButton).click();
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement("have.text", instanceSettingsText.editModalTitle);
        cy.verifyLabel("Name");
        cy.get(instanceAllUsersSelectors.inputFieldFullName).should("be.visible").should("have.value", uiVerificationUser.name);
        cy.get(instanceAllUsersSelectors.inputFieldEmail).should("be.visible").should("have.value", uiVerificationUser.email);
        cy.verifyLabel("Email address");
        cy.get(instanceSettingsSelector.superAdminToggleLabel).verifyVisibleElement("have.text", instanceSettingsText.superAdminToggleLabel);
        cy.get(instanceSettingsSelector.superAdminToggle).should("be.visible");
        cy.get(commonSelectors.cancelButton).verifyVisibleElement("have.text", commonEeText.cancelButton);
        cy.get(instanceAllUsersSelectors.updateButton).verifyVisibleElement("have.text", instanceAllUsersText.updateButton);
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();

        // Verify workspaces view
        cy.get(instanceSettingsSelector.viewButton(uiVerificationUser.name)).click();
        cy.get(commonEeSelectors.modalTitle).verifyVisibleElement("have.text", instanceAllUsersText.workspacesModalTitle(uiVerificationUser.name));
        cy.get(commonEeSelectors.modalCloseButton).should("be.visible").click();
        cy.get(instanceSettingsSelector.viewTableNameColumnHeader).verifyVisibleElement("have.text", instanceAllUsersText.viewTableNameHeader);
        cy.get(instanceSettingsSelector.viewTableStatusColumnHeader).verifyVisibleElement("have.text", instanceAllUsersText.viewTableStatusHeader);
        cy.get(instanceAllUsersSelectors.userStatusCell(uiVerificationUser.name)).verifyVisibleElement("have.text", "active");
    });

    it("should prevent super admin from archiving the only admin user in workspace and show error toast", () => {
        cy.visitTheWorkspace(DEFAULT_WORKSPACE);
        openInstanceSettings();
        cy.clearAndType(commonEeSelectors.userSearchBar, "dev");
        cy.get(instanceSettingsSelector.viewButton("dev")).click();
        cy.get(`[data-cy="${DEFAULT_WORKSPACE.toLowerCase().replace(/\s+/g, '-')}-workspace-row"]`).within(() => {
            cy.get('[data-cy="user-state-change-button"]').click();
        });
        cy.get(commonSelectors.toastMessage).should("contain.text", instanceAllUsersText.onlyAdminErrorToast);
        cy.get(commonEeSelectors.modalCloseButton).click();
    });

    it("should allow invited user to access instance settings when promoted to super admin and restrict access when depromoted", () => {
        cy.apiFullUserOnboarding(promoteUser.name, promoteUser.email);

        // Promote to super admin
        toggleSuperAdminRole(promoteUser.email);
        cy.appUILogin(promoteUser.email, "password");
        openInstanceSettings();

        // Depromote from super admin
        toggleSuperAdminRole(promoteUser.email);
        cy.appUILogin(promoteUser.email, "password");
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.instanceSettingIcon).should('not.exist');
    });
});