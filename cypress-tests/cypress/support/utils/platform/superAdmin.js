import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { visitWorkspaceInvitation } from "Support/utils/onboarding";
import { onboardingSelectors } from "Selectors/onboarding";
import { archiveUserFromInstancesettings, unarchiveUserFromInstancesettings, openInstanceSettings, openUserActionMenu } from "Support/utils/platform/eeCommon";
import { commonEeText, instanceSettingsText } from "Texts/eeCommon";
import { commonEeSelectors, instanceSettingsSelector } from "Selectors/eeCommon";

export const assertAllUsersHeader = () => {
    cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", instanceSettingsText.pageTitle);
    cy.get(instanceSettingsSelector.allUsersTab).verifyVisibleElement("have.text", instanceSettingsText.allUsersTabInInstance);
    cy.get(instanceSettingsSelector.manageInstanceSettings).verifyVisibleElement("have.text", instanceSettingsText.manageInstanceSettings);
    cy.get('[data-cy="breadcrumb-header-settings"]').verifyVisibleElement("have.text", "SettingsAll Users");
    cy.get('[data-cy="title-users-page"]').should(($el) => {
        expect($el.contents().last().text().trim()).to.eq("Manage all users");
    });
};

export const assertTableControls = () => {
    for (const element in usersSelector.usersTableElementsInInstance) {
        cy.get(usersSelector.usersTableElementsInInstance[element]).verifyVisibleElement("have.text", usersText.usersTableElementsInInstance[element]);
    }
    cy.get(usersSelector.userFilterInput).should("be.visible");
    cy.get(instanceSettingsSelector.typeColumnHeader).verifyVisibleElement("have.text", instanceSettingsText.typeColumnHeader);
    cy.get(instanceSettingsSelector.workspaceColumnHeader).verifyVisibleElement("have.text", instanceSettingsText.workspaceColumnHeader);
};

export const assertUserRow = (userName, userEmail, userType = "workspace", userStatus = "active") => {
    cy.get(instanceSettingsSelector.userName(userName)).verifyVisibleElement("have.text", userName);
    cy.get(instanceSettingsSelector.userEmail(userName)).verifyVisibleElement("have.text", userEmail);
    cy.get(instanceSettingsSelector.userType(userName)).verifyVisibleElement("have.text", userType);
    cy.get(instanceSettingsSelector.userStatus(userName)).verifyVisibleElement("have.text", userStatus);
};

export const testArchiveUnarchiveFlow = (userName, userEmail, workspaceName) => {
    // Archive user
    cy.apiLogin();
    archiveUserFromInstancesettings(userName);
    cy.apiLogout();
    cy.visit('/');

    // Verify archived user cannot login
    cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();
    cy.get(commonSelectors.toastMessage).should("contain.text", commonEeText.userArchivedToast);

    // Unarchive user
    cy.appUILogin();
    unarchiveUserFromInstancesettings(userName);
    cy.wait(3000);

    // Accept invitation after unarchive
    visitWorkspaceInvitation(userEmail, workspaceName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, userEmail);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();
    cy.get(usersSelector.acceptInvite).click();
};

export const toggleSuperAdminRole = (userEmail) => {
    cy.apiLogin();
    cy.visit('/');
    openInstanceSettings();
    cy.clearAndType(commonEeSelectors.userSearchBar, userEmail);
    openUserActionMenu(userEmail);
    cy.get('[data-cy="edit-user-details-button"]').click();
    cy.get(instanceSettingsSelector.superAdminToggle).click();
    cy.get('[data-cy="update-button"]').click();
    cy.wait(1000);
    cy.apiLogout();
   cy.visit('/');
};