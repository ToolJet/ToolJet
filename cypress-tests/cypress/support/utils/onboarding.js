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

export const verifyConfirmEmailPage = (email) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
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
  cy.get(commonSelectors.editEmailButton).verifyVisibleElement(
    "have.text",
    commonText.editEmailButton
  );
};

export const verifyConfirmPageElements = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.emailVerifiedText
  );

  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.continueToSetUp
  );
  cy.get(commonSelectors.setUpToolJetButton).verifyVisibleElement(
    "have.text",
    commonText.setUpToolJetButton
  );
};

export const verifyOnboardingQuestions = (fullName, workspaceName) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.userAccountNameAvatar).should("be.visible");
  cy.get(commonSelectors.createAccountCheckMark).should("be.visible");
  cy.get(commonSelectors.createAccountCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.createAccountCheckPoint
  );
  cy.get(commonSelectors.verifyEmailCheckMark).should("be.visible");
  cy.get(commonSelectors.verifyEmailCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.verifyEmailCheckPoint
  );
  cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.setUpworkspaceCheckPoint
  );

  cy.get(commonSelectors.onboardingPorgressBubble).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.companyPageHeader(fullName)
  );
  cy.get(commonSelectors.onboardingPageSubHeader).verifyVisibleElement(
    "have.text",
    commonText.onboardingPageSubHeader
  );
  cy.get(commonSelectors.companyNameInputField).should("be.visible");
  cy.get(commonSelectors.continueButton).verifyVisibleElement(
    "have.text",
    commonText.continueButton
  );
  cy.get(commonSelectors.continueButton).should("be.disabled");
  cy.clearAndType(commonSelectors.companyNameInputField, workspaceName);
  cy.get(commonSelectors.continueButton).should("be.enabled").click();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.backArrowText).verifyVisibleElement(
    "have.text",
    commonText.backArrowText
  );
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.userRolePageHeader
  );
  verifyandModifyUserRole();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.sizeOftheCompanyHeader
  );
  verifyandModifySizeOftheCompany();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    "Enter your phone number"
  );

  cy.get(".form-control").should("be.visible");
  cy.get(".tj-onboarding-phone-input-wrapper")
    .find("input")
    .type("919876543210");
  cy.get(commonSelectors.continueButton).click();
};

export const verifyInvalidInvitationLink = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");

  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkHeader
  );
  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkDescription
  );

  cy.get(commonSelectors.backtoSignUpButton).verifyVisibleElement(
    "have.text",
    commonText.backtoSignUpButton
  );
};

export const userSignUp = (fullName, email, workspaceName) => {
  const verificationFunction =
    Cypress.env("environment") === "Enterprise"
      ? verifyOnboardingQuestions
      : verifyCloudOnboardingQuestions;
  let invitationLink;
  cy.visit("/");
  cy.wait(1000);
  cy.get(commonSelectors.createAnAccountLink).realClick();
  cy.clearAndType(commonSelectors.nameInputField, fullName);
  cy.clearAndType(commonSelectors.emailInputField, email);
  cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
  cy.get(commonSelectors.signUpButton).click();

  cy.wait(500);
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    cy.visit(invitationLink);
    cy.get(commonSelectors.setUpToolJetButton).click();
    cy.wait(4000);
    verificationFunction(fullName, workspaceName);
    updateWorkspaceName(email, workspaceName);
  });
};

export const fetchAndVisitInviteLink = (email) => {
  let invitationToken,
    organizationToken,
    workspaceId,
    userId,
    url = "";

  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationToken = resp.rows[0].invitation_token;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: "select id from organizations where name='My workspace';",
    }).then((resp) => {
      workspaceId = resp.rows[0].id;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        userId = resp.rows[0].id;

        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `select invitation_token from organization_users where user_id='${userId}';`,
        }).then((resp) => {
          organizationToken = resp.rows[1].invitation_token;

          url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}`;
          cy.logoutApi();
          cy.wait(1000);
          cy.visit(url);
        });
      });
    });
  });
};

export const inviteUser = (firstName, email) => {
  cy.userInviteApi(firstName, email);
  fetchAndVisitInviteLink(email);
  cy.wait(1000);
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.clearAndType(commonSelectors.passwordInputField, "password");
  //cy.intercept("GET", "/api/organizations").as("org");
  cy.get(commonSelectors.signUpButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.acceptInviteButton).click();
};

export const addNewUser = (firstName, email) => {
  navigateToManageUsers();
  inviteUser(firstName, email);
  updateWorkspaceName(email);
};

export const updateWorkspaceName = (email, workspaceName = email) => {
  let workspaceNametimeStamp, workspaceId, userId, defuserId, defWorkspaceId;

  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from users where email='${email}';`,
  }).then((resp) => {
    userId = resp.rows[0].id;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: "select id from users where email='dev@tooljet.io';",
    }).then((resp) => {
      defuserId = resp.rows[0].id;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `SELECT organization_id FROM organization_users WHERE user_id = '${defuserId}' `,
      }).then((resp) => {
        defWorkspaceId = resp.rows[0].organization_id;
        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `SELECT organization_id FROM organization_users WHERE user_id = '${userId}'AND organization_id <> '${defWorkspaceId}';`,
        }).then((resp) => {
          workspaceId = resp.rows[0].organization_id;

          cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select name from organizations where id='${workspaceId}';`,
          }).then((resp) => {
            workspaceNametimeStamp = resp.rows[0].name;
            cy.get(commonSelectors.workspaceName).eq(0).click();
            cy.contains(`${workspaceNametimeStamp}`).should("exist");

            cy.task("updateId", {
              dbconfig: Cypress.env("app_db"),
              sql: `update organizations set name ='${workspaceName}' where name='${workspaceNametimeStamp}';`,
            });
          });
        });
      });
    });
  });
};

export const verifyCloudOnboardingQuestions = (fullName, workspaceName) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.userAccountNameAvatar).should("be.visible");
  cy.get(commonSelectors.createAccountCheckMark).should("be.visible");
  cy.get(commonSelectors.createAccountCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.createAccountCheckPoint
  );
  cy.get(commonSelectors.verifyEmailCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.verifyEmailCheckPoint
  );
  cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.setUpworkspaceCheckPoint
  );

  cy.get(commonSelectors.onboardingPorgressBubble).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.companyPageHeader(fullName)
  );
  cy.get(commonSelectors.onboardingPageSubHeader).verifyVisibleElement(
    "have.text",
    commonText.onboardingPageSubHeader
  );
  cy.get(commonSelectors.companyNameInputField).should("be.visible");
  cy.get(commonSelectors.continueButton).verifyVisibleElement(
    "have.text",
    commonText.continueButton
  );
  cy.get(commonSelectors.continueButton).should("be.disabled");
  cy.clearAndType(commonSelectors.companyNameInputField, workspaceName);
  cy.get(commonSelectors.continueButton).should("be.enabled").click();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.backArrowText).verifyVisibleElement(
    "have.text",
    commonText.backArrowText
  );
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.userRolePageHeader
  );
  verifyandModifyUserRole();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.sizeOftheCompanyHeader
  );
  verifyandModifySizeOftheCompany();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    "Enter your phone number"
  );

  cy.get(".form-control").should("be.visible");
  cy.get(".tj-onboarding-phone-input-wrapper")
    .find("input")
    .type("919876543210");
  cy.get(commonSelectors.continueButton).click();
  cy.get(".tj-base-btn").click();
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
        if (resp.rows.length === 1) {
          organizationToken = resp.rows[0].invitation_token;
          url = `/organization-invitations/${organizationToken}?oid=${workspaceId}`;

          cy.contains("td", email)
            .parent()
            .within(() => {
              cy.get("td small").should("have.text", "invited");
            });

          logout();
          cy.visit(url);
        } else {
          // Handle case where user belongs to multiple organizations with the same workspaceId
          // For example, you might display an error message or log a warning
          console.warn(`User '${email}' belongs to multiple organizations with workspaceId '${workspaceId}'.`);
        }
      });
    });
  });
};

export const SignUpPageElements = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.SignUpSectionHeader).verifyVisibleElement(
    "have.text",
    "Sign up"
  );
  cy.get(commonSelectors.signUpButton).verifyVisibleElement(
    "have.text",
    commonText.getStartedButton
  );
  cy.get(commonSelectors.signInRedirectText).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.signInRedirectText
    );
  });
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
