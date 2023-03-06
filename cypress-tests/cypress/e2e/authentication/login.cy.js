import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText, path } from "Texts/common";

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
    cy.get(commonSelectors.workEmailLabel).verifyVisibleElement(
      "have.text",
      commonText.workEmailLabel
    );
    cy.get(commonSelectors.passwordLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.passwordLabel
      );
    });
    cy.get(commonSelectors.forgotPasswordLink).verifyVisibleElement(
      "have.text",
      commonText.forgotPasswordLink
    );
    cy.get(commonSelectors.loginButton).verifyVisibleElement(
      "have.text",
      commonText.loginButton
    );

    cy.get(commonSelectors.workEmailInputField).should("be.visible");
    cy.get(commonSelectors.passwordInputField).should("be.visible");
  });
  it("Should not be able to login with invalid credentials", () => {
    cy.get(commonSelectors.loginButton).click();
    cy.get(commonSelectors.emailInputError).verifyVisibleElement(
      "have.text",
      commonText.emailInputError
    );

    cy.clearAndType(commonSelectors.workEmailInputField, invalidEmail);
    cy.get(commonSelectors.loginButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.loginErrorToast
    );

    cy.get(commonSelectors.workEmailInputField).clear();
    cy.clearAndType(commonSelectors.passwordInputField, invalidPassword);
    cy.get(commonSelectors.loginButton).click();
    cy.get(commonSelectors.emailInputError).verifyVisibleElement(
      "have.text",
      commonText.emailInputError
    );

    cy.clearAndType(commonSelectors.workEmailInputField, user.email);
    cy.get(commonSelectors.passwordInputField).clear();
    cy.get(commonSelectors.loginButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      commonText.loginErrorToast
    );

    cy.get(commonSelectors.workEmailInputField).clear();
    cy.clearAndType(commonSelectors.passwordInputField, user.password);
    cy.get(commonSelectors.loginButton).click();
    cy.get(commonSelectors.emailInputError).verifyVisibleElement(
      "have.text",
      commonText.emailInputError
    );
  });
  it("Should be able to login with valid credentials", () => {
    cy.login(user.email, user.password);
  });
});
