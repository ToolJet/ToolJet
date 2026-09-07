// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// onboarding.js
//   verifyConfirmEmailPage           signup.verifyConfirmEmail → onboarding
//   verifyOnboardingQuestions        onboardingFlow.verifyQuestions → onboarding
//   verifyInvalidInvitationLink      workspaceInvite.verifyInvalidLink → onboarding
//   userSignUp                       signup.submit        → onboarding
//   inviteUser                       user.inviteViaOnboarding → onboarding
//   addNewUser                       user.addNew          → onboarding
//   roleBasedOnboarding              onboardingFlow.byRole → onboarding
//   visitWorkspaceInvitation         workspaceInvite.visit → onboarding
//   SignUpPageElements               signup.verifyPage    → onboarding
//   signUpLink                       signup.readLink      → onboarding
//   bannerElementsVerification       signup.verifyBanner  → onboarding
//   enableInstanceSignUp             instanceSetting.enableSignup → onboarding
//   onboardingStepOne                onboardingFlow.stepOne → onboarding
//   onboardingStepTwo                onboardingFlow.stepTwo → onboarding
//   onboardingStepThree              onboardingFlow.stepThree → onboarding
//   addUserMetadata                  userMetadata.add     → access
//   userMetadataOnboarding           userMetadata.onboarding → access
//   verifyUserMetadataElements       userMetadata.verifyElements → access
//   selectUserGroup                  user.selectGroupOnboarding → onboarding
//   enterPasswordAndAcceptInvite     workspaceInvite.acceptWithPassword → onboarding
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/platform/manageSSO";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { logout, navigateToManageUsers } from "Support/utils/common";
import { fetchAndVisitInviteLink } from "Support/utils/platform/manageUsers";
import { commonText } from "Texts/common";
import { ssoText } from "Texts/platform/manageSSO";
import { onboardingText } from "Texts/platform/onboarding";

/**
 * @tjType   signup.verifyConfirmEmail
 * @tjBlock  onboarding
 * @tjUsage  verifyConfirmEmailPage(userEmail)
 * @tjDom    confirm-email page
 */
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

/**
 * @tjType   onboardingFlow.verifyQuestions
 * @tjBlock  onboarding
 * @tjUsage  verifyOnboardingQuestions('My workspace')
 * @tjDom    onboarding questionnaire steps
 */
export const verifyOnboardingQuestions = (workspaceName) => {
  bannerElementsVerification();
  onboardingStepOne();
  onboardingStepTwo(workspaceName);
  onboardingStepThree();
};

/**
 * @tjType   workspaceInvite.verifyInvalidLink
 * @tjBlock  onboarding
 * @tjUsage  verifyInvalidInvitationLink()
 * @tjDom    invalid/expired invite page
 */
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

/**
 * @tjType   signup.submit
 * @tjBlock  onboarding
 * @tjUsage  userSignUp('QA User', userEmail, 'test')
 * @tjDom    signup form -> submit
 */
export const userSignUp = (fullName, email, workspaceName = "test") => {
  cy.intercept("GET", "/api/login-configs/public").as("publicConfig");
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
  if (Cypress.env("environment") == "Cloud") {
    cy.clearAndType(
      '[data-cy="onboarding-workspace-name-input"]',
      workspaceName
    );
  }
};

/**
 * @tjType   user.inviteViaOnboarding
 * @tjBlock  onboarding
 * @tjUsage  inviteUser('QA', userEmail)
 * @tjDom    invite then accept end to end
 */
export const inviteUser = (firstName, email) => {
  cy.apiUserInvite(firstName, email);
  fetchAndVisitInviteLink(email);
  cy.wait(1000);
  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  // cy.intercept("GET", "/api/organizations").as("org");
  cy.get(commonSelectors.signUpButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
};

/**
 * @tjType   user.addNew
 * @tjBlock  onboarding
 * @tjUsage  addNewUser('QA', userEmail)
 * @tjDom    manage users -> add user
 */
export const addNewUser = (firstName, email) => {
  navigateToManageUsers();
  inviteUser(firstName, email);
};

/**
 * @tjType   onboardingFlow.byRole
 * @tjBlock  onboarding
 * @tjUsage  roleBasedOnboarding('QA', userEmail, 'builder')
 * @tjDom    onboarding varied by role. [UNREFERENCED 2026-09-06]
 */
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

/**
 * @tjType   workspaceInvite.visit
 * @tjBlock  onboarding
 * @tjUsage  visitWorkspaceInvitation(userEmail, 'My workspace')
 * @tjDom    opens the workspace invite URL
 */
export const visitWorkspaceInvitation = (email, workspaceName) => {
  let workspaceId, userId, url, organizationToken;

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `select id from users where email='${email}';`,
    }).then((resp) => {
      userId = resp.rows[0].id;

      cy.task("dbConnection", {
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

/**
 * @tjType   signup.verifyPage
 * @tjBlock  onboarding
 * @tjUsage  SignUpPageElements()
 * @tjDom    signup page fields + copy
 */
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

/**
 * @tjType   signup.readLink
 * @tjBlock  onboarding
 * @tjUsage  signUpLink(userEmail)
 * @tjDom    reads the signup link from email. [UNREFERENCED 2026-09-06]
 */
export const signUpLink = (email) => {
  let invitationLink;
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    cy.visit(invitationLink);
    cy.wait(3000);
  });
};

/**
 * @tjType   signup.verifyBanner
 * @tjBlock  onboarding
 * @tjUsage  bannerElementsVerification()
 * @tjDom    signup page marketing banner
 */
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

/**
 * @tjType   instanceSetting.enableSignup
 * @tjBlock  onboarding
 * @tjUsage  enableInstanceSignUp(true)
 * @tjDom    instance signup toggle. [UNREFERENCED 2026-09-06]
 */
export const enableInstanceSignUp = (allow = true) => {
  const value = allow ? "true" : "false";
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${value}' WHERE key = 'ALLOW_PERSONAL_WORKSPACE';
          UPDATE instance_settings SET value = '${value}' WHERE key = 'ENABLE_SIGNUP';`,
  });
};

/**
 * @tjType   onboardingFlow.stepOne
 * @tjBlock  onboarding
 * @tjUsage  onboardingStepOne()
 * @tjDom    onboarding wizard step 1
 */
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

/**
 * @tjType   onboardingFlow.stepTwo
 * @tjBlock  onboarding
 * @tjUsage  onboardingStepTwo('My workspace')
 * @tjDom    onboarding wizard step 2
 */
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

  cy.waitForElement(commonSelectors.workspaceNameInputField);
  cy.wait(500);

  cy.clearAndType(commonSelectors.workspaceNameInputField, workspaceName);
  cy.get(commonSelectors.workspaceNameInputField).verifyVisibleElement(
    "have.value",
    workspaceName
  );

  cy.get(commonSelectors.OnbordingContinue)
    .verifyVisibleElement("have.text", "Continue")
    .click();
};

/**
 * @tjType   onboardingFlow.stepThree
 * @tjBlock  onboarding
 * @tjUsage  onboardingStepThree()
 * @tjDom    onboarding wizard step 3
 */
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

/**
 * @tjType   userMetadata.add
 * @tjBlock  access
 * @tjUsage  addUserMetadata(metadataList)
 * @tjDom    user metadata key/value rows
 */
export const addUserMetadata = (metadataList) => {
  metadataList.forEach(([key, value], index) => {
    cy.get(commonSelectors.buttonSelector("add-more"))
      .should("be.visible")
      .click();
    cy.clearAndType(
      onboardingSelectors.keyInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      `${key}`
    );
    cy.clearAndType(
      onboardingSelectors.valueInputField(
        onboardingText.userMetadataLabel,
        index
      ),
      `${value}`
    );
    cy.get(`[data-cy="user-metadata-${index}"] [data-cy="icon-hidden"]`)
      .should("be.visible")
      .click();
    cy.get(
      onboardingSelectors.deleteButton(onboardingText.userMetadataLabel, index)
    ).should("be.visible");
  });
};

/**
 * @tjType   userMetadata.onboarding
 * @tjBlock  access
 * @tjUsage  userMetadataOnboarding(...)
 * @tjDom    metadata captured during onboarding
 */
export const userMetadataOnboarding = (
  firstName,
  email,
  userRole = "builder",
  metadata
) => {
  const getMetadataCount = (meta) => {
    if (Array.isArray(meta)) {
      return meta.length;
    } else if (typeof meta === "object" && meta !== null) {
      return Object.keys(meta).length;
    }
    return 0;
  };

  const metadataCount = getMetadataCount(metadata);
  navigateToManageUsers();
  cy.apiUserInvite(firstName, email, userRole, metadata);
  fetchAndVisitInviteLink(email);
  cy.wait(1000);
  enterPasswordAndAcceptInvite();
  return cy.wrap(metadataCount);
};

/**
 * @tjType   userMetadata.verifyElements
 * @tjBlock  access
 * @tjUsage  verifyUserMetadataElements(0)
 * @tjDom    metadata row controls
 */
export const verifyUserMetadataElements = (index = 0) => {
  cy.get(onboardingSelectors.userMetadataLabel).should("be.visible");
  cy.get(onboardingSelectors.emptyKeyValueLabel).should("be.visible");
  cy.get(commonSelectors.buttonSelector("add-more"))
    .should("be.visible")
    .click();
  cy.get(onboardingSelectors.encryptedLabel).should("be.visible");
  cy.get(
    onboardingSelectors.keyInputField(onboardingText.userMetadataLabel, index)
  ).should("be.visible");
  cy.get(
    onboardingSelectors.valueInputField(onboardingText.userMetadataLabel, index)
  ).should("be.visible");
};

/**
 * @tjType   user.selectGroupOnboarding
 * @tjBlock  onboarding
 * @tjUsage  selectUserGroup('QA Team')
 * @tjDom    group picker during onboarding
 */
export const selectUserGroup = (groupName) => {
  cy.get(onboardingSelectors.userGroupSelect).should("be.visible").click();
  cy.contains(`[id*="react-select-"]`, groupName).should("be.visible").click();
  cy.get(onboardingSelectors.userGroupSelect)
    .should("contain.text", groupName)
    .click();
};

/**
 * @tjType   workspaceInvite.acceptWithPassword
 * @tjBlock  onboarding
 * @tjUsage  enterPasswordAndAcceptInvite('password')
 * @tjDom    invite page -> password -> accept
 */
export const enterPasswordAndAcceptInvite = (password = "password") => {
  cy.waitForElement(onboardingSelectors.loginPasswordInput);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
  cy.waitForElement(commonSelectors.signUpButton);
  cy.get(commonSelectors.signUpButton).click();
  cy.waitForElement(commonSelectors.acceptInviteButton);
  cy.get(commonSelectors.acceptInviteButton).click();
};
