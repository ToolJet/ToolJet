import { commonSelectors } from "../../constants/selectors/common";
import {commonText} from "../../constants/texts/common";

describe("", () => {
  let passwordResetLink = "";
    before(() => {
      cy.visit("");
    });
    
    const data = {};

     data.email = 'dev@tooljet.io'
    it("forgot password", () => {
      cy.get(commonSelectors.forgotPasswordLink).click();
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.forgotPasswordPageHeader).verifyVisibleElement("have.text",commonText.forgotPasswordPageHeader);
      cy.get(commonSelectors.forgotPasswordPageSubHeader).should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          commonText.newToTooljetText);
      })
      cy.get(commonSelectors.createAnAccountLink).verifyVisibleElement("have.text", commonText.createAnAccountLink);
      cy.get(commonSelectors.emailInputLabel).verifyVisibleElement("have.text",commonText.emailAddressLabel);
      cy.get(commonSelectors.emailInputField).should("be.visible");
      cy.get(commonSelectors.resetPasswordLinkButton).verifyVisibleElement("have.text",commonText.resetPasswordLinkButton).and('be.disabled');
      cy.get(commonSelectors.enterIcon).should("be.visible");

      cy.clearAndType(commonSelectors.emailInputField, 'dev@tooljet.io');
      cy.get(commonSelectors.resetPasswordLinkButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage,commonText.passwordResetEmailToast);

      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.emailImage).should("be.visible");
      cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement("have.text",commonText.emailPageHeader);
      cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement("have.text",commonText.resetPasswordEmailDescription('dev@tooljet.io'));
      cy.get(commonSelectors.spamMessage).verifyVisibleElement("have.text",commonText.spamMessage);
      cy.get(commonSelectors.onboardingSeperator).should("be.visible");
      cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement("have.text", commonText.onboardingSeperatorText);
      cy.get(commonSelectors.backToLoginButton).verifyVisibleElement("have.text",commonText.backToLoginButton);
      
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select forgot_password_token from users where email='${data.email}';`,
      }).then((resp) => {
        passwordResetLink = `http://localhost:8082/reset-password/${resp.rows[0].forgot_password_token}`;
      });


    });

    it("Reset password", ()=>{
      cy.visit(passwordResetLink);

      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.passwordResetPageHeader).verifyVisibleElement("have.text", commonText.passwordResetPageHeader);
      cy.get(commonSelectors.newPasswordInputLabel).verifyVisibleElement("have.text", commonText.newPasswordInputLabel);
      cy.get(commonSelectors.newPasswordInputField).should("be.visible");
      cy.get(commonSelectors. passwordHelperText).eq(0).verifyVisibleElement("have.text", commonText.passwordHelperText);
      cy.get(commonSelectors.confirmPasswordInputFieldLabel).verifyVisibleElement("have.text",commonText.confirmPasswordInputFieldLabel );
      cy.get(commonSelectors.confirmPasswordInputField).should("be.visible");
      cy.get(commonSelectors. passwordHelperText).eq(1).verifyVisibleElement("have.text", commonText.passwordHelperText);
      cy.get(commonSelectors.resetPasswordButton).verifyVisibleElement("have.text", commonText.resetPasswordButton).and("be.disabled");
      cy.get(commonSelectors.enterIcon).should("be.visible");

      cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

      cy.get(commonSelectors.newPasswordInputField).clear();
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass")
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

      cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass")
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");

      cy.clearAndType(commonSelectors.newPasswordInputField, "password");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "password")
      cy.get(commonSelectors.resetPasswordButton).should("be.enabled").click();
      cy.verifyToastMessage(commonSelectors.toastMessage,commonText.passwordResetSuccessToast);

      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.passwordResetPageHeader).verifyVisibleElement("have.text",commonText.passwordResetSuccessPageHeader);
      cy.get(commonSelectors.resetPasswordPageDescription).verifyVisibleElement("have.text",commonText.resetPasswordPageDescription);
      cy.get(commonSelectors.backToLoginButton).verifyVisibleElement("have.text",commonText.backToLoginButton);

    })
  });

  