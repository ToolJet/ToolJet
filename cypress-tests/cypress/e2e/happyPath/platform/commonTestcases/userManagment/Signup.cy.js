import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { SignUpPageElements } from "Support/utils/onboarding";
import { fake } from "Fixtures/fake";
import {
  verifyConfirmEmailPage,
  verifyConfirmPageElements,
  verifyOnboardingQuestions,
  verifyInvalidInvitationLink,
  updateWorkspaceName,
} from "Support/utils/onboarding";
import { dashboardText } from "Texts/dashboard";
import {
  verifyandModifyUserRole,
  verifyandModifySizeOftheCompany,
} from "Support/utils/selfHostSignUp";
import { onboardingSelectors } from "Selectors/onboarding";
import { logout } from "Support/utils/common";

describe("User signup", () => {
  const data = {};
  let invitationLink = "";

  it("Verify the signup flow and UI elements", () => {
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.wait(2000);
    cy.get(commonSelectors.createAnAccountLink).realClick();
    SignUpPageElements();

    cy.get(onboardingSelectors.nameInput).clear();
    cy.get(onboardingSelectors.nameInput).type(data.fullName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(
      onboardingSelectors.loginPasswordInput,
      commonText.password
    );
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

    logout();
  });

  it("Verify invalid invitation link", () => {
    cy.log(invitationLink);
    cy.visit(invitationLink);
    verifyInvalidInvitationLink();
    cy.get(commonSelectors.pageLogo).click();
    cy.get('[data-cy="sign-in-header"]').should("be.visible");
  });

  it("Verify onboarding flow", () => {
    // rewrite for for EE and cloud
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.wait(8000);
    cy.get(onboardingSelectors.createAnAccountLink).click();
    cy.wait(6000);
    cy.get(onboardingSelectors.nameInput).clear();
    cy.get(onboardingSelectors.nameInput).type(data.fullName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(
      onboardingSelectors.loginPasswordInput,
      commonText.password
    );
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(8000);
    cy.get(commonSelectors.resendEmailButton).click();
    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select invitation_token from users where email='${data.email}';`,
    }).then((resp) => {
      invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    });
  });
});
