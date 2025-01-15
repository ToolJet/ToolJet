import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

import {
  logout,
  navigateToAppEditor,
  verifyTooltip,
  releaseApp,
  navigateToManageGroups,
  deleteAllGroupChips,
  navigateToManageUsers,
} from "Support/utils/common";

import {
  manageUsersElements,
  fillUserInviteForm,
  inviteUserToWorkspace,
  confirmInviteElements,
  selectUserGroup,
  inviteUserWithUserGroups,
  inviteUserWithUserRole,
  fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";

import * as groups from "Support/utils/manageGroups";
import { commonText } from "Texts/common";
import { userSignUp } from "Support/utils/onboarding";

import {
  setSignupStatus,
  setSignupStatusCreatedWorkspace,
} from "Support/utils/manageSSO";

import { addAppToGroup } from "Support/utils/manageGroups";
import { ssoSelector } from "Selectors/manageSSO";

import {
  verifyConfirmEmailPage,
  visitWorkspaceInvitation,
} from "Support/utils/onboarding";

import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { onboardingSelectors } from "Selectors/onboarding";

describe(
  "App share functionality",
  {
    retries: {
      runMode: 2,
    },
  },

  () => {
    const data = {};
    let invitationLink = "";

    beforeEach(() => {
      cy.defaultWorkspaceLogin();
      cy.skipWalkthrough();

      data.appName = `${fake.companyName} App`;
      data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
      data.slug = fake.firstName.toLowerCase();
      data.slug1 = fake.firstName.toLowerCase();
      data.firstName = fake.firstName;
      data.email = fake.email.toLowerCase();
      data.workspaceName = data.email;
      data.password = fake.password.toLowerCase();
    });

    it("Should verify restricted app access", () => {
      data.appName1 = `${fake.companyName} App`;
      data.slug1 = data.appName1.toLowerCase().replace(/\s+/g, "-");
      data.permission = data.appName1.toLowerCase().replace(/\s+/g, "-");
      setSignupStatus(true);
      cy.defaultWorkspaceLogin();
      cy.apiCreateApp(data.appName1);
      cy.openApp();
      cy.addComponentToApp(data.appName1, "text1");

      releaseApp();

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug1}`);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");
      cy.get(commonWidgetSelector.modalCloseButton).click();

      cy.backToApps();

      navigateToManageUsers();
      fillUserInviteForm(data.firstName, data.email);
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.wait(2000);
      cy.pause();
      fetchAndVisitInviteLink(data.email);
      cy.wait(3000);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );

      cy.get(commonSelectors.signUpButton).click();
      cy.get(commonSelectors.acceptInviteButton).click();
      logout();
      cy.get('[data-cy="page-logo"]').click();

      cy.defaultWorkspaceLogin();
      navigateToManageGroups();
      cy.get('[data-cy="end-user-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      cy.reload();

      cy.get('[data-cy="end-user-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      cy.wait(1000);
      deleteAllGroupChips();
      cy.wait(2000);
      cy.logoutApi();

      cy.visitSlug({ actualUrl: `/applications/${data.slug1}` });
      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );

      cy.get(onboardingSelectors.signInButton).click();
      cy.wait(1000);
      cy.get('[data-cy="modal-header"]').should(
        "have.text",
        "Restricted access"
      );
      cy.get('[data-cy="modal-description"]').should(
        "have.text",
        "You don’t have access to this app. Kindly contact admin to know more."
      );

      cy.defaultWorkspaceLogin();
      navigateToManageGroups();
      cy.get('[data-cy="end-user-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      cy.reload();

      cy.get('[data-cy="end-user-list-item"]').click();
      cy.get('[data-cy="granular-access-link"]').click();
      cy.wait(1000);
      cy.get('[data-cy="add-apps-buton"]').click();
      cy.get('[data-cy="permission-name-input"]').click().type(data.permission);
      cy.wait(500);
      cy.get('[data-cy="confim-button"]').click();
    });

    it("Verify private and public app share funtionality", () => {
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      cy.get('[data-cy="share-button-link"]>span').should("be.visible").click();
      cy.contains("This version has not been released yet").should(
        "be.visible"
      );

      cy.get(commonWidgetSelector.modalCloseButton).click();
      releaseApp();
      cy.get(commonWidgetSelector.shareAppButton).click();

      cy.get(commonWidgetSelector.copyAppLinkButton).should("be.visible");
      cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
      cy.get(commonWidgetSelector.appLink).should("be.visible");
      cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
      cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug1}`);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");

      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.forceClickOnCanvas();
      cy.backToApps();

      logout();
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug1}`,
      });

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();

      cy.wait(500);

      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();

      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        '[data-cy="draggable-widget-text1"]'
      );

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.wait(1000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(3000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug1}`,
      });
      cy.wait(2000);
      // cy.get(".text-widget-section > div").should("be.visible");
    });

    it("Verify app private and public app visibility for the same workspace user", () => {
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.dragAndDropWidget("text");
      data.slug5 = fake.firstName.toLowerCase();;
      releaseApp();
      cy.get(commonWidgetSelector.shareAppButton).click();

      for (const elements in commonWidgetSelector.shareModalElements) {
        cy.get(
          commonWidgetSelector.shareModalElements[elements]
        ).verifyVisibleElement(
          "have.text",
          commonText.shareModalElements[elements]
        );
      }

      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug5}`);
      cy.wait(2000);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");

      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.forceClickOnCanvas();

      cy.backToApps();
       
      inviteUserToWorkspace(data.firstName, data.email);
     
      logout();
      
      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug5}`,
      });
      cy.wait(3000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );
      cy.get(onboardingSelectors.signInButton).click();
      cy.wait(500);

      cy.get(".text-widget-section > div").should("be.visible");

      // visiting with valid session

      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug5}`,
      });
      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();

      cy.defaultWorkspaceLogin();
      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        '[data-cy="draggable-widget-text1"]'
      );

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();
      cy.wait(1000);
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();
      cy.wait(4000);
      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug5}`,
      });
    });

    it("Verify app private and public app visibility for the same instance user", () => {
      data.slug4 = fake.firstName.toLowerCase();
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug4}`);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");
      cy.get(commonWidgetSelector.modalCloseButton).click();

      cy.backToApps();
     
      cy.visitSlug({ actualUrl: `/applications/${data.slug4}` });
      cy.get('[data-cy="viewer-page-logo"]').click();

      // Visiting with valid session

      cy.visitSlug({ actualUrl: `/applications/${data.slug4}` });
      cy.get('[data-cy="viewer-page-logo"]').click();

      cy.logoutApi();
      
      cy.wait(4000);
      userSignUp(data.firstName, data.email, data.workspaceName);
      cy.wait(1000);
      cy.visit("/");

      logout();

      cy.defaultWorkspaceLogin();
      navigateToAppEditor(data.appName);

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.makePublicAppToggle).check();

      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      logout();

      cy.get(onboardingSelectors.signInButton, { timeout: 20000 }).should(
        "be.visible"
      );

      cy.visitSlug({ actualUrl: `/applications/${data.slug4}` });
      cy.get(".text-widget-section > div").should("be.visible");
      cy.get(commonSelectors.viewerPageLogo).click();
    });

    it("Should redirect to the workspace login page, allow signup, proceed to accept invite page, and load the app", () => {
      let invitationToken = "";
      let organizationToken = "";
      let workspaceId = "";
      let userId = "";
      let url = "";
      data.slug2 = fake.firstName.toLowerCase();
      setSignupStatus(true);
      cy.apiCreateApp(data.appName);
      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug2}`);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();
      cy.logoutApi();
      cy.visitSlug({ actualUrl: `/applications/${data.slug2}` });

      cy.get(commonSelectors.createAnAccountLink).click();
      cy.wait(4000);
      cy.clearAndType(commonSelectors.inputFieldFullName, data.firstName);
      cy.clearAndType(commonSelectors.inputFieldEmailAddress, data.email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, data.password);
      cy.get(commonSelectors.signUpButton).click();
      verifyConfirmEmailPage(data.email);

      cy.apiLogin();
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='${data.email}';`,
      }).then((resp) => {
        invitationToken = resp.rows[0].invitation_token;
        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: "select id from organizations where name='My workspace';",
        }).then((resp) => {
          workspaceId = resp.rows[0].id;
          cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select id from users where email='${data.email}';`,
          }).then((resp) => {
            userId = resp.rows[0].id;
            cy.task("updateId", {
              dbconfig: Cypress.env("app_db"),
              sql: `select invitation_token from organization_users where user_id='${userId}';`,
            }).then((resp) => {
              organizationToken = resp.rows[1].invitation_token;
              // normal flow
              // url = `http://localhost:8082/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug2}`;
              // subpath flow
              url = `http://localhost:3000/apps/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug2}`;

              cy.logoutApi();
              cy.wait(1000);
              cy.visit(url);
            });
          });
        });
      });
    });
  
    // need to run after bug fixes(getting blank screen for user )
    it.skip("Should verify private app accees for existing workspace user", () => {
      let invitationToken = "";
      let organizationToken = "";
      let workspaceId = "";
      let userId = "";
      let url = "";

      data.workspaceName = data.firstName;
      data.workspaceSlug = data.firstName.toLowerCase();
      let workspaceName = data.workspaceName.replaceAll("[^A-Za-z]", "");
      //adding user to workspace

      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.visit(`${data.workspaceSlug}`);
      cy.wait(2000);
      logout();
      cy.get('[data-cy="page-logo"]').click();

      cy.defaultWorkspaceLogin();
      cy.apiCreateApp(data.appName);

      cy.openApp();
      cy.addComponentToApp(data.appName, "text1");

      releaseApp();

      cy.wait(1000);
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
      cy.get('[data-cy="app-slug-accepted-label"]')
        .should("be.visible")
        .and("have.text", "Slug accepted!");
      cy.get(commonWidgetSelector.modalCloseButton).click();
      cy.backToApps();

      cy.get('[data-cy="settings-icon"]').click();
      cy.get('[data-cy="workspace-settings"]').click();
      cy.get('[data-cy="workspace-login-list-item"]').click();
      cy.get('[data-cy="enable-sign-up-toggle"]').click();
      cy.get('[data-cy="save-button"]').click();

      cy.logoutApi();
      cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

      cy.get(commonSelectors.createAnAccountLink).click();
      cy.wait(4000);
      cy.clearAndType(commonSelectors.inputFieldFullName, "abc@tooljet.com");
      cy.clearAndType(
        commonSelectors.inputFieldEmailAddress,
        "abc@tooljet.com"
      );
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(commonSelectors.signUpButton).click();

      cy.apiLogin();
      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='abc@tooljet.com';`,
      }).then((resp) => {
        invitationToken = resp.rows[0].invitation_token;
        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `select id from organizations where name='${workspaceName}';`,
        }).then((resp) => {
          workspaceId = resp.rows[0].id;
          cy.task("updateId", {
            dbconfig: Cypress.env("app_db"),
            sql: `select id from users where email='abc@tooljet.com';`,
          }).then((resp) => {
            userId = resp.rows[0].id;
            cy.task("updateId", {
              dbconfig: Cypress.env("app_db"),
              sql: `select invitation_token from organization_users where user_id='${userId}';`,
            }).then((resp) => {
              organizationToken = resp.rows[1].invitation_token;
              url = `https://app.tooljet.com/organization-invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}&redirectTo=%2Fapplications%2F${data.slug}`;
              cy.logoutApi();
              cy.wait(1000);
              cy.visit(url);
              cy.get(".text-widget-section > div").should("be.visible");
            });
          });
        });
      });
    });

    // need to run after bug fixes(getting blank screen for user )
    it.skip("Should verify private app access for the same workspace user", () => {
      data.workspaceName = data.firstName;
      data.workspaceSlug = data.firstName.toLowerCase();
      let workspaceName = data.workspaceName;
      data.appName1 = `${fake.companyName} App`;
      // Visiting editor URL with the same workspace user
      setSignupStatus(true);
      cy.apiCreateApp(data.appName1);
      cy.openApp();
      cy.wait(2000);
      cy.dragAndDropWidget("text");
      // cy.addComponentToApp(data.appName1, "text");
      
      cy.url().then((currentUrl) => {
        cy.backToApps();
        cy.wait(2000);
        logout();
        cy.wait(2000);
        cy.visit(currentUrl);
       
      });

      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
     
      cy.get(".text-widget-section > div").should("be.visible");

      cy.backToApps();
      logout();

      // Visiting preview URL with the same workspace user
      cy.defaultWorkspaceLogin();
      setSignupStatus(true);

      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        '[data-cy="draggable-widget-text1"]'
      );
      cy.dragAndDropWidget("text");
      cy.openInCurrentTab('[data-cy="preview-link-button"]');

      cy.url().then((currentUrl) => {
        cy.get('[data-cy="viewer-page-logo"]').click();
        logout();
        cy.visit(currentUrl);
      });

      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(onboardingSelectors.signInButton).click();
      cy.get(".text-widget-section > div").should("be.visible");
    });

    it("Should verify private app access for a different workspace user", () => {
      // Visiting editor URL with a different workspace URL
      data.workspaceName = data.firstName;
      data.workspaceSlug = data.firstName.toLowerCase();
      let workspaceName = data.workspaceName.replaceAll("[^A-Za-z]", "");
      cy.defaultWorkspaceLogin();
      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.visit(`${data.workspaceSlug}`);

      navigateToManageUsers();
      fillUserInviteForm(data.firstName, data.email);
      cy.get(usersSelector.buttonInviteUsers).click();
      cy.wait(2000);

      fetchAndVisitInviteLink(data.email);
      cy.wait(2000);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );
      cy.get(commonSelectors.signUpButton).click();
      cy.get(commonSelectors.acceptInviteButton).click();

      logout();
      cy.get('[data-cy="page-logo"]').click();
      cy.defaultWorkspaceLogin();

      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        '[data-cy="draggable-widget-text1"]'
      );
      cy.url().then((currentUrl) => {
        cy.backToApps();
        logout();
        cy.visit(currentUrl);
      });

      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );
      cy.get(onboardingSelectors.signInButton).click();
      cy.get(commonSelectors.toastMessage).verifyVisibleElement(
        "have.text",
        "Invalid credentials"
      );

      // Visiting preview URL with the different workspace user
      cy.defaultWorkspaceLogin();

      cy.openApp(
        "appSlug",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        '[data-cy="draggable-widget-text1"]'
      );
      cy.openInCurrentTab('[data-cy="preview-link-button"]');
      cy.url().then((currentUrl) => {
        cy.get('[data-cy="viewer-page-logo"]').click();
        logout();
        cy.visit(currentUrl);
      });

      cy.wait(3000);
      cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
      cy.clearAndType(
        onboardingSelectors.loginPasswordInput,
        usersText.password
      );

      cy.get(onboardingSelectors.signInButton).click();
      cy.get(commonSelectors.toastMessage).verifyVisibleElement(
        "have.text",
        "Invalid credentials"
      );
    });

  }
);
