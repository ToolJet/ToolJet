import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { logout } from "Support/utils/common";
import {
  bannerElementsVerification,
  onboardingStepOne,
  onboardingStepThree,
  onboardingStepTwo,
} from "Support/utils/onboarding";
import { commonText } from "Texts/common";
import { onboardingText } from "Texts/onboarding";
import { multiEnvSelector } from "Selectors/eeCommon";

describe("Self host onboarding", () => {
  const envVar = Cypress.env("environment");

  beforeEach(() => {
    cy.visit("/setup");
    cy.intercept("GET", "/api/data-queries/**").as("getDataQueries");
    cy.intercept("GET", "/assets/translations/en.json").as("translations");
  });

  afterEach(() => {
    // Check if the user exists in the database
    cy.runSqlQuery(`SELECT id FROM users WHERE email='dev@tooljet.io';`).then(
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

  it("verify elements on self host onboarding page", () => {
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
      bannerElementsVerification();

      const trialPageTexts = [
        {
          selector: onboardingSelectors.beforeDiveInHeader,
          text: onboardingText.freeTrialHeaderText,
        },
        {
          selector: onboardingSelectors.infoDescription,
          text: onboardingText.infoDescriptionText,
        },
        {
          selector: onboardingSelectors.noCreditCardBanner,
          text: onboardingText.noCreditCardText,
        },
        {
          selector: onboardingSelectors.trialButton,
          text: "Start your 14-day trial",
        },
        { selector: onboardingSelectors.declineButton, text: "No, thanks" },
      ];

      trialPageTexts.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      cy.get(onboardingSelectors.comparePlansTitle).verifyVisibleElement(
        "have.text",
        onboardingText.comparePlansText
      );

      cy.get(onboardingSelectors.comparePlanDescription)
        .invoke("text")
        .then((text) => {
          const normalizedText = text.replace(/\s+/g, " ").trim();
          expect(normalizedText).to.equal(
            "The plan reflects the features available in the latest version of ToolJet and some feature may not be available in your version. Click here to check out the details plan comparison & prices on our website."
          );
        });

      cy.get(onboardingSelectors.onPremiseLink)
        .verifyVisibleElement("have.text", "Click here")
        .and("have.attr", "href")
        .and("equal", "https://tooljet.com/pricing?payment=onpremise");

      const planTitles = [
        {
          selector: onboardingSelectors.basicPlanTitle,
          text: onboardingText.basicPlanText,
        },
        {
          selector: onboardingSelectors.flexibleTitle,
          text: onboardingText.flexibleText,
        },
        {
          selector: onboardingSelectors.businessTitle,
          text: onboardingText.businessText,
        },
      ];

      planTitles.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      const prices = [
        { selector: `${onboardingSelectors.planPrice}:eq(0)`, text: "$0" },
        {
          selector: `${onboardingSelectors.proPlanPrice}:eq(0)`,
          text: "$79/monthper builder",
        },
        {
          selector: `${onboardingSelectors.proPlanPrice}:eq(1)`,
          text: "$199/monthper builder",
        },
        {
          selector: `${onboardingSelectors.planToggleLabel}:eq(0)`,
          text: "Yearly20% off",
        },
        {
          selector: `${onboardingSelectors.planToggleLabel}:eq(1)`,
          text: "Yearly20% off",
        },
      ];

      prices.forEach((item) => {
        cy.get(item.selector).should("be.visible").and("have.text", item.text);
      });

      cy.get(onboardingSelectors.planToggleInput).eq(0).should("be.visible");
      cy.get(onboardingSelectors.planToggleInput).eq(1).should("be.visible");

      cy.get(onboardingSelectors.pricingPlanToggle)
        .eq(0)
        .uncheck({ force: true });

      cy.get(onboardingSelectors.planToggleLabel)
        .eq(0)
        .verifyVisibleElement("have.text", "Monthly20% off");
      cy.get(onboardingSelectors.discountDetails)
        .should("have.css", "text-decoration")
        .and("include", "line-through");

      cy.get(onboardingSelectors.proPlanPrice)
        .eq(0)
        .verifyVisibleElement("have.text", "$99/monthper builder");

      cy.get(onboardingSelectors.pricingPlanToggle)
        .eq(1)
        .uncheck({ force: true });
      cy.get(onboardingSelectors.planToggleLabel)
        .eq(1)
        .verifyVisibleElement("have.text", "Monthly20% off");
      cy.get(onboardingSelectors.discountDetails)
        .should("have.css", "text-decoration")
        .and("include", "line-through");

      cy.get(onboardingSelectors.proPlanPrice)
        .eq(1)
        .verifyVisibleElement("have.text", "$249/monthper builder");

      cy.get(onboardingSelectors.enterpriseTitle).verifyVisibleElement(
        "have.text",
        "Enterprise"
      );
      cy.get(onboardingSelectors.customPricingHeader).verifyVisibleElement(
        "have.text",
        "Custom pricing"
      );
      cy.get(onboardingSelectors.scheduleACallButton).verifyVisibleElement(
        "have.text",
        "Schedule a call"
      );

      cy.get(onboardingSelectors.declineButton).click();

      bannerElementsVerification();
      onboardingStepThree();
    });

    cy.wait("@getDataQueries");
    cy.wait(2000);
    cy.get(multiEnvSelector.environmentsTag("development"), {
      timeout: 20000,
    }).should("be.visible", { timeout: 20000 });

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
