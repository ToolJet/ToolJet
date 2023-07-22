import { commonSelectors } from "../../constants/selectors/common";
import { commonText } from "../../constants/texts/common";
import { fake } from "Fixtures/fake";
import { addNewUserMW } from "Support/utils/userPermissions";
import { logout } from "Support/utils/common";

describe("Password reset functionality", () => {
  const data = {};
  data.firstName = fake.firstName;
  data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
  data.email = fake.email.toLowerCase();
  let passwordResetLink = "";

  before(() => {
    cy.appUILogin();
    addNewUserMW(data.firstName, data.email);
    logout();
  });

  it("Verify wrong password limit", () => {
    for (let i = 0; i < 5; i++) {
      cy.clearAndType(commonSelectors.workEmailInputField, data.email);
      cy.clearAndType(commonSelectors.passwordInputField, "passw");
      cy.get(commonSelectors.loginButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Invalid credentials"
      );
    }
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, "passw");
    cy.get(commonSelectors.loginButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Maximum password retry limit reached, please reset your password using forgot password option"
    );
  });
  it("Verify forgot password page elements and functionality", () => {
    cy.visit("/");
    cy.get(commonSelectors.forgotPasswordLink).click();
    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.forgotPasswordPageHeader).verifyVisibleElement(
      "have.text",
      commonText.forgotPasswordPageHeader
    );
    cy.get(commonSelectors.forgotPasswordPageSubHeader).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.newToTooljetText
      );
    });
    cy.get(commonSelectors.createAnAccountLink).verifyVisibleElement(
      "have.text",
      commonText.createAnAccountLink
    );
    cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
      "have.text",
      commonText.emailAddressLabel
    );
    cy.get(commonSelectors.emailInputField).should("be.visible");
    cy.get(commonSelectors.resetPasswordLinkButton)
      .verifyVisibleElement("have.text", commonText.resetPasswordLinkButton)
      .and("be.disabled");
    cy.get(commonSelectors.enterIcon).should("be.visible");

    cy.clearAndType(commonSelectors.emailInputField, data.email);
    cy.get(commonSelectors.resetPasswordLinkButton).click();

    cy.get("body").then(($title) => {
      if (!$title.text().includes("Forgot Password")) {
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          commonText.passwordResetEmailToast
        );
        cy.get(commonSelectors.pageLogo).should("be.visible");
        cy.get(commonSelectors.emailImage).should("be.visible");
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
          "have.text",
          commonText.emailPageHeader
        );
        cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
          "have.text",
          commonText.resetPasswordEmailDescription(data.email)
        );
        cy.get(commonSelectors.spamMessage).verifyVisibleElement(
          "have.text",
          commonText.spamMessage
        );
        cy.get(commonSelectors.onboardingSeperator).should("be.visible");
        cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement(
          "have.text",
          commonText.onboardingSeperatorText
        );
        cy.get(commonSelectors.backToLoginButton).verifyVisibleElement(
          "have.text",
          commonText.backToLoginButton
        );
      }
    });

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select forgot_password_token from users where email='${data.email}';`,
    }).then((resp) => {
      passwordResetLink = `/reset-password/${resp.rows[0].forgot_password_token}`;
    });
  });

  it("Verify reset password page and functionality", () => {
    cy.visit(passwordResetLink);
    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.passwordResetPageHeader).verifyVisibleElement(
      "have.text",
      commonText.passwordResetPageHeader
    );
    cy.get(commonSelectors.newPasswordInputLabel).verifyVisibleElement(
      "have.text",
      commonText.newPasswordInputLabel
    );
    cy.get(commonSelectors.newPasswordInputField).should("be.visible");
    cy.get(commonSelectors.passwordHelperText)
      .eq(0)
      .verifyVisibleElement("have.text", commonText.passwordHelperText);
    cy.get(commonSelectors.confirmPasswordInputFieldLabel).verifyVisibleElement(
      "have.text",
      commonText.confirmPasswordInputFieldLabel
    );
    cy.get(commonSelectors.confirmPasswordInputField).should("be.visible");
    cy.get(commonSelectors.passwordHelperText)
      .eq(1)
      .verifyVisibleElement("have.text", commonText.passwordHelperText);
    cy.get(commonSelectors.resetPasswordButton)
      .verifyVisibleElement("have.text", commonText.resetPasswordButton)
      .and("be.disabled");
    cy.get(commonSelectors.enterIcon).should("be.visible");

    cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
    cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

    cy.get(commonSelectors.newPasswordInputField).clear();
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass");
    cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

    cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass");
    cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

    cy.clearAndType(commonSelectors.newPasswordInputField, "password1");
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "password");
    cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

    cy.clearAndType(commonSelectors.newPasswordInputField, "Password");
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "password");
    cy.get(commonSelectors.resetPasswordButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Password don't match");

    cy.clearAndType(commonSelectors.newPasswordInputField, "Password");
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "Password");
    cy.get(commonSelectors.resetPasswordButton).should("be.enabled").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.passwordResetSuccessToast
    );

    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.passwordResetPageHeader).verifyVisibleElement(
      "have.text",
      commonText.passwordResetSuccessPageHeader
    );
    cy.get(commonSelectors.resetPasswordPageDescription).verifyVisibleElement(
      "have.text",
      commonText.resetPasswordPageDescription
    );
    cy.get(commonSelectors.backToLoginButton).verifyVisibleElement(
      "have.text",
      commonText.backToLoginButton
    );
  });
  it("Verify user login using new password", () => {
    cy.visit("/");
    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, "Password");
    cy.get(commonSelectors.loginButton).click();
    cy.get(commonSelectors.workspaceName).should("be.visible");
  });
});
