import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { SignUpPageElements } from "Support/utils/onboarding";
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
import { onboardingSelectors } from "Selectors/onboarding";


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

    cy.get(onboardingSelectors.nameInput).clear(); // Break the chain
    cy.get(onboardingSelectors.nameInput).type(data.fullName); // Requery the element
    cy.clearAndType(onboardingSelectors.emailInput, data.email);
    cy.clearAndType(onboardingSelectors.passwordInput, commonText.password);
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

    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get('[data-cy="set-up-your-workspace!-header"]').verifyVisibleElement(
      "have.text",
      "Set up your workspace!"
    );

    cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
      "have.text",
      commonText.continueToSetUp
    );
    cy.get('[data-cy="onboarding-workspace-name-label"]').verifyVisibleElement(
      "have.text",
      "Workspace name *"
    );
    cy.get('[data-cy="onboarding-workspace-name-input"]').should('be.visible')

    cy.wait(1000)
    cy.clearAndType('[data-cy="onboarding-workspace-name-input"]', data.workspaceName)
    cy.get('[data-cy="onboarding-submit-button"]').verifyVisibleElement(
      "have.text",
      "Continue"
    );
    cy.get('[data-cy="onboarding-submit-button"]').click();
    cy.wait(4000);

    cy.skipWalkthrough();
    //verifyOnboardingQuestions(data.fullName, data.workspaceName);  Add env flags for EE and Cloud

    //Add validation for the application
  });
  it("Verify invalid invitation link", () => {
    cy.log(invitationLink)
    cy.visit(invitationLink);
    verifyInvalidInvitationLink();
    // cy.get(commonSelectors.backtoSignUpButton).click();
    cy.get(commonSelectors.pageLogo).click()
    cy.get(commonSelectors.SignUpSectionHeader).should("be.visible");
  });
  it.skip("Verify onboarding flow", () => {
    // rewrite for for EE and cloud
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.get(commonSelectors.createAnAccountLink).realClick();

    cy.get(onboardingSelectors.nameInput).clear();
    cy.get(onboardingSelectors.nameInput).type(data.fullName);
    cy.clearAndType(onboardingSelectors.emailInput, data.email);
    cy.clearAndType(onboardingSelectors.passwordInput, commonText.password);
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(8000);
    cy.get(commonSelectors.resendEmailButton).click();
    cy.get(commonSelectors.editEmailButton).click();
    cy.get(onboardingSelectors.nameInput).verifyVisibleElement("have.value", data.fullName)
    cy.get(onboardingSelectors.emailInput).verifyVisibleElement("have.value", data.email);
    cy.get(onboardingSelectors.passwordInput).verifyVisibleElement("have.value", "");

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
