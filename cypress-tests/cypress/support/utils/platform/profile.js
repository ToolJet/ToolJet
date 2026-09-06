// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// profile.js
//   profilePageElements              profile.verifyPage   → workspace
//   extApiUpdateUser                 profile.updateExtApi → workspace
//   removeAvatar                     profile.removeAvatar → workspace
// └──────────────────────────────────────────────────────────────────┘
import { profileSelector } from "Selectors/platform/profile";
import { profileText } from "Texts/platform/profile";

/**
 * @tjType   profile.verifyPage
 * @tjBlock  workspace
 * @tjUsage  profilePageElements()
 * @tjDom    profile page fields + buttons
 */
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


/**
 * @tjType   profile.updateExtApi
 * @tjBlock  workspace
 * @tjUsage  extApiUpdateUser(userEmail, userId)
 * @tjDom    none - PATCH via the external API. [UNREFERENCED 2026-09-06]
 */
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

/**
 * @tjType   profile.removeAvatar
 * @tjBlock  workspace
 * @tjUsage  removeAvatar(userEmail)
 * @tjDom    profile -> avatar -> remove
 */
export const removeAvatar = (userEmail = "dev@tooljet.io") => {
  cy.getUserIdByEmail(userEmail, "user").then((userId) => {
    return cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `UPDATE users SET avatar_id = NULL WHERE id = '${userId}';`,
    });
  });
};
