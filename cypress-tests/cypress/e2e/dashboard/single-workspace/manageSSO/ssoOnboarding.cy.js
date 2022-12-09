import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { usersSelector } from "Selectors/manageUsers";
import { usersText } from "Texts/manageUsers";
import * as archiveUser from "Support/utils/manageUsers";
import * as unarchiveUser from "Support/utils/manageUsers";

describe("SSO onboarding", () => {
  before(() => {
    cy.appUILogin();
    SSO.enableSignUp();
    SSO.enableGoogleSSO();
    SSO.enableGitHubSSO();
    common.logout();
  });
  it("Should verify Google SSO user onboarding", () => {
    cy.visit("/");
    SSO.googleSSO("tj.test.cypress@gmail.com", "P@assword123#@");
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.swPasswordSuccessToast
    );
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    common.logout();
  });
  it("Should verify the enable signup functionality and GitHub SSO user onboaring", () => {
    cy.appUILogin();
    SSO.disableSignUp();
    common.logout();

    SSO.gitHubSSO("ajithkvrv@gmail.com", "P@assword123@#");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoText.gitUserStatusToast
    );

    cy.appUILogin();
    SSO.enableSignUp();
    common.logout();

    SSO.gitHubSSO("ajithkvrv@gmail.com", "P@assword123@#");
    SSO.invitePageElements();
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.swPasswordSuccessToast
    );
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    common.logout();
  });
  it("Should verify archived user login using SSO", () => {
    cy.appUILogin();
    archiveUser.userStatus("ajithkvrv@gmail.com");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.archivedToast
    );
    common.logout();

    SSO.gitHubSSO("ajithkvrv@gmail.com", "P@assword123@#");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoText.gitUserStatusToast
    );

    cy.appUILogin();
    unarchiveUser.userStatus("ajithkvrv@gmail.com");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      usersText.unarchivedToast
    );
    common.logout();

    SSO.loginbyGitHub("ajithkvrv@gmail.com", "P@assword123@#");
    cy.visit("/");
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    common.logout();
  });

  it("Should verify GitHub and Google SSO login", () => {
    cy.visit("/");
    SSO.loginbyGitHub("ajithkvrv@gmail.com", "P@assword123@#");
    cy.visit("/");
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    common.logout();

    cy.reload();
    SSO.googleSSO("tj.test.cypress@gmail.com", "P@assword123#@");
    cy.get(usersSelector.dropdownText).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
    common.logout();
  });
});