import {
    commonEeSelectors,
    instanceSettingsSelector,
} from "Constants/selectors/eeCommon";
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
    openEditUserModal,
    verifyArchiveUserModalUI,
    verifyUnarchiveUserModal,
} from "Support/utils/platform/allUsers";
import { usersText } from "Texts/manageUsers";

const data = {
    userName: fake.firstName.toLowerCase().replace(/[^a-z]/g, ""),
    userEmail: fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, ""),
};

const loginAsUser = (email, password = usersText.password) => {
    cy.visit("/my-workspace");
    cy.clearAndType(onboardingSelectors.signupEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
    cy.get(onboardingSelectors.signInButton).click();
};

const loginAndExpectToast = (email, message, password = usersText.password) => {
    loginAsUser(email, password);
    cy.verifyToastMessage(commonSelectors.toastMessage, message);
};

const visitAllUsersPage = (loginEmail) => {
    if (loginEmail) {
        cy.apiLogin(loginEmail);
    } else {
        cy.apiLogin();
    }
    cy.visit("settings/all-users");
};

describe("Instance Settings - All Users UI", () => {
    beforeEach(() => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiFullUserOnboarding(data.userName, data.userEmail, "admin");
        cy.apiLogout();
        visitAllUsersPage();
    });

    it("verifies archive from instance and workspace functionality", () => {

        //Instance level archive and login verification
        verifyArchiveUserModalUI(data.userName, data.userEmail);
        cy.apiLogout();

        loginAndExpectToast(
            data.userEmail,
            "You have been archived from this instance. Contact super admin to know more."
        );

        //Workspace level unarchive and login verification
        visitAllUsersPage();
        verifyUnarchiveUserModal(data.userName, data.userEmail);
        cy.apiLogout();

        loginAndExpectToast(
            data.userEmail,
            "You have been archived from this workspace. Sign in to another workspace or contact admin to know more."
        );

        //Workspace level unarchive and login verification
        visitAllUsersPage();
        cy.clearAndType(commonSelectors.inputUserSearch, data.userEmail);
        cy.get(instanceSettingsSelector.viewButton(data.userName)).click();
        cy.get(instanceSettingsSelector.userStatusChangeButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "The user has been unarchived"
        );
        cy.apiLogout();

        loginAndExpectToast(data.userEmail, "Invalid credentials");
    });

    it("verifies superadmin promotion and password login", () => {
        //Promote to superadmin and verify login
        openEditUserModal(data.userEmail);
        cy.get(instanceSettingsSelector.superAdminToggle).check();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Changes updated successfully!"
        );
        cy.apiLogout();

        visitAllUsersPage(data.userEmail);
        cy.get('[data-cy="title-users-page"]').should(
            "have.text",
            "Manage all users"
        );
        cy.get(instanceSettingsSelector.userType(data.userName)).should(
            "have.text",
            "instance"
        );
        cy.apiLogout();

        //Demote to workspace admin and verify login
        visitAllUsersPage();
        openEditUserModal(data.userEmail);
        cy.get(instanceSettingsSelector.superAdminToggle).uncheck();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Changes updated successfully!"
        );
        cy.apiLogout();

        cy.apiLogin(data.userEmail);
        cy.visit("/my-workspace");
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonEeSelectors.instanceSettingsIcon).should("not.exist");
    });
});