import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { SignUpPageElements } from "Support/utils/manageSSO";
import { fake } from "Fixtures/fake";
import {
  verifyConfirmEmailPage,
  verifyConfirmPageElements,
  verifyOnboardingQuestions,
  verifyInvalidInvitationLink,
} from "Support/utils/onboarding";
import { dashboardText } from "Texts/dashboard";
import { updateWorkspaceName } from "Support/utils/userPermissions";

describe("User signup", () => {
  const data = {};
  data.fullName = fake.fullName;
  data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.workspaceName = fake.companyName;

  let invitationLink = "";

  before(() => {
    cy.visit("/");
  });
  it("Verify sign up page elements", () => {
    cy.wait(500);
    cy.reload();
    cy.get(commonSelectors.createAnAccountLink).realClick();
    SignUpPageElements();

    cy.clearAndType(commonSelectors.nameInputField, data.fullName);
    cy.clearAndType(commonSelectors.emailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
    cy.get(commonSelectors.signUpButton).click();

    cy.wait(500);
    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select invitation_token from users where email='${data.email}';`,
    }).then((resp) => {
      invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    });
    verifyConfirmEmailPage(data.email);
  });
  it("Verify the singup invitation and onboarding flow", () => {
    cy.visit(invitationLink);
    verifyConfirmPageElements();
    cy.get(commonSelectors.setUpToolJetButton).click();
    cy.wait(4000);
    cy.get("body").then(($el) => {
      if (!$el.text().includes(dashboardText.emptyPageHeader)) {
        verifyOnboardingQuestions(data.fullName, data.workspaceName);
        updateWorkspaceName(data.email);
      } else {
        updateWorkspaceName(data.email);
      }
    });
  });
  it("Verify invalid invitation link", () => {
    cy.visit(invitationLink);
    verifyInvalidInvitationLink();
    cy.get(commonSelectors.backtoSignUpButton).click();
    cy.get(commonSelectors.SignUpSectionHeader).should("be.visible");
  });
});
