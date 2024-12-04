import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText, path } from "Texts/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { dashboardSelector } from "Selectors/dashboard";
import {logout} from 'Support/utils/common';


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
        commonText.LoginPasswordLabel
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

    cy.get(onboardingSelectors.SignupEmailInput).should("be.visible");
    cy.get(onboardingSelectors.LoginpasswordInput).should("be.visible");


  });

  it("Should be able to login with valid credentials", () => {
    cy.appUILogin(user.email, user.password);
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(dashboardSelector.logoutLink);
  });
  it("Should not be able to login with invalid credentials", () => {
    cy.wait(3000);
    cy.clearAndType(onboardingSelectors.SignupEmailInput,
      "test"
    );
    cy.clearAndType(onboardingSelectors.SignupEmailInput,
      "test"
    );
    cy.get(commonSelectors.emailInputError).verifyVisibleElement(
      "have.text",
      commonText.emailInputError
    );
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.get(onboardingSelectors.SignupEmailInput).clear();
    cy.clearAndType(onboardingSelectors.LoginpasswordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.SignupEmailInput, user.email);
    cy.get(onboardingSelectors.LoginpasswordInput).clear();
    cy.get(onboardingSelectors.signInButton).should('be.disabled');

    cy.clearAndType(onboardingSelectors.SignupEmailInput, user.email);
    cy.clearAndType(onboardingSelectors.LoginpasswordInput, "Pass")
    cy.get(onboardingSelectors.passwordError).verifyVisibleElement("have.text", "Password must be at least 5 characters long")
    cy.clearAndType(onboardingSelectors.LoginpasswordInput, invalidPassword);
    cy.get(onboardingSelectors.signInButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials")
  });
  it("Should be able to login with valid credentials using api", () => {
    cy.appUILogin(user.email, user.password);
    logout();

  });
});
