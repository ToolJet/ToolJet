import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import * as signup from "Support/utils/selfHostSignUp";
import { logout } from "Support/utils/common";
import { onboardingSelectors } from "Selectors/onboarding";

describe("Self host onboarding", () => {
  beforeEach(() => {
    cy.visit("/setup");
  });

  it("verify elements on self host onboarding page", () => {
    cy.get(commonSelectors.HostBanner).should("be.visible");
    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.adminSetup).should("be.visible");
    cy.get(commonSelectors.signupTerms).should("be.visible");

    cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
      "have.text",
      commonText.userNameInputLabel
    );
    cy.get(commonSelectors.nameInputField).should("be.visible");
    cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
      "have.text",
      commonText.emailInputLabel
    );
    cy.get(onboardingSelectors.emailInput).should("be.visible");
    cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
      "have.text",
      commonText.passwordLabel
    );
    cy.get(onboardingSelectors.passwordInput).should("be.visible");
    cy.get(commonSelectors.passwordHelperTextSignup).verifyVisibleElement(
      "have.text",
      commonText.passwordHelperText
    );

    cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.selfHostSignUpTermsHelperText
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

    cy.clearAndType(commonSelectors.nameInputField, "The Developer");
    cy.clearAndType(onboardingSelectors.emailInput, "dev@tooljet.io");
    cy.clearAndType(onboardingSelectors.passwordInput, "password");
    cy.get(commonSelectors.continueButton).click();

    cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
      "have.text",
      "Set up your workspace!"
    );
    cy.get(commonSelectors.workspaceNameInputLabel).verifyVisibleElement(
      "have.text",
      commonText.workspaceNameInputLabel
    );
    cy.get(commonSelectors.workspaceNameInputField).should("be.visible");
    cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
    cy.get(commonSelectors.OnbordingContinue).click();

    cy.get(commonSelectors.skipbutton).click();
    cy.get(commonSelectors.backLogo).click();
    cy.get(commonSelectors.backtoapps).click();

    logout();
    cy.appUILogin();

    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
  });
});



