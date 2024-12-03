import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText, path } from "Texts/common";
import { onboardingSelectors } from "Selectors/onboarding";

import { onboardingSelectors } from "Selectors/onboarding";
import { dashboardSelector } from "Selectors/dashboard";


describe("Login functionality", () => {
  let user;
  const invalidEmail = fake.email;
  const invalidPassword = fake.password;

  beforeEach(() => {
    cy.fixture("credentials/login.json").then((login) => {
      user = login;
    });
    cy.visit("/");
  });
  it("Should verify elements on the login page", () => {
    cy.url().should("include", path.loginPath);
    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.signInHeader).verifyVisibleElement(
      "have.text",
      commonText.signInHeader
    );
    cy.get(onboardingSelectors.emailLabel).verifyVisibleElement(
      "have.text",
      "Email *"
    );
    cy.get(onboardingSelectors.passwordLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.LoginpasswordLabel
      );
    });
    cy.get(commonSelectors.forgotPasswordLink).verifyVisibleElement(
      "have.text",
      commonText.forgotPasswordLink
    );
    cy.get(onboardingSelectors.signInButton).verifyVisibleElement(
      "have.text",
      "Sign in"
    );
    cy.get(onboardingSelectors.signInButton).should('be.disabled')

    cy.get(onboardingSelectors.emailInput).should("be.visible");
    cy.get(onboardingSelectors.passwordInput).should("be.visible");
    cy.get(onboardingSelectors.LoginEmailInput).should("be.visible");
    cy.get(onboardingSelectors.LoginPasswordInput).should("be.visible");

  });

  it("Should be able to login with valid credentials", () => {
    cy.appUILogin(user.email, user.password);
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(dashboardSelector.logoutLink);
  });

  it("Should not be able to login with invalid credentials", () => {
    cy.clearAndType(onboardingSelectors.emailInput,
      "test"
    );
    cy.clearAndType(onboardingSelectors.LoginEmailInput,
      "test"
    );
    cy.get(commonSelectors.emailInputError).verifyVisibleElement(
      "have.text",
      commonText.emailInputError
    );
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.get(onboardingSelectors.emailInput).clear();
    cy.clearAndType(onboardingSelectors.passwordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.emailInput, user.email);
    cy.get(onboardingSelectors.passwordInput).clear();
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.emailInput, user.email);
    cy.clearAndType(onboardingSelectors.passwordInput, "Pass")
    cy.get(onboardingSelectors.passwordError).verifyVisibleElement("have.text", "Password must be at least 5 characters long")
    cy.clearAndType(onboardingSelectors.passwordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials")
  });
  it("Should be able to login with valid credentials", () => {
    cy.appUILogin(user.email, user.password);

    cy.get(onboardingSelectors.LoginEmailInput).clear();
    cy.clearAndType(onboardingSelectors.LoginPasswordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.LoginEmailInput, user.email);
    cy.get(onboardingSelectors.LoginPasswordInput).clear();
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.LoginEmailInput, user.email);
    cy.clearAndType(onboardingSelectors.LoginPasswordInput, "Pass")
    cy.get(onboardingSelectors.passwordError).verifyVisibleElement("have.text", "Password must be at least 5 characters long")
    cy.clearAndType(onboardingSelectors.LoginPasswordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials")
  });
});
