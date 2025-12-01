  
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";
import { onboardingSelectors } from "Selectors/onboarding";
import { commonSelectors } from "Selectors/common";
import { openUserActionMenu } from "Support/utils/platform/eeCommon";

export const archiveUserFromInstanceSettings = (email) => {
  openInstanceSettings();
  openUserActionMenu(email)
  cy.get(commonEeSelectors.archiveButton).click();
  return cy.get(commonEeSelectors.confirmButton).click();
};

export const unarchiveUserFromInstanceSettings = (email) => {
  openInstanceSettings();
  openUserActionMenu(email)
  cy.get(commonEeSelectors.archiveButton).click();
  cy.get(commonEeSelectors.confirmButton).click();
  cy.get(`[data-cy="${email.toLowerCase()}-user-view-button"]`).should('be.visible').click();
  cy.get('[data-cy="user-state-change-button"]').should('be.visible').click();
  return cy.get(commonEeSelectors.modalCloseButton).should('be.visible').click();
};

export const resetUserPasswordFromInstanceSettings = (email, password) => {
  openInstanceSettings();
  openUserActionMenu(email)
  cy.get(commonEeSelectors.passwordResetButton).click();
  cy.get(commonEeSelectors.createNewPasswordButton).click();
  cy.get(commonEeSelectors.passwordInputField).click().type(password);
  return cy.get(commonEeSelectors.resetButton).click();
};

export const resetUserPasswordAutomaticallyFromInstanceSettings = (email) => {
  openInstanceSettings();
  openUserActionMenu(email)
  cy.get(commonEeSelectors.passwordResetButton).click();
  cy.get(commonEeSelectors.resetButton).click();
  return cy
    .get('[data-cy="password-input"]', { timeout: 10000 })
    .invoke('val')
    .should('not.be.empty')
    .then((generatedPassword) => {
      cy.get('[data-cy="done-button"]').click();
      cy.wrap(generatedPassword).as('generatedPassword');
    });
};

export const verifyLoginWithOldPasswordRestriction = (email, password) => {
  cy.clearAndType(onboardingSelectors.loginEmailInput, email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
  cy.get(onboardingSelectors.signInButton).click();
  cy.get(commonSelectors.toastMessage).should("contain.text", "Invalid credentials" , { timeout: 1000 });
};
