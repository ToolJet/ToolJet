import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import {
  verifyandModifyUserRole,
  verifyandModifySizeOftheCompany,
} from "Support/utils/selfHostSignUp";
import { navigateToManageUsers, logout } from "Support/utils/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import { onboardingSelectors } from "Selectors/onboarding";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

export const verifyConfirmEmailPage = (email) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get('[data-cy="check-your-mail-header"]').verifyVisibleElement(
    "have.text",
    commonText.emailPageHeader
  );

  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.emailPageDescription(email)
  );

  cy.get(commonSelectors.spamMessage).verifyVisibleElement(
    "have.text",
    commonText.spamMessage
  );
  cy.get(commonSelectors.onboardingSeperator).should("be.visible");
  cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement(
    "have.text",
    commonText.onboardingSeperatorText
  );

  cy.get(commonSelectors.resendEmailButton).should("be.visible");
  cy.get('[data-cy="back-to-signup"]').verifyVisibleElement(
    "have.text",
    "Back to sign up"
  );
};

export const verifyOnboardingQuestions = (workspaceName) => {
  bannerElementsVerification();
  onboardingStepOne();
  onboardingStepTwo(workspaceName);
  onboardingStepThree();
};

export const verifyInvalidInvitationLink = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  // cy.get(commonSelectors.emailImage).should("be.visible");

  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkHeader
  );
  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkDescription
  );

  // cy.get(commonSelectors.backtoSignUpButton).verifyVisibleElement(
  //   "have.text",
  //   commonText.backtoSignUpButton
  // );
};

export const userSignUp = (fullName, email, workspaceName = "test") => {
  let invitationLink;
  cy.intercept("GET", "/api/organizations/public-configs").as("publicConfig");
  cy.visit("/");
  cy.wait("@publicConfig");
  cy.wait(2000);
  cy.get(commonSelectors.createAnAccountLink, { timout: 10000 }).click();
  cy.wait(2000);
  cy.get(onboardingSelectors.nameInput, { timeout: 1000 }).should(
    "not.be.disabled"
  );
  cy.get(onboardingSelectors.nameInput).clear();
  cy.get(onboardingSelectors.nameInput).type(fullName);
  cy.clearAndType(onboardingSelectors.loginEmailInput, email);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, commonText.password);
  cy.get(commonSelectors.signUpButton).click();

  cy.wait(2500);
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    cy.visit(invitationLink);
    cy.wait(2500);
  });
  if (Cypress.env("environment") !== "Community") {
    cy.clearAndType(
      '[data-cy="onboarding-workspace-name-input"]',
      workspaceName
    );
    cy.get('[data-cy="onboarding-submit-button"]').click();
  }
};

export const inviteUser = (firstName, email) => {
  cy.apiUserInvite(firstName, email);
  fetchAndVisitInviteLink(email);
  cy.wait(1000);
  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  // cy.intercept("GET", "/api/organizations").as("org");
  cy.get(commonSelectors.continueButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const addNewUser = (firstName, email) => {
  navigateToManageUsers();
  inviteUser(firstName, email);
};

export const roleBasedOnboarding = (firstName, email, userRole) => {
  navigateToManageUsers();
  cy.apiUserInvite(firstName, email, userRole);
  fetchAndVisitInviteLink(email);
  cy.wait(1000);
  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  // cy.intercept("GET", "/api/organizations").as("org");
  cy.get(commonSelectors.continueButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const visitWorkspaceInvitation = (email, workspaceName) => {
  let workspaceId, userId, url, organizationToken;

  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `select id from users where email='${email}';`,
    }).then((resp) => {
      userId = resp.rows[0].id;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from organization_users where organization_id= '${workspaceId}' AND user_id='${userId}';`,
      }).then((resp) => {
        organizationToken = resp.rows[0].invitation_token;
        url = `/organization-invitations/${organizationToken}?oid=${workspaceId}`;
        logout();
        cy.visit(url);
      });
    });
  });
};

export const SignUpPageElements = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.signUpSectionHeader).verifyVisibleElement(
    "have.text",
    "Sign up"
  );
  cy.get(commonSelectors.signUpButton).verifyVisibleElement(
    "have.text",
    "Sign up"
  );

  // cy.get('[data-cy="signup-info"]').should(($el) => {
  //   expect($el.contents().first().text().trim()).to.eq(
  //     commonText.signInRedirectText
  //   );
  // });

  cy.get(onboardingSelectors.signupNameLabel).verifyVisibleElement(
    "have.text",
    "Name *"
  );
  cy.get(onboardingSelectors.nameInput).should("be.visible");
  cy.get(onboardingSelectors.emailLabel).verifyVisibleElement(
    "have.text",
    "Email *"
  );
  // cy.get(commonSelectors.loginPasswordLabel).verifyVisibleElement("have.text", "Password *");

  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");

  cy.get(commonSelectors.signInRedirectLink).verifyVisibleElement(
    "have.text",
    commonText.signInRedirectLink
  );
  cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.signUpTermsHelperText
    );
  });
  cy.get(commonSelectors.termsOfServiceLink)
    .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/terms");
  cy.get(commonSelectors.privacyPolicyLink)
    .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
    .and("have.attr", "href")
    .and("equal", "https://www.tooljet.com/privacy");
  cy.get("body").then(($el) => {
    if ($el.text().includes("Google")) {
      cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
        "have.text",
        ssoText.googleSignUpText
      );
      cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
        "have.text",
        ssoText.gitSignUpText
      );
      cy.get(commonSelectors.onboardingSeperator).should("be.visible");
      cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement(
        "have.text",
        commonText.onboardingSeperatorText
      );
    }
  });
};

export const signUpLink = (email) => {
  let invitationLink;
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    cy.visit(invitationLink);
    cy.wait(3000);

  });
};

export const bannerElementsVerification = () => {
  const bannerElements = [
    { selector: commonSelectors.HostBanner },
    { selector: commonSelectors.pageLogo },
    { selector: onboardingSelectors.stepsDetails },
  ];
  bannerElements.forEach((element) => {
    cy.get(element.selector).should("be.visible");
  });
};

export const enableInstanceSignUp = (allow = true) => {
  const value = allow ? "true" : "false";
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${value}' WHERE key = 'ALLOW_PERSONAL_WORKSPACE';
          UPDATE instance_settings SET value = '${value}' WHERE key = 'ENABLE_SIGNUP';`,
  });
};

export const onboardingStepOne = () => {
  const companyPageTexts = [
    {
      selector: onboardingSelectors.tellUsAbit,
      text: "Tell us a bit about yourself",
    },
    {
      selector: onboardingSelectors.pageDescription,
      text: "This information will help us improve ToolJet",
    },
    {
      selector: '[data-cy="onboarding-company-name-label"]',
      text: "Company name *",
    },
    {
      selector: '[data-cy="onboarding-build-purpose-label"]',
      text: "What would you like to build on ToolJet? *",
    },
  ];

  companyPageTexts.forEach((item) => {
    cy.get(item.selector).should("be.visible").and("have.text", item.text);
  });

  cy.get(onboardingSelectors.companyNameInput).should("be.visible");
  cy.get(onboardingSelectors.buildPurposeInput).should("be.visible");
  cy.get(onboardingSelectors.onboardingSubmitButton).verifyVisibleElement(
    "have.attr",
    "disabled"
  );

  cy.get(onboardingSelectors.companyNameInput).type("Tooljet");
  cy.get(onboardingSelectors.onboardingSubmitButton).should(
    "have.attr",
    "disabled"
  );
  cy.get(onboardingSelectors.buildPurposeInput).type("Exploring");
  cy.get(onboardingSelectors.onboardingSubmitButton).verifyVisibleElement(
    "have.text",
    "Continue"
  );
  cy.get(onboardingSelectors.onboardingSubmitButton)
    .should("be.enabled")
    .click();
};

export const onboardingStepTwo = (workspaceName = "My workspace") => {
  cy.get(commonSelectors.setUpworkspaceCheckPoint)
    .should("be.visible")
    .and("have.text", "Set up your workspace!");

  cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
    "have.text",
    "Set up workspaces to manage users, applications & resources across various teams"
  );
  cy.get(commonSelectors.workspaceNameInputLabel)
    .should("be.visible")
    .and("have.text", commonText.workspaceNameInputLabel);
  cy.clearAndType(commonSelectors.workspaceNameInputField, workspaceName);
  cy.get(commonSelectors.OnbordingContinue)
    .verifyVisibleElement("have.text", "Continue")
    .click();
};

export const onboardingStepThree = () => {
  cy.get(
    `[data-cy="we've-created-a-sample-application-for-you!-header"]`
  ).verifyVisibleElement(
    "have.text",
    "We've created a sample application for you!"
  );
  cy.get(onboardingSelectors.pageDescription).verifyVisibleElement(
    "have.text",
    "The sample application comes with a sample PostgreSQL database for you to play around with. You can also get started quickly with pre-built applications from our template collection!"
  );

  cy.get(onboardingSelectors.onboardingSubmitButton)
    .verifyVisibleElement("have.text", "Continue")
    .click();
};
