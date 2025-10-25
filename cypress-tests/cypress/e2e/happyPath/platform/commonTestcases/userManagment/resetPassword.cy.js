import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { logout } from "Support/utils/common";
import { inviteUser } from "Support/utils/onboarding";
import { commonText } from "Texts/common";

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

    cy.clearAndType('[data-cy="email-input-field-input"]', data.email);
    cy.get(commonSelectors.resetPasswordLinkButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.passwordResetEmailToast
    );

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

    // Use the correct API for cypress-mh if you have customized endpoints
    cy.wait(5000);
    cy.mhGetMailsByRecipient(data.email).mhFilterBySubject('Reset your password')
      .then((mails) => {
        expect(mails).to.have.length.greaterThan(0);
        const lastMail = mails[mails.length - 1];
        const mailContent = lastMail && lastMail.Content ? lastMail.Content : {};
        const mailBody = mailContent.Body || mailContent.Html || '';

        // Clean the email body by removing quoted-printable encoding and HTML entities
        let cleanedBody = mailBody
          .replace(/=\r?\n/g, '') // Remove quoted-printable line breaks (= at end of line)
          .replace(/=3D/g, '=')   // Decode =3D back to =
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        let resetPasswordUrl = '';

        const hrefMatch = cleanedBody.match(/href=3D(http[^"\s>]*reset-password[^"\s>]*)/i);
        if (hrefMatch) {
          resetPasswordUrl = hrefMatch[1];
        } else {
          const standardHrefMatch = cleanedBody.match(/href=["']?(http[^"'\s>]*reset-password[^"'\s>]*)/i);
          if (standardHrefMatch) {
            resetPasswordUrl = standardHrefMatch[1];
          } else {
            const urlMatch = cleanedBody.match(/https?:\/\/[^\s"'<>]*reset-password[^\s"'<>]*/i);
            resetPasswordUrl = urlMatch ? urlMatch[0] : '';
          }
        }

        expect(resetPasswordUrl).to.not.be.empty;
        cy.log('Found reset password URL: ' + resetPasswordUrl);
        cy.visit(resetPasswordUrl);
      });


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

    cy.wait(2000); // Wait for fields to be interactable  will remove after fixing the flakiness

    [
      { new: "Pass", confirm: "Pass", shouldBeEnabled: false },
      { new: "Pass", confirm: "Pass", shouldBeEnabled: false },
      { new: "password1", confirm: "password", shouldBeEnabled: false },
      { new: "Password", confirm: "password", shouldShowError: true },
      { new: "Password", confirm: "Password", shouldBeEnabled: true },
    ].forEach(({ new: newPass, confirm, shouldBeEnabled, shouldShowError }) => {
      cy.get(commonSelectors.newPasswordInputField).should('be.enabled', { timeout: 10000 }).click().type(`{selectAll}{backspace}${newPass}`);
      cy.get(commonSelectors.confirmPasswordInputField).should('be.enabled', { timeout: 10000 }).click().type(`{selectAll}{backspace}${confirm}`);

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

    cy.get(commonSelectors.resetPasswordButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.passwordResetSuccessToast
    );

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

    cy.get(commonSelectors.backToLoginButton).click();
    cy.get(onboardingSelectors.signupEmailInput).click().type(`{selectAll}{backspace}${data.email}`);
    cy.get(onboardingSelectors.loginPasswordInput).click().type(`{selectAll}{backspace}${data.password}`);
    cy.get(onboardingSelectors.signInButton).click();
    cy.get(commonSelectors.workspaceName).should("be.visible");
  });
});
