import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { logout } from "Support/utils/common";
import {
  bannerElementsVerification,
  onboardingStepOne,
  onboardingStepTwo,
} from "Support/utils/onboarding";
import { commonText } from "Texts/common";

describe("Self host onboarding", () => {
  const envVar = Cypress.env("environment");

  beforeEach(() => {
    cy.visit("/setup");
    cy.intercept("GET", "/assets/translations/en.json").as("translations");
  });

  afterEach(() => {
    // Check if the user exists in the database
    cy.runSqlQueryOnDB(`SELECT id FROM users WHERE email='dev@tooljet.io';`).then(
      (resp) => {
        // If user doesn't exist in DB, create it
        if (!resp.rows || resp.rows.length === 0) {
          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/onboarding/setup-super-admin`,
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              companyName: "ToolJet",
              name: "The Developer",
              workspaceName: "My workspace",
              email: "dev@tooljet.io",
              password: "password",
            },
            failOnStatusCode: false,
          });
        }
      }
    );
  });

  // First-user setup can only run once per instance: a retry starts with the admin
  // and workspace already created, so retrying would only hide the real failure.
  it("verify elements on self host onboarding page", { retries: 0 }, () => {
    cy.ifEnv("Enterprise", () => {
      cy.get(commonSelectors.HostBanner).should("be.visible");
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(onboardingSelectors.welcomeHeader).verifyVisibleElement(
        "have.text",
        "Welcome to ToolJet!"
      );
      cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
        "have.text",
        "Let's set up your admin account and workspace to get started!"
      );
      cy.get(onboardingSelectors.setUpToolJetButton).verifyVisibleElement(
        "have.text",
        "Set up ToolJet"
      );
      cy.get(onboardingSelectors.setUpToolJetButton).click();
    });

    const commonElements = [
      { selector: commonSelectors.HostBanner },
      { selector: commonSelectors.pageLogo },
      { selector: commonSelectors.signupTerms },
      { selector: commonSelectors.nameInputField },
      { selector: onboardingSelectors.emailInput },
      { selector: onboardingSelectors.passwordInput },
    ];

    commonElements.forEach((element) => {
      cy.get(element.selector).should("be.visible");
    });

    const labelChecks = [
      {
        selector: commonSelectors.adminSetup,
        text: "Set up your admin account",
      },
      {
        selector: commonSelectors.userNameInputLabel,
        text: commonText.userNameInputLabel,
      },
      {
        selector: commonSelectors.emailInputLabel,
        text: commonText.emailInputLabel,
      },
      {
        selector: commonSelectors.passwordLabel,
        text: commonText.passwordLabel,
      },
      // {
      //   selector: commonSelectors.passwordHelperTextSignup,
      //   text: commonText.passwordHelperText,
      // },
    ];

    labelChecks.forEach((check) => {
      cy.get(check.selector).verifyVisibleElement("have.text", check.text);
    });

    cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        "By signing up you are agreeing to the"
      );
    });

    const links = [
      {
        selector: commonSelectors.termsOfServiceLink,
        text: commonText.termsOfServiceLink,
        href: "https://www.tooljet.com/terms",
      },
      {
        selector: commonSelectors.privacyPolicyLink,
        text: commonText.privacyPolicyLink,
        href: "https://www.tooljet.com/privacy",
      },
    ];

    links.forEach((link) => {
      cy.get(link.selector)
        .verifyVisibleElement("have.text", link.text)
        .and("have.attr", "href")
        .and("equal", link.href);
    });

    cy.get(commonSelectors.nameInputField).type("The Developer");
    cy.get(onboardingSelectors.emailInput).type("dev@tooljet.io");
    cy.get(onboardingSelectors.passwordInput).type("password");
    cy.get(commonSelectors.signUpButton).click();

    cy.ifEnv("Enterprise", () => {
      bannerElementsVerification();
      onboardingStepOne();
    });

    bannerElementsVerification();
    onboardingStepTwo();

    cy.ifEnv("Enterprise", () => {
      cy.url({ timeout: 20000 }).should("include", "/my-workspace/home");
      cy.get(commonSelectors.homePagePromptHeader, {
        timeout: 20000,
      }).verifyVisibleElement("have.text", "What do you want to build today?");
    });

    cy.apiLogout();
    cy.visit("/my-workspace");
    cy.wait("@translations");
    cy.waitForElement(onboardingSelectors.loginPasswordInput);
    cy.wait(1000);
    cy.appUILogin();

    cy.get(commonSelectors.workspaceName)
      .should("be.visible")
      .and("have.text", "My workspace");
  });
});
