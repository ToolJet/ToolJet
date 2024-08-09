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
    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-cy="work-email-input"]').clear();
    cy.get('[data-cy="work-email-input"]').type('dev@tooljet.io');
    cy.get('[data-cy="password-input-field"]').clear();
    cy.get('[data-cy="password-input-field"]').type('password{enter}');
    cy.get('[data-cy="login-button"]').click();
    cy.get('[data-cy="create-new-app-button"]').click();
    cy.get('[data-cy="app-name-input"]').clear();
    cy.get('[data-cy="app-name-input"]').type('test{enter}');
    cy.get('[data-cy="+-create-app"]').click();
    cy.get('.driver-close-btn').click();
    cy.get('[data-cy="button-release"]').click();
    cy.get('[data-cy="yes-button"]').click();
    /* ==== End Cypress Studio ==== */
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
