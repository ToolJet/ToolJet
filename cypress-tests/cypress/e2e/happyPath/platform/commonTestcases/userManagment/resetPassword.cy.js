import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { inviteUser } from "Support/utils/onboarding";
import { logout } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";

describe("Password reset functionality", () => {
  const data = {
    firstName: fake.firstName,
    email: fake.email.toLowerCase(),
    password: "Password",
  };
  let passwordResetLink = "";

  beforeEach(() => {
    cy.visit("/");
  });

  it("Verify password reset flow and login with new password", () => {
    cy.apiLogin();
    inviteUser(data.firstName, data.email);
    logout();

    // Invalid login attempts
    Cypress._.times(5, () => {
      cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "passw");
      cy.get(onboardingSelectors.signInButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Invalid credentials"
      );
    });

    cy.get(onboardingSelectors.signInButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Maximum password retry limit reached, please reset your password using forgot password option"
    );

    // Forgot password page verification
    cy.get(commonSelectors.forgotPasswordLink).click();

    [
      [
        commonSelectors.forgotPasswordPageHeader,
        commonText.forgotPasswordPageHeader,
      ],
      [
        commonSelectors.forgotPasswordPageSubHeader,
        "New to ToolJet? Create an account",
      ],
      [commonSelectors.createAnAccountLink, commonText.createAnAccountLink],
      ['[data-cy="email-input-field-label"]', "Email address *"],
    ].forEach(([selector, text]) => {
      cy.get(selector).verifyVisibleElement("have.text", text);
    });

    // Submit email for password reset
    cy.clearAndType('[data-cy="email-input-field-input"]', data.email);
    cy.get(commonSelectors.resetPasswordLinkButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.passwordResetEmailToast
    );

    // Check email confirmation page
    [
      [
        commonSelectors.onboardingPageDescription,
        commonText.resetPasswordEmailDescription(data.email),
      ],
      [commonSelectors.spamMessage, commonText.spamMessage],
      [
        commonSelectors.onboardingSeperatorText,
        commonText.onboardingSeperatorText,
      ],
      [commonSelectors.backToLoginButton, commonText.backToLoginButton],
    ].forEach(([selector, text]) => {
      cy.get(selector).verifyVisibleElement("have.text", text);
    });

    // Get and visit reset password link
    cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `select forgot_password_token from users where email='${data.email}';`,
    }).then((resp) => {
      passwordResetLink = `/reset-password/${resp.rows[0].forgot_password_token}`;
      cy.visit(passwordResetLink);
    });

    // Reset password page verification
    [
      [
        commonSelectors.passwordResetPageHeader,
        commonText.passwordResetPageHeader,
      ],
      [commonSelectors.newPasswordInputLabel, commonText.newPasswordInputLabel],
      [
        commonSelectors.confirmPasswordInputFieldLabel,
        commonText.confirmPasswordInputFieldLabel,
      ],
      [commonSelectors.resetPasswordButton, commonText.resetPasswordButton],
    ].forEach(([selector, text]) => {
      cy.get(selector).verifyVisibleElement("have.text", text);
    });

    // Password validation cases
    [
      { new: "Pass", confirm: "Pass", shouldBeEnabled: false },
      { new: "Pass", confirm: "Pass", shouldBeEnabled: false },
      { new: "password1", confirm: "password", shouldBeEnabled: false },
      { new: "Password", confirm: "password", shouldShowError: true },
      { new: "Password", confirm: "Password", shouldBeEnabled: true },
    ].forEach(({ new: newPass, confirm, shouldBeEnabled, shouldShowError }) => {
      cy.clearAndType(commonSelectors.newPasswordInputField, newPass);
      cy.clearAndType(commonSelectors.confirmPasswordInputField, confirm);

      if (shouldShowError) {
        cy.get('[data-cy="confirm-password-input-error"]').verifyVisibleElement(
          "have.text",
          "Passwords don't match"
        );
      }

      cy.get(commonSelectors.resetPasswordButton).should(
        shouldBeEnabled ? "be.enabled" : "be.disabled"
      );
    });

    // Submit new password
    cy.get(commonSelectors.resetPasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.passwordResetSuccessToast
    );

    // Success page verification
    cy.get(commonSelectors.pageLogo).should("be.visible");

    [
      [
        '[data-cy="password-has-been-reset-header"]',
        commonText.passwordResetSuccessPageHeader,
      ],
      [
        commonSelectors.resetPasswordPageDescription,
        commonText.resetPasswordPageDescription,
      ],
      [commonSelectors.backToLoginButton, commonText.backToLoginButton],
    ].forEach(([selector, assertion]) => {
      cy.get(selector).verifyVisibleElement("have.text", assertion);
    });

    // Login with new password
    cy.get(commonSelectors.backToLoginButton).click();
    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, data.password);
    cy.get(onboardingSelectors.signInButton).click();
    cy.get(commonSelectors.workspaceName).should("be.visible");
  });
});
