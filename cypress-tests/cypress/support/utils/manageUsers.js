import { path } from "Texts/common";
import { commonSelectors } from "Selectors/common";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "../../constants/texts/common";

export const manageUsersElements = () => {
  for (const element in usersSelector.usersElements) {
    cy.get(usersSelector.usersElements[element]).verifyVisibleElement(
      "have.text",
      usersText.usersElements[element]
    );
  }
  common.searchUser(usersText.adminUserEmail);
  cy.contains("td", usersText.adminUserEmail)
    .parent()
    .within(() => {
      cy.get(usersSelector.adminUserName).verifyVisibleElement(
        "have.text",
        usersText.adminUserName
      );
      cy.get(usersSelector.adminUserEmail).verifyVisibleElement(
        "have.text",
        usersText.adminUserEmail
      );
      cy.get("td small").verifyVisibleElement(
        "have.text",
        usersText.activeStatus
      );
      cy.get("td button").verifyVisibleElement(
        "have.text",
        usersText.adminUserState
      );
    });
  cy.get(commonSelectors.emailFilterInput).should("be.visible");
  cy.get(commonSelectors.firstNameFilterInput).should("be.visible");
  cy.get(commonSelectors.lastNameFilterInput).should("be.visible");
  cy.get(commonSelectors.clearFilterButton).should("be.visible");
  cy.get(commonSelectors.userStatusSelect).should("be.visible");

  cy.get(usersSelector.inviteUserButton)
    .verifyVisibleElement("have.text", usersText.inviteUserButton)
    .click();

  cy.get(usersSelector.cardTitle).verifyVisibleElement(
    "have.text",
    usersText.cardTitle
  );
  cy.get(usersSelector.firstNameInput).should("be.visible");
  cy.get(usersSelector.lastNameInput).should("be.visible");
  cy.get(usersSelector.emailLabel).verifyVisibleElement(
    "have.text",
    usersText.emailLabel
  );
  cy.get(usersSelector.lastNameInput).should("be.visible");
  cy.get(usersSelector.cancelButton).verifyVisibleElement(
    "have.text",
    usersText.cancelButton
  );
  cy.get(usersSelector.createUserButton).verifyVisibleElement(
    "have.text",
    usersText.createUserButton
  );
  cy.get(usersSelector.cancelButton).click();

  cy.get(usersSelector.inviteBulkUserButton).verifyVisibleElement("have.text",usersText.inviteBulkUserButton).click();
  cy.get(usersSelector.bulkUserUploadPageTitle).verifyVisibleElement("have.text",usersText.bulkUserUploadPageTitle);
  cy.get(usersSelector.bulkUSerUploadInput).should("be.visible");
  cy.get(usersSelector.downloadTemplateButton).verifyVisibleElement("have.text",usersText.downloadTemplateButton);
  cy.get(usersSelector.cancelButton).verifyVisibleElement("have.text",usersText.cancelButton);
};

export const inviteUser = (firstName, lastName, email) => {
  cy.get(usersSelector.inviteUserButton).click();
  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.clearAndType(usersSelector.emailInput, email);

  cy.get(usersSelector.createUserButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );
  cy.window().then((win) => {
    cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
  });
  common.searchUser(email);
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get("td img").click();
    });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.inviteCopiedToast
  );
  cy.get("@copyToClipboardPrompt").then((prompt) => {
    common.logout();
    cy.visit(prompt.args[0][1]);
    cy.url().should("include", path.confirmInvite);
  });
};

export const addNewUser = (firstName, lastName, email) => {
  cy.intercept("POST", "/api/organization_users").as("appLibrary");
  cy.clearAndType(usersSelector.firstNameInput, firstName);
  cy.clearAndType(usersSelector.lastNameInput, lastName);
  cy.clearAndType(usersSelector.emailInput, email);

  cy.get(usersSelector.createUserButton).click();
  cy.wait("@appLibrary").then((res) => {
    const invitation1 = res.response.body.users.user.invitation_token;
    const invitation2 = res.response.body.users.invitation_token;
    const url = `http://localhost:8082/invitations/${invitation1}/workspaces/${invitation2}`;
    common.logout();
    cy.visit(url);
  });
};

export const confirmInviteElements = () => {
  cy.url().should("include", '/confirm');
  cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
    "have.text",
    commonText.invitePageHeader
  );
  cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
    "have.text",
    commonText.invitePageSubHeader
  );
  cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
    "have.text",
    commonText.userNameInputLabel
  );
  cy.get(commonSelectors.invitedUserName).should("be.visible");
  cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
    "have.text",
    commonText.emailInputLabel
  );
  cy.get(commonSelectors.invitedUserEmail).should("be.visible");
  cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
    "have.text",
    commonText.passwordLabel
  );
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.get(commonSelectors.acceptInviteButton).verifyVisibleElement(
    "have.text",
    commonText.acceptInviteButton
  ).should('be.disabled');

  cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.signUpTermsHelperText
    );
  });
  cy.get(commonSelectors.termsOfServiceLink)
    .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/terms");
  cy.get(commonSelectors.privacyPolicyLink)
    .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/privacy");

    cy.get("body").then(($el) => {
      if ($el.text().includes("Google")) {
        cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
          "have.text",
          ssoText.googleSignUpText
        );
        cy.get(ssoSelector.gitSSOText).verifyVisibleElement(

          "have.text",
          ssoText.gitSignUpText
        );
        cy.get(commonSelectors.onboardingSeperator).should('be.visible')
      }
    });
  
};

export const userStatus = (email) => {
  common.navigateToManageUsers();
  common.searchUser(email);
  cy.contains("td", email)
    .parent()
    .within(() => {
      cy.get("td button").click();
    });
};
