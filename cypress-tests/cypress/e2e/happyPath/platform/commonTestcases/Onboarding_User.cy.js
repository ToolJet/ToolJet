import * as signup from "Support/utils/selfHostSignUp";

import { dashboardText } from "Texts/dashboard";
import {
  verifyandModifyUserRole,
  verifyandModifySizeOftheCompany,
} from "Support/utils/selfHostSignUp";

import { commonText, path } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";

import {
    manageUsersElements,
    fillUserInviteForm,
    confirmInviteElements,
    selectUserGroup,
    inviteUserWithUserGroups,
    inviteUserWithUserRole,
    fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import { setSignupStatus, enableSignUp } from "Support/utils/manageSSO";
import { ssoSelector } from "Selectors/manageSSO";
import {
    SignUpPageElements,
    addNewUser,
    newInvite,
    verifyConfirmPageElements,
    visitWorkspaceInvitation,
    verifyConfirmEmailPage,
    signUpLink,
    verifyInvalidInvitationLink,
    verifyOnboardingQuestions,
    // updateWorkspaceName,
} from "Support/utils/onboarding";



import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import {
  navigateToManageUsers,
  logout,
  searchUser,
  navigateToManageGroups,
} from "Support/utils/common";
import { updateWorkspaceName } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { onboardingSelectors } from "Selectors/onboarding";


const data = {};

//selfhostsetup

describe("Self host onboarding", () => {
  beforeEach(() => {
    cy.visit("/setup");
  });

  it("verify elements on self host onboarding page", () => {
    cy.get(commonSelectors.HostBanner).should("be.visible");
    cy.get(commonSelectors.pageLogo).should("be.visible");
    cy.get(commonSelectors.AdminSetup).should("be.visible");
    cy.get(commonSelectors.SignupTerms).should("be.visible");

    cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
      "have.text",
      commonText.userNameInputLabel
    );
    cy.get(commonSelectors.nameInputField).should("be.visible");
    cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
      "have.text",
      commonText.emailInputLabel
    );
    cy.get(onboardingSelectors.emailInput).should("be.visible");
    cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
      "have.text",
      commonText.passwordLabel
    );
    cy.get(onboardingSelectors.passwordInput).should("be.visible");
    cy.get(commonSelectors.passwordHelperTextSignup).verifyVisibleElement(
      "have.text",
      commonText.passwordHelperText
    );

    cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.selfHostSignUpTermsHelperText
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

    cy.clearAndType(commonSelectors.nameInputField, "The Developer");
    cy.clearAndType(onboardingSelectors.emailInput, "dev@tooljet.io");
    cy.clearAndType(onboardingSelectors.passwordInput, "password");
    cy.get(commonSelectors.continueButton).click();

    // signup.selfHostCommonElements();
    cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
      "have.text",
      "Set up your workspace!"
    );
    cy.get(commonSelectors.workspaceNameInputLabel).verifyVisibleElement(
      "have.text",
      commonText.workspaceNameInputLabel
    );
    cy.get(commonSelectors.workspaceNameInputField).should("be.visible");
    cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
    cy.get(commonSelectors.OnbordingContinue).click();

    cy.get(commonSelectors.Skipbutton).click();
    cy.get(commonSelectors.BackLogo).click();
    cy.get(commonSelectors.Backtoapps).click();

    logout();
    cy.appUILogin();

    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
      "have.text",
      "My workspace"
    );
  });
});


//signup //check


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
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
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
  
      // cy.get(commonSelectors.pageLogo).should("be.visible");
      // cy.get('[data-cy="set-up-your-workspace!-header"]').verifyVisibleElement(
      //   "have.text",
      //   "Set up your workspace!"
      // );
  
      // cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
      //   "have.text",
      //   commonText.continueToSetUp
      // );
      // cy.get('[data-cy="onboarding-workspace-name-label"]').verifyVisibleElement(
      //   "have.text",
      //   "Workspace name *"
      // );
      // cy.get('[data-cy="onboarding-workspace-name-input"]').should('be.visible')
  
      // cy.wait(1000)
      // cy.clearAndType('[data-cy="onboarding-workspace-name-input"]', data.workspaceName)
      // cy.get('[data-cy="onboarding-submit-button"]').verifyVisibleElement(
      //   "have.text",
      //   "Continue"
      // );
      // cy.get('[data-cy="onboarding-submit-button"]').click();
      // cy.wait(4000);
  
      // cy.skipWalkthrough();
      logout()
  
    });
    it("Verify invalid invitation link", () => {
      cy.log(invitationLink)
      cy.visit(invitationLink);
      verifyInvalidInvitationLink();
      cy.get(commonSelectors.pageLogo).click()
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
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
      cy.get(commonSelectors.signUpButton).click();
      cy.wait(8000);
      cy.get(commonSelectors.resendEmailButton).click();
      // cy.get(commonSelectors.editEmailButton).click();
      // cy.get(onboardingSelectors.nameInput).verifyVisibleElement("have.value", data.fullName)
      // cy.get(onboardingSelectors.emailInput).verifyVisibleElement("have.value", data.email);
      // cy.get(onboardingSelectors.passwordInput).verifyVisibleElement("have.value", "");
  
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='${data.email}';`,
      }).then((resp) => {
        invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
        cy.visit(invitationLink);
  
      // cy.get(commonSelectors.pageLogo).should("be.visible");
      // cy.get('[data-cy="set-up-your-workspace!-header"]').verifyVisibleElement(
      //   "have.text",
      //   "Set up your workspace!"
      // );
  
      // cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
      //   "have.text",
      //   commonText.continueToSetUp
      // );
      // cy.get('[data-cy="onboarding-workspace-name-label"]').verifyVisibleElement(
      //   "have.text",
      //   "Workspace name *"
      // );
      // cy.get('[data-cy="onboarding-workspace-name-input"]').should('be.visible')
  
      // cy.wait(1000)
      // cy.clearAndType('[data-cy="onboarding-workspace-name-input"]', data.workspaceName)
      // cy.get('[data-cy="onboarding-submit-button"]').verifyVisibleElement(
      //   "have.text",
      //   "Continue"
      // );
      // cy.get('[data-cy="onboarding-submit-button"]').click();
      // cy.wait(4000);
  
      // cy.skipWalkthrough();
      // });
      // cy.get(commonSelectors.setUpToolJetButton).click();
      // cy.clearAndType(commonSelectors.companyNameInputField, data.workspaceName);
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
  
      // cy.get(commonSelectors.backArrow).click()
      // cy.get(commonSelectors.companyNameInputField).verifyVisibleElement("have.value", data.workspaceName);
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
      // cy.get('[data-cy="head-of-engineering-radio-button"]').check()
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
  
      // cy.get(commonSelectors.backArrow).click()
      // cy.get('[data-cy="head-of-engineering-radio-button"]').should("be.checked")
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
  
      // cy.get('[data-cy="1-10-radio-button"]').check()
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
      // cy.get(commonSelectors.backArrow).click()
      // cy.get('[data-cy="1-10-radio-button"]').should("be.checked")
      // cy.get(commonSelectors.continueButton).focus().type('{enter}');
   })
  });
  });


//login


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
  

//Forgotpassword

describe("Password reset functionality", () => {
    const data = {};
    let passwordResetLink = "";
  
    it("Verify wrong password limit", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
  
      cy.defaultWorkspaceLogin();
      addNewUser(data.firstName, data.email);
      logout();
  
      for (let i = 0; i < 5; i++) {
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, "passw");
        cy.get(onboardingSelectors.signInButton).click();
        cy.verifyToastMessage(
          commonSelectors.toastMessage,
          "Invalid credentials"
        );
      }
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, "passw");
      cy.get(onboardingSelectors.signInButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Maximum password retry limit reached, please reset your password using forgot password option"
      );
    });
    it("Verify forgot password page elements and functionality", () => {
      cy.visit("/");
      cy.get(commonSelectors.forgotPasswordLink).click();
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.forgotPasswordPageHeader).verifyVisibleElement(
        "have.text",
        commonText.forgotPasswordPageHeader
      );
      cy.get(commonSelectors.forgotPasswordPageSubHeader).verifyVisibleElement(
        "have.text",
        "New to ToolJet? Create an account"
      );
  
      cy.get(commonSelectors.createAnAccountLink).verifyVisibleElement(
        "have.text",
        commonText.createAnAccountLink
      );
  
      cy.get('[data-cy="email-input-field-label"]').verifyVisibleElement(
        "have.text",
        "Email address *"
      );
  
      cy.get('[data-cy="email-input-field-input"]').should("be.visible");
      cy.get(commonSelectors.resetPasswordLinkButton)
        .verifyVisibleElement("have.text", commonText.resetPasswordLinkButton)
        .and("be.disabled");
      cy.wait(5000);
      cy.clearAndType('[data-cy="email-input-field-input"]', data.email);
      cy.get(commonSelectors.resetPasswordLinkButton).click();
  
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        commonText.passwordResetEmailToast
      );
      cy.get(commonSelectors.pageLogo).should("be.visible");
  
      cy.get('[data-cy="check-your-mail-header"]').verifyVisibleElement(
        "have.text",
        "Check your mail"
      );
  
      cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
        "have.text",
        commonText.resetPasswordEmailDescription(data.email)
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
      cy.get(commonSelectors.backToLoginButton).verifyVisibleElement(
        "have.text",
        commonText.backToLoginButton
      );
  
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select forgot_password_token from users where email='${data.email}';`,
      }).then((resp) => {
        passwordResetLink = `/reset-password/${resp.rows[0].forgot_password_token}`;
      });
    });
    it("Verify reset password page and functionality", () => {
      cy.visit(passwordResetLink);
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get(commonSelectors.passwordResetPageHeader).verifyVisibleElement(
        "have.text",
        commonText.passwordResetPageHeader
      );
      cy.get(commonSelectors.newPasswordInputLabel).verifyVisibleElement(
        "have.text",
        commonText.newPasswordInputLabel
      );
      cy.get(commonSelectors.newPasswordInputField).should("be.visible");
      cy.get(commonSelectors.passwordHelperText)
        .eq(0)
        .verifyVisibleElement("have.text", commonText.passwordHelperText);
      cy.get(commonSelectors.confirmPasswordInputFieldLabel).verifyVisibleElement(
        "have.text",
        commonText.confirmPasswordInputFieldLabel
      );
      cy.get(commonSelectors.confirmPasswordInputField).should("be.visible");
      cy.get(commonSelectors.passwordHelperText).verifyVisibleElement(
        "have.text",
        commonText.passwordHelperText
      );
      cy.get(commonSelectors.resetPasswordButton)
        .verifyVisibleElement("have.text", commonText.resetPasswordButton)
        .and("be.disabled");
      // cy.get(commonSelectors.enterIcon).should("be.visible");
  
      cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");
  
      cy.get(commonSelectors.newPasswordInputField).clear();
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass");
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");
  
      cy.clearAndType(commonSelectors.newPasswordInputField, "Pass");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "Pass");
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");
  
      cy.clearAndType(commonSelectors.newPasswordInputField, "password1");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "password");
      cy.get(commonSelectors.resetPasswordButton).should("be.disabled");
  
      cy.clearAndType(commonSelectors.newPasswordInputField, "Password");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "password");
      cy.get('[data-cy="confirm-password-input-error"]').verifyVisibleElement(
        "have.text",
        "Passwords don't match"
      );
  
      cy.clearAndType(commonSelectors.newPasswordInputField, "Password");
      cy.clearAndType(commonSelectors.confirmPasswordInputField, "Password");
      cy.get(commonSelectors.resetPasswordButton).should("be.enabled").click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        commonText.passwordResetSuccessToast
      );
  
      cy.get(commonSelectors.pageLogo).should("be.visible");
      cy.get('[data-cy="password-has-been-reset-header"]').verifyVisibleElement(
        "have.text",
        commonText.passwordResetSuccessPageHeader
      );
      cy.get(commonSelectors.resetPasswordPageDescription).verifyVisibleElement(
        "have.text",
        commonText.resetPasswordPageDescription
      );
      cy.get(commonSelectors.backToLoginButton).verifyVisibleElement(
        "have.text",
        commonText.backToLoginButton
      );
    });
    it("Verify user login using new password", () => {
      cy.visit("/");
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, "Password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.get(commonSelectors.workspaceName).should("be.visible");
    });
  });
  

//Invite Flow

describe("user invite flow cases", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });
    it("should verify the user signup after invited in a workspace", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.companyName;

        setSignupStatus(true);
        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.logoutApi();

        cy.visit("/");
        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.signUpName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.wait(1000);
        signUpLink(data.email);
        cy.wait(1000);
        // verifyOnboardingQuestions(data.signUpName, data.workspaceName);
        visitWorkspaceInvitation(data.email, "My workspace");
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, usersText.password);
        cy.get(onboardingSelectors.signInButton).click();

        cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
            "have.text",
            data.signUpName
        );
        cy.get(commonSelectors.acceptInviteButton).click();
    });

    it("should verify the user signup after invited in a workspace", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.companyName;

        setSignupStatus(true);
        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.wait(5000);

        cy.clearAndType(onboardingSelectors.nameInput, data.signUpName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "The user is already registered. Please check your inbox for the activation link"
        );
    });

    it("should verify exisiting user workspace signup from instance using form", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.firstName.toLowerCase();

        setSignupStatus(true);
        navigateToManageUsers();
        addNewUser(data.firstName, data.email);
        logout();
        cy.wait(3000);
        cy.get(commonSelectors.createAnAccountLink).click();
        cy.wait(1000);
        cy.clearAndType(onboardingSelectors.nameInput, data.firstName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "User already exists in the workspace."
        );
        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        cy.wait(3000)
        setSignupStatus(true, data.workspaceName);
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.firstName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();

        cy.defaultWorkspaceLogin();
        visitWorkspaceInvitation(data.email, data.workspaceName);
        cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
        logout();
    });
});


//Manage Users

describe("Manage Users", () => {
    beforeEach(() => {
      cy.defaultWorkspaceLogin();
    });
    let invitationToken,
      organizationToken,
      workspaceId,
      userId,
      url = "";
    it("Should verify the Manage users page", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
      navigateToManageUsers();
  
      manageUsersElements();
  
      cy.get(commonSelectors.cancelButton).click();
      cy.get(usersSelector.usersPageTitle).should("be.visible");
      cy.get(usersSelector.buttonAddUsers).click();
  
      cy.get(usersSelector.buttonInviteUsers).should('be.disabled');
  
  
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
      cy.get(commonSelectors.inputFieldEmailAddress).clear();
      cy.get(usersSelector.emailError).verifyVisibleElement(
        "have.text",
        "Email is not valid"
      );
      cy.get(usersSelector.buttonInviteUsers).should('be.disabled');
  
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType(
        commonSelectors.inputFieldEmailAddress,
        usersText.adminUserEmail
      );
      cy.get(usersSelector.buttonInviteUsers).click();
  
      cy.get('[data-cy="modal-icon"]').should('be.visible')
      cy.get('[data-cy="modal-header"]').verifyVisibleElement("have.text", "Duplicate email");
      cy.get(commonSelectors.modalMessage).verifyVisibleElement("have.text", "Duplicate email found. Please provide a unique email address.")
      cy.get('[data-cy="close-button"]:eq(1)').should('be.visible').click();
      cy.get(commonSelectors.inputFieldEmailAddress).should("have.value", usersText.adminUserEmail)
  
    });
  
    it("Should verify the confirm invite page and new user account", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
      // cy.removeAssignedApps();
  
      navigateToManageUsers();
      fillUserInviteForm(data.firstName, data.email);
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.wait(2000);
      fetchAndVisitInviteLink(data.email);
      confirmInviteElements(data.email);
  
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, "pass");
      cy.get(commonSelectors.signUpButton).should("be.disabled");
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, usersText.password);
      cy.get(commonSelectors.signUpButton).should("not.be.disabled");
      cy.get(commonSelectors.signUpButton).click();
  
      cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageHeader
      );
      cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageSubHeader
      );
      // cy.verifyLabel("Name");
      cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
        "have.text",
        data.firstName
      );
      // cy.verifyLabel("Email");
  
      cy.get(commonSelectors.invitedUserEmail).verifyVisibleElement(
        "have.text",
        data.email
      );
      cy.get(commonSelectors.acceptInviteButton)
        .verifyVisibleElement("have.text", commonText.acceptInviteButton)
        .click();
      cy.get(commonSelectors.workspaceName).verifyVisibleElement(
        "have.text",
        "My workspace"
      );
      updateWorkspaceName(data.email);
  
      logout();
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.contains("td", data.email)
        .parent()
        .within(() => {
          cy.get("td small").should("have.text", usersText.activeStatus);
        });
    });
  
    it("Should verify the user archive functionality", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
  
      addNewUser(data.firstName, data.email);
      cy.logoutApi();
  
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.wait(1000);
      cy.get(usersSelector.userActionButton).click();
      cy.get('[data-cy="archive-button"]').click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        usersText.archivedToast
      );
  
      cy.contains("td", data.email)
        .parent()
        .within(() => {
          cy.get("td small").should("have.text", usersText.archivedStatus);
        });
  
      logout();
      cy.visit("/");
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, usersText.password);
      cy.get(onboardingSelectors.signInButton).click();
  
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.wait(1000);
      cy.get(usersSelector.userActionButton).click();
      cy.get('[data-cy="archive-button"]').click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        usersText.unarchivedToast
      );
  
      visitWorkspaceInvitation(data.email, "My workspace");
  
      cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.get(usersSelector.acceptInvite).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
      logout();
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.contains("td", data.email)
        .parent()
        .within(() => {
          cy.get("td small").should("have.text", usersText.activeStatus);
        });
    });
  
    it("Should verify the user onboarding with groups", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
      data.groupName1 = fake.firstName.replaceAll("[^A-Za-z]", "");
      data.groupName2 = fake.firstName.replaceAll("[^A-Za-z]", "");
  
  
      const groupNames = ["All users", "Admin"];
  
      navigateToManageUsers();
  
      fillUserInviteForm(data.firstName, data.email);
      cy.wait(1500);
      cy.get('[data-cy="user-group-select"]>>>>>').dblclick();
      cy.get("body").then(($body) => {
        if (!$body.find('[data-cy="user-group-select"]>>>>>').length > 0) {
          cy.get('[data-cy="user-group-select"]>>>>>').click();
        }
      });
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Test");
      cy.get(commonSelectors.cancelButton).click();
  
      cy.get(usersSelector.buttonAddUsers).click();
      selectUserGroup("Admin");
      cy.get(".selected-value").verifyVisibleElement("have.text", "Admin");
      cy.get(commonSelectors.cancelButton).click();
  
      cy.get(usersSelector.buttonAddUsers).click();
      cy.get('.selected-value').should('have.text', "End-user")
      cy.get(commonSelectors.cancelButton).click();
  
      inviteUserWithUserRole(data.firstName, data.email, "Admin");
  
      navigateToManageGroups();
      cy.get(groupsSelector.groupLink("Admin")).click();
      cy.get(groupsSelector.usersLink).click();
      cy.get(groupsSelector.userRow(data.email)).should("be.visible");
  
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
  
      cy.get(groupsSelector.createNewGroupButton).click();
      cy.clearAndType(groupsSelector.groupNameInput, data.groupName1);
      cy.get(groupsSelector.createGroupButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        groupsText.groupCreatedToast
      );
      cy.get(groupsSelector.createNewGroupButton).click();
      cy.clearAndType(groupsSelector.groupNameInput, data.groupName2);
      cy.get(groupsSelector.createGroupButton).click();
  
      navigateToManageUsers();
      inviteUserWithUserGroups(
        data.firstName,
        data.email,
        data.groupName1,
        data.groupName2
      );
      logout();
      cy.wait(3000);
      cy.defaultWorkspaceLogin();
      navigateToManageGroups();
      cy.get(groupsSelector.groupLink(data.groupName1)).click();
      cy.get(groupsSelector.usersLink).click();
      cy.get(groupsSelector.userRow(data.email)).should("be.visible");
      cy.get(groupsSelector.groupLink(data.groupName2)).click();
      cy.get(groupsSelector.usersLink).click();
      cy.get(groupsSelector.userRow(data.email)).should("be.visible");
    });
  
    it("Should verify the edit user feature", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
  
      addNewUser(data.firstName, data.email);
      cy.logoutApi();
  
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).verifyVisibleElement(
        "have.text",
        "Edit user details"
      );
      cy.get('[data-cy="archive-button"]').verifyVisibleElement(
        "have.text",
        "Archive user"
      );
  
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get(usersSelector.addUsersCardTitle).verifyVisibleElement(
        "have.text",
        "Edit user details"
      );
      cy.get(commonSelectors.labelFullNameInput).verifyVisibleElement(
        "have.text",
        "Name"
      );
      cy.get(commonSelectors.inputFieldFullName).verifyVisibleElement(
        "have.value",
        data.firstName
      );
      cy.get(commonSelectors.labelEmailInput).verifyVisibleElement(
        "have.text",
        "Email address"
      );
      cy.get(commonSelectors.inputFieldEmailAddress).verifyVisibleElement(
        "have.value",
        data.email
      );
      cy.get(commonSelectors.groupInputFieldLabel).verifyVisibleElement(
        "have.text",
        "User groups"
      );
      cy.get('[data-cy="user-group-select"]>>>>>').should("be.visible");
      cy.get(commonSelectors.cancelButton).verifyVisibleElement(
        "have.text",
        "Cancel"
      );
      cy.get(usersSelector.buttonInviteUsers).verifyVisibleElement(
        "have.text",
        "Update"
      );
  
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(commonSelectors.cancelButton).click();
  
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(usersSelector.buttonInviteUsers).click();
  
      cy.get('[data-cy="modal-title"] > .tj-text-md').verifyVisibleElement("have.text", "Edit user role")
      cy.get('[data-cy="user-email"]').verifyVisibleElement("have.text", data.email);
      cy.get('[data-cy="modal-body"]>').verifyVisibleElement("have.text", "Updating the user's details will change their role from end-user to admin. Are you sure you want to continue?");
      cy.get('.modal-footer > [data-cy="cancel-button"]').verifyVisibleElement("have.text", "Cancel");
      cy.get('[data-cy="confim-button"]').verifyVisibleElement("have.text", "Continue");
      cy.get('[data-cy="modal-close-button"]').should('be.visible').click();
  
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(commonSelectors.cancelButton).click();
  
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.get('.modal-footer > [data-cy="cancel-button"]').click()
  
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(commonSelectors.cancelButton).click();
  
      cy.get(usersSelector.userActionButton).click();
      cy.get(usersSelector.editUserDetailsButton).click();
      cy.get('[data-cy="user-group-select"]>>>>>').eq(0).type("Admin");
      cy.wait(1000);
      cy.get('[data-cy="group-check-input"]').eq(0).check();
  
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.get('[data-cy="confim-button"]').click()
  
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "User has been updated"
      );
  
      searchUser(data.email);
      cy.get('[data-name="role-header"] [data-cy="group-chip"]').should("have.text", "Admin");
    });
  
    it("Should verify exisiting user invite flow", () => {
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
      const workspaceName = data.firstName.toLowerCase();
  
      addNewUser(data.firstName, data.email);
      logout();
  
      cy.defaultWorkspaceLogin();
      cy.apiCreateWorkspace(workspaceName, workspaceName);
      cy.visit(workspaceName);
  
      navigateToManageUsers();
      fillUserInviteForm(data.firstName, data.email);
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.wait(2000);
      visitWorkspaceInvitation(data.email, workspaceName);
      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.Loginemailinput, data.email);
      cy.clearAndType(onboardingSelectors.LoginpasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.get(usersSelector.acceptInvite).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
      logout();
  
      cy.defaultWorkspaceLogin();
      navigateToManageUsers();
      searchUser(data.email);
      cy.contains("td", data.email)
        .parent()
        .within(() => {
          cy.get("td small").should("have.text", usersText.activeStatus);
        });
    });
  });
