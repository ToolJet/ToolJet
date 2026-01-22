import { profileSelector } from "Selectors/profile";
import { profileText } from "Texts/profile";

export const profilePageElements = () => {
  for (const elements in profileSelector.profileElements) {
    cy.get(profileSelector.profileElements[elements]).verifyVisibleElement(
      "have.text",
      profileText.profileElements[elements]
    );
  }
  cy.get(profileSelector.updateButton).verifyVisibleElement(
    "have.text",
    profileText.updateButton
  );
  cy.get(profileSelector.changePasswordButton).verifyVisibleElement(
    "have.text",
    profileText.changePasswordButton
  );
  cy.get(profileSelector.userNameInput).verifyVisibleElement(
    "have.value",
    profileText.userName
  );

  cy.get(profileSelector.emailInput).verifyVisibleElement(
    "have.value",
    profileText.email
  );
  cy.get(profileSelector.currentPasswordField)
    .should("be.visible")
    .should("be.visible");
  cy.get(profileSelector.newPasswordField)
    .should("be.visible")
    .should("be.visible");
};


export const extApiUpdateUser = (userEmail = '', userIdCached = Cypress.env('userIdDev')) => {
  cy.request({
    method: 'PATCH',
    url: `${Cypress.env("server_host")}/api/ext/user/:${userIdCached}`,
    headers: {
      'Authorization': `Basic ${Cypress.env('AUTH_TOKEN')}`,
      'Content-Type': 'application/json'
    },
    body: {
      name: 'The Developer',
      email: 'dev@tooljet.io',
      password: 'password',
      status: 'active'
    }
  });
}