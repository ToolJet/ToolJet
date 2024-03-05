import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { SignUpPageElements } from "Support/utils/manageSSO";
import { fake } from "Fixtures/fake";
import {
  verifyConfirmEmailPage,
  verifyConfirmPageElements,
  verifyOnboardingQuestions,
  verifyInvalidInvitationLink,
  updateWorkspaceName
} from "Support/utils/onboarding";
import { dashboardText } from "Texts/dashboard";
import {
  verifyandModifyUserRole,
  verifyandModifySizeOftheCompany,
} from "Support/utils/selfHostSignUp";

describe("User signup", () => {
  const data = {};
  let invitationLink = "";

  it("Verify the signup flow and UI elements", () => {
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.get(commonSelectors.createAnAccountLink).realClick();
    SignUpPageElements();

    cy.clearAndType(commonSelectors.nameInputField, data.fullName);
    cy.clearAndType(commonSelectors.emailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(500);
    verifyConfirmEmailPage(data.email);

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select invitation_token from users where email='${data.email}';`,
    }).then((resp) => {
      invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
      cy.visit(invitationLink);
    });

    verifyConfirmPageElements();
    cy.get(commonSelectors.setUpToolJetButton).click();
    cy.wait(4000);
    verifyOnboardingQuestions(data.fullName, data.workspaceName);
  });
  it("Verify invalid invitation link", () => {
    cy.visit(invitationLink);
    verifyInvalidInvitationLink();
    cy.get(commonSelectors.backtoSignUpButton).click();
    cy.get(commonSelectors.SignUpSectionHeader).should("be.visible");
  });
  it("Verify onboarding flow", () => {
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.get(commonSelectors.createAnAccountLink).realClick();

    cy.clearAndType(commonSelectors.nameInputField, data.fullName);
    cy.clearAndType(commonSelectors.emailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(8000);
    cy.get(commonSelectors.resendEmailButton).click();
    cy.get(commonSelectors.editEmailButton).click();
    cy.get(commonSelectors.nameInputField).verifyVisibleElement("have.value", data.fullName)
    cy.get(commonSelectors.emailInputField).verifyVisibleElement("have.value", data.email);
    cy.get(commonSelectors.passwordInputField).verifyVisibleElement("have.value", "");

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select invitation_token from users where email='${data.email}';`,
    }).then((resp) => {
      invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
      cy.visit(invitationLink);
    });
    cy.get(commonSelectors.setUpToolJetButton).click();
    cy.clearAndType(commonSelectors.companyNameInputField, data.workspaceName);
    cy.get(commonSelectors.continueButton).focus().type('{enter}');

    cy.get(commonSelectors.backArrow).click()
    cy.get(commonSelectors.companyNameInputField).verifyVisibleElement("have.value", data.workspaceName);
    cy.get(commonSelectors.continueButton).focus().type('{enter}');
    cy.get('[data-cy="head-of-engineering-radio-button"]').check()
    cy.get(commonSelectors.continueButton).focus().type('{enter}');

    cy.get(commonSelectors.backArrow).click()
    cy.get('[data-cy="head-of-engineering-radio-button"]').should("be.checked")
    cy.get(commonSelectors.continueButton).focus().type('{enter}');

    cy.get('[data-cy="1-10-radio-button"]').check()
    cy.get(commonSelectors.continueButton).focus().type('{enter}');
    cy.get(commonSelectors.backArrow).click()
    cy.get('[data-cy="1-10-radio-button"]').should("be.checked")
    cy.get(commonSelectors.continueButton).focus().type('{enter}');
  })
});
