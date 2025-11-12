 
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";
import { onboardingSelectors } from "Selectors/onboarding";
import { commonSelectors } from "Selectors/common";

export const archiveUserFromInstancesettings = (userName) => {
    openInstanceSettings();
    cy.clearAndType(commonEeSelectors.userSearchBar, userName);
    cy.get(commonEeSelectors.userActionButton).click();
    cy.get(commonEeSelectors.archiveButton).click();
    cy.get(commonEeSelectors.confirmButton).click();
};

export const unarchiveUserFromInstancesettings = (userName) => {
    openInstanceSettings();
    cy.clearAndType(commonEeSelectors.userSearchBar, userName);
    cy.get(commonEeSelectors.userActionButton).click();
    cy.get(commonEeSelectors.archiveButton).click();
    cy.get(commonEeSelectors.confirmButton).click();
    cy.get(`[data-cy="${userName.toLowerCase()}-user-view-button"]`).click();
    cy.wait(500);
    cy.get('[data-cy="user-state-change-button"]').click();
    cy.wait(500);
    cy.get(commonEeSelectors.modalCloseButton).click();
};

export const resetUserpasswordFromInstanceSettings = (userName, password) => {
    openInstanceSettings();
    cy.clearAndType(commonEeSelectors.userSearchBar, userName);
    cy.get(commonEeSelectors.userActionButton).click();
    cy.get(commonEeSelectors.passwordResetButton).click();
    cy.get(commonEeSelectors.createNewPasswordButton).click();
    cy.get(commonEeSelectors.passwordInputField).click().type(password);
    cy.get(commonEeSelectors.resetButton).click();
};

export const resetUserpasswordAutomaticallyFromInstanceSettings = (userName) => {
    openInstanceSettings();
    cy.clearAndType(commonEeSelectors.userSearchBar, userName);
    cy.get(commonEeSelectors.userActionButton).click();
    cy.get(commonEeSelectors.passwordResetButton).click();
    cy.get(commonEeSelectors.resetButton).click();
    cy.get('[data-cy="password-input"]', { timeout: 10000 })
        .invoke('val')
        .should('not.be.empty')
        .then((generatedPassword) => {
            cy.get('[data-cy="done-button"]').click();
            cy.wrap(generatedPassword).as('generatedPassword');
        });
};

export const verifyLoginWithOldPaswordRestriction = (email,password) => {
 cy.clearAndType(onboardingSelectors.loginEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
    cy.get(onboardingSelectors.signInButton).click();
    cy.wait(2000);
    cy.get(commonSelectors.toastMessage).should("contain.text", "Invalid credentials");
}
