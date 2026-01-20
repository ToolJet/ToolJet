import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { logout } from "Support/utils/common";
import { enableInstanceSignup } from "Support/utils/manageSSO";
import {
  SignUpPageElements,
  verifyConfirmEmailPage,
  verifyInvalidInvitationLink,
} from "Support/utils/onboarding";
import { commonText } from "Texts/common";

describe("User signup", () => {
  const data = {};
  let invitationLink = "";

  before(() => {
    cy.ifEnv("Enterprise", () => {
      cy.defaultWorkspaceLogin();
      enableInstanceSignup();
      logout();
    });
  });

  it("Verify the signup flow and UI elements", () => {
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.intercept("GET", "/api/white-labelling").as("whiteLabellingAPI");

    cy.visit("/");
    cy.wait(500);
    cy.get(commonSelectors.createAnAccountLink).realClick();
    SignUpPageElements();

    cy.wait("@whiteLabellingAPI");
    cy.wait(1000);

    cy.get(onboardingSelectors.nameInput)
      .should("be.visible")
      .should("not.be.disabled");

    cy.get(onboardingSelectors.nameInput).click();

    cy.wait(100);

    cy.get(onboardingSelectors.nameInput).clear();
    cy.get(onboardingSelectors.nameInput).type(data.fullName, { force: true });

    cy.get(onboardingSelectors.nameInput).should("have.value", data.fullName);

    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(
      onboardingSelectors.loginPasswordInput,
      commonText.password
    );
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(500);

    logout();
  });

  it("Verify onboarding flow", () => {
    // rewrite for for EE and cloud
    data.fullName = fake.fullName;
    data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.workspaceName = fake.companyName;

    cy.visit("/");
    cy.get(onboardingSelectors.createAnAccountLink).click();
    cy.wait(2000);
    cy.get(onboardingSelectors.nameInput).clear();
    cy.get(onboardingSelectors.nameInput).type(data.fullName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
    cy.clearAndType(
      onboardingSelectors.loginPasswordInput,
      commonText.password
    );
    cy.intercept("POST", "/api/onboarding/signup").as("signup");
    cy.get(commonSelectors.signUpButton).click();

    cy.wait("@signup");
    cy.wait(500);

    logout();
  });
});
