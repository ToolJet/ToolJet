import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { usersSelector } from "Selectors/platform/manageUsers";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { verifyConfirmEmailPage } from "Support/utils/onboarding";
import { commonText } from "Texts/common";
import { usersText } from "Texts/platform/manageUsers";
import { onboardingText } from "Texts/platform/onboarding";

describe("Cloud Onboarding — Workspace Signup and Invites", { retries: 0 }, () => {
  const uniqueEmail = (prefix) =>
    `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}@tooljet.test`;

  let workspaceId;
  let workspaceSlug;

  const signUpWorkspaceAdmin = () => {
    cy.apiCloudSignup({ email: uniqueEmail("cloud-ws-admin"), name: fake.firstName }).then(
      (signup) => {
        workspaceId = signup.workspaceId;
        workspaceSlug = signup.workspaceSlug;
      }
    );
  };

  it("should show the check-your-mail screen after workspace signup without logging the user in", () => {
    const signupEmail = uniqueEmail("cloud-ws-signup");

    signUpWorkspaceAdmin();
    cy.apiUpdateAllowSignUp(true, "organization");
    cy.clearCookies();

    cy.intercept("POST", "/api/onboarding/signup").as("workspaceSignup");
    cy.then(() => cy.visit(`/signup/${workspaceId}`));
    cy.get(onboardingSelectors.nameInput).should("not.be.disabled").type(fake.fullName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, signupEmail);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, commonText.password);
    cy.get(commonSelectors.signUpButton).click();

    cy.wait("@workspaceSignup").its("response.statusCode").should("be.oneOf", [200, 201]);
    verifyConfirmEmailPage(signupEmail);
    cy.get(onboardingSelectors.backToSignupButton).verifyVisibleElement(
      "have.text",
      onboardingText.backToSignupText
    );

    cy.getCookie("tj_auth_token").should("be.null");
    cy.visit("/");
    cy.url().should("include", "/login");
  });

  it("should offer Reinvite and no Copy link for an invited user", () => {
    const inviteeName = `invitee${Date.now()}`;

    signUpWorkspaceAdmin();
    cy.apiUserInvite(inviteeName, uniqueEmail("cloud-invitee"));
    cy.then(() => cy.visit(`${workspaceSlug}/workspace-settings/users`));

    cy.get(usersSelector.userStatus(inviteeName)).should(
      "have.text",
      usersText.invitedStatus
    );
    cy.get(usersSelector.userReinviteButton(inviteeName)).verifyVisibleElement(
      "have.text",
      usersText.reinviteButton
    );
    cy.get(usersSelector.userCopyInvitationLink(inviteeName)).should("not.exist");
  });

  it("should ask the user to contact the workspace admin on the forgot password page", () => {
    cy.clearCookies();
    cy.visit("/forgot-password");

    cy.get(onboardingSelectors.resetPasswordInfoBanner).verifyVisibleElement(
      "have.text",
      onboardingText.resetPasswordInfoCloud
    );
    cy.get(onboardingSelectors.resetPasswordInfoBanner).should(
      "not.contain.text",
      "super admin"
    );
  });

  it("should show the same check-your-mail screen for a known and an unknown email", () => {
    const knownEmail = uniqueEmail("cloud-forgot-known");
    cy.apiCloudSignup({ email: knownEmail, name: fake.firstName });
    cy.clearCookies();

    [knownEmail, uniqueEmail("cloud-forgot-unknown")].forEach((email) => {
      cy.visit("/forgot-password");
      cy.clearAndType(onboardingSelectors.forgotEmailInput, email);
      cy.get(commonSelectors.resetPasswordLinkButton).click();
      cy.get(onboardingSelectors.checkYourMailHeader).verifyVisibleElement(
        "have.text",
        commonText.emailPageHeader
      );
      cy.contains(commonText.resetPasswordEmailDescription(email)).should("be.visible");
    });
  });

  it("should reject an invalid password reset link", () => {
    cy.clearCookies();
    cy.visit("/reset-password/invalid-token");
    cy.contains(commonText.inalidInvitationLinkHeader).should("be.visible");
  });
});
